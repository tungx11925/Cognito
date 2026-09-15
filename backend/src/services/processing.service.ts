import axios from 'axios';
import { db } from '../db';
import { parserService } from './parser.service';
import { indexDocumentChunks, isEmbeddingConfigured } from './rag.service';

/**
 * Document Processing Pipeline (mục B)
 * Upload → Validate → Storage (Cloudinary — đã có) → Background Job:
 *   PROCESSING (parse text) → INDEXING (chunk + embedding) → READY / FAILED
 * Xử lý nặng chạy NỀN (in-process queue), không block HTTP request.
 * Frontend nhận trạng thái qua polling GET /api/documents/:id/status.
 */

export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXING' | 'READY' | 'FAILED';

interface ProcessingJob {
  documentId: number;
  userId: number;
  docUrl: string;
  fileType: string | null;
  attempts: number;
}

class ProcessingService {
  private queue: ProcessingJob[] = [];
  private processing = false;
  private readonly maxAttempts = 2;
  private readonly concurrencyDelayMs = 500;

  /**
   * Đưa tài liệu mới upload vào hàng đợi xử lý nền.
   * Gọi sau khi file đã lưu Cloudinary + bản ghi documents đã tạo.
   */
  enqueue(job: Omit<ProcessingJob, 'attempts'>): void {
    this.queue.push({ ...job, attempts: 0 });
    // Kick worker (non-blocking)
    setImmediate(() => this.runNext());
  }

  /**
   * Cập nhật trạng thái tài liệu (helper dùng chung).
   */
  async setStatus(documentId: number, status: DocumentStatus, error?: string | null): Promise<void> {
    await db.query(
      `UPDATE documents
       SET status = $2,
           processing_error = $3,
           processed_at = CASE WHEN $2 = 'READY' THEN CURRENT_TIMESTAMP ELSE processed_at END
       WHERE id = $1`,
      [documentId, status, error ?? null]
    );
  }

  private async runNext(): Promise<void> {
    if (this.processing) return;
    const job = this.queue.shift();
    if (!job) return;

    this.processing = true;
    try {
      await this.processJob(job);
    } catch (err: any) {
      console.error(`[Pipeline] Job failed for document ${job.documentId}:`, err?.message || err);
      if (job.attempts + 1 < this.maxAttempts) {
        // Retry 1 lần
        this.queue.push({ ...job, attempts: job.attempts + 1 });
        setImmediate(() => this.runNext());
        return;
      }
      await this.setStatus(job.documentId, 'FAILED', (err?.message || 'Lỗi xử lý tài liệu không xác định').substring(0, 1000))
        .catch(e => console.error('[Pipeline] Failed to set FAILED status:', e));
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.runNext(), this.concurrencyDelayMs);
      }
    }
  }

  private async processJob(job: ProcessingJob): Promise<void> {
    const { documentId, docUrl, fileType } = job;

    // ── 1. PROCESSING: tải file & trích xuất text ──
    await this.setStatus(documentId, 'PROCESSING');

    // Ảnh không có text để index → coi như hoàn tất ngay
    if (fileType && fileType.startsWith('image/')) {
      await this.setStatus(documentId, 'READY');
      return;
    }

    const text = await this.fetchAndParse(docUrl, fileType);
    if (!text || text.trim().length === 0) {
      // Không trích xuất được text (PDF scan, file rỗng...) — vẫn READY nhưng không có chunk
      await this.setStatus(documentId, 'READY');
      return;
    }

    // ── 2. INDEXING: chunk + embedding + lưu vector ──
    await this.setStatus(documentId, 'INDEXING');

    if (!isEmbeddingConfigured()) {
      // Không cấu hình embedding key: pipeline không FAIL — tài liệu vẫn dùng được,
      // RAG sẽ fallback keyword search. Ghi chú nhẹ vào processing_error.
      await this.setStatus(documentId, 'READY', null);
      console.warn(`[Pipeline] Document ${documentId}: GEMINI_API_KEY chưa cấu hình — bỏ qua indexing (fallback keyword search).`);
      return;
    }

    const { chunkCount } = await indexDocumentChunks(documentId, text);
    console.log(`[Pipeline] Document ${documentId}: indexed ${chunkCount} chunks.`);

    // ── 3. READY ──
    await this.setStatus(documentId, 'READY');
  }

  private async fetchAndParse(docUrl: string, fileType: string | null): Promise<string> {
    if (!docUrl) return '';
    try {
      // Tải file về buffer rồi parse theo MIME thật đã lưu trong DB
      const response = await axios.get(docUrl, { responseType: 'arraybuffer', timeout: 60000 });
      const buffer = Buffer.from(response.data);
      const mimetype = fileType || 'application/octet-stream';
      return await parserService.parseFromBuffer(buffer, mimetype);
    } catch (err) {
      console.error(`[Pipeline] Fetch/parse failed for ${docUrl}:`, err);
      // Thử fallback qua parserService.parseFromUrl (xác định MIME theo extension)
      return await parserService.parseFromUrl(docUrl);
    }
  }

  /**
   * Re-index thủ công (dùng cho endpoint /reprocess).
   */
  reprocess(documentId: number, userId: number, docUrl: string, fileType: string | null): void {
    this.enqueue({ documentId, userId, docUrl, fileType });
  }
}

export const processingService = new ProcessingService();