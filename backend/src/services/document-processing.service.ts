import fs from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';
import { exec } from 'child_process';
import { z } from 'zod';
import { db } from '../db';
import { aiProviderService } from './ai-provider.service';
import { documentChunksRepository, DocumentChunkRow } from '../repositories/document-chunks.repository';
import { pdfToPng } from 'pdf-to-png-converter';
import Tesseract from 'tesseract.js';
import officeParser from 'officeparser';
import mammoth from 'mammoth';

const pdfParse = require('pdf-parse');

export const OCR_THRESHOLD = 30; // Ký tự tối thiểu của 1 trang, nếu ít hơn thì coi là trang scan/ảnh
export const PROCESS_TIMEOUT_MS = 5 * 60 * 1000; // 5 phút tổng timeout

const KeywordExtractionOutputSchema = z.object({
  keywords: z.array(z.string().trim().min(1).max(100)).min(1).max(25),
});

export interface DocumentChunkStatus {
  documentId: number;
  title: string;
  status: string;
  chunkCount: number;
}

export interface PageContent {
  pageNumber: number;
  text: string;
  isOcr: boolean;
}

export interface ChunkItem {
  pageNumber: number;
  content: string;
  isOcr: boolean;
  tokenCount: number;
}

// Stopwords phụ trợ cho fallback keyword heuristic
const STOPWORDS = new Set([
  'và', 'của', 'là', 'có', 'các', 'được', 'một', 'cho', 'trong', 'khi', 'này', 'đó', 'theo',
  'với', 'từ', 'trên', 'những', 'để', 'ra', 'người', 'việc', 'nếu', 'thì', 'cũng', 'như',
  'không', 'bằng', 'hay', 'hoặc', 'mỗi', 'sau', 'trước', 'giữa', 'vì', 'bị', 'đã', 'sẽ',
  'bài', 'học', 'chương', 'phần', 'mục', 'trang', 'tài', 'liệu', 'slide', 'nội', 'dung',
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our',
  'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two',
  'way', 'who', 'with', 'this', 'that', 'from', 'they', 'have', 'will', 'what', 'when',
]);

function heuristicKeywords(text: string, max = 12): string[] {
  const freq = new Map<string, number>();
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-zà-ỹ0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

class DocumentProcessingService {
  /**
   * Cập nhật trạng thái xử lý của tài liệu
   */
  async setProcessingStatus(
    documentId: number,
    status: 'PENDING' | 'PARSING' | 'CHUNKING' | 'EXTRACTING_KEYWORDS' | 'READY' | 'FAILED',
    options?: { error?: string | null; pageCount?: number | null }
  ): Promise<void> {
    const errorMsg = options?.error ? options.error.substring(0, 1000) : null;
    await db.query(
      `UPDATE documents SET
         processing_status = $2,
         status = CASE 
           WHEN $2 = 'READY' THEN 'READY' 
           WHEN $2 = 'FAILED' THEN 'FAILED' 
           ELSE 'PROCESSING' 
         END,
         processing_error = $3,
         page_count = COALESCE($4, page_count),
         processed_at = CASE WHEN $2 = 'READY' THEN CURRENT_TIMESTAMP ELSE processed_at END
       WHERE id = $1`,
      [documentId, status, errorMsg, options?.pageCount ?? null]
    );
  }

  /**
   * Tải file từ Cloudinary / URL về Buffer
   */
  async fetchFileBuffer(docUrl: string): Promise<Buffer> {
    if (!docUrl) throw new Error('Không có đường dẫn tài liệu');
    if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
      const response = await axios.get(docUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      return Buffer.from(response.data);
    }
    // Nếu là file local trong backend/uploads
    const localPath = path.isAbsolute(docUrl)
      ? docUrl
      : path.join(__dirname, '../../uploads', path.basename(docUrl));
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    throw new Error(`Không tìm thấy file tài liệu tại: ${docUrl}`);
  }

  /**
   * Chuyển đổi file sang PDF bằng LibreOffice headless nếu là PPTX / PPT / DOC
   * Nếu môi trường không có LibreOffice: fallback đọc text qua officeparser
   */
  async convertToPdfIfNeeded(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{ pdfBuffer?: Buffer; directText?: string; isConverted: boolean }> {
    const isPptx =
      mimeType.includes('presentationml') ||
      mimeType.includes('powerpoint') ||
      fileName.endsWith('.pptx') ||
      fileName.endsWith('.ppt');
    const isDoc =
      mimeType.includes('msword') ||
      mimeType.includes('wordprocessingml') ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx');

    if (!isPptx && !isDoc) {
      // Đã là PDF hoặc định dạng khác
      return { pdfBuffer: fileBuffer, isConverted: false };
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cognito-doc-'));
    const ext = isPptx ? (fileName.endsWith('.ppt') ? '.ppt' : '.pptx') : (fileName.endsWith('.doc') ? '.doc' : '.docx');
    const inputPath = path.join(tmpDir, `input_${Date.now()}${ext}`);
    fs.writeFileSync(inputPath, fileBuffer);

    // 1. Thử gọi LibreOffice headless
    try {
      const isWin = process.platform === 'win32';
      let sofficeCmd = 'soffice';
      if (isWin) {
        if (fs.existsSync('C:\\Program Files\\LibreOffice\\program\\soffice.exe')) {
          sofficeCmd = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
        } else if (fs.existsSync('C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe')) {
          sofficeCmd = '"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"';
        }
      }

      const pdfPath = await new Promise<string | null>((resolve) => {
        const cmd = `${sofficeCmd} --headless --convert-to pdf --outdir "${tmpDir}" "${inputPath}"`;
        exec(cmd, { timeout: 90000 }, (err) => {
          if (err) {
            console.warn(`[DocProcessing] LibreOffice headless not available or failed: ${err.message}`);
            return resolve(null);
          }
          const baseName = path.basename(inputPath, ext);
          const outPdf = path.join(tmpDir, `${baseName}.pdf`);
          if (fs.existsSync(outPdf)) {
            return resolve(outPdf);
          }
          resolve(null);
        });
      });

      if (pdfPath && fs.existsSync(pdfPath)) {
        const convertedPdfBuf = fs.readFileSync(pdfPath);
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return { pdfBuffer: convertedPdfBuf, isConverted: true };
      }
    } catch (libreOfficeErr: any) {
      console.warn('[DocProcessing] LibreOffice conversion exception:', libreOfficeErr?.message);
    }

    // 2. Fallback nếu không có LibreOffice: đọc text trực tiếp
    console.log('[DocProcessing] Fallback parsing directly for Office document:', fileName);
    try {
      if (isPptx) {
        const parseRes: any = await officeParser.parseOffice(inputPath);
        let directText = '';
        if (typeof parseRes === 'string') {
          directText = parseRes;
        } else if (typeof parseRes?.toText === 'function') {
          directText = parseRes.toText();
        } else if (Array.isArray(parseRes?.content)) {
          directText = parseRes.content.map((node: any) => (typeof node === 'string' ? node : node?.text || JSON.stringify(node))).join('\n');
        } else if (typeof parseRes?.content === 'string') {
          directText = parseRes.content;
        }
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return { directText, isConverted: false };
      } else if (isDoc) {
        const mammothRes = await mammoth.extractRawText({ buffer: fileBuffer });
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return { directText: mammothRes.value, isConverted: false };
      }
    } catch (parseFallbackErr: any) {
      console.error('[DocProcessing] Office fallback parse failed:', parseFallbackErr?.message);
    }

    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    return { isConverted: false };
  }

  /**
   * Trích xuất văn bản từng trang bằng pdf-parse (giữ số trang)
   */
  async extractTextByPage(pdfBuffer: Buffer): Promise<PageContent[]> {
    const pages: PageContent[] = [];

    const options = {
      pagerender: async (pageData: any) => {
        try {
          const textContent = await pageData.getTextContent();
          let lastY: any, text = '';
          for (const item of textContent.items) {
            if (lastY === item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          const pageNumber = (pageData.pageIndex || 0) + 1;
          pages.push({
            pageNumber,
            text: text || '',
            isOcr: false,
          });
          return text;
        } catch {
          return '';
        }
      },
    };

    await pdfParse(pdfBuffer, options);
    // Sắp xếp lại theo số trang tăng dần
    pages.sort((a, b) => a.pageNumber - b.pageNumber);
    return pages;
  }

  /**
   * Kiểm tra xem trang có cần chạy OCR fallback không
   */
  needsOcr(pageText: string): boolean {
    return (pageText || '').trim().length < OCR_THRESHOLD;
  }

  /**
   * Chạy OCR cho 1 trang PDF cụ thể qua pdf-to-png-converter + Tesseract.js ('vie+eng')
   * Nếu lỗi hoặc timeout ở 1 trang, log warning và trả về text rỗng, KHÔNG làm fail toàn bộ document.
   */
  async runOcr(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
    try {
      const pngPages = await pdfToPng(pdfBuffer, {
        pagesToProcess: [pageNumber],
        viewportScale: 1.5,
      });
      if (!pngPages || pngPages.length === 0 || !pngPages[0]?.content) {
        return '';
      }

      const { data } = await Tesseract.recognize(pngPages[0].content, 'vie+eng', {
        logger: () => {}, // Tắt verbose logging
      });

      return (data?.text || '').trim();
    } catch (ocrErr: any) {
      console.warn(`[DocProcessing] OCR failed for page ${pageNumber}:`, ocrErr?.message);
      return '';
    }
  }

  /**
   * Chunk text theo từng trang (không cắt ngang câu, đoạn văn 500-800 tokens, giữ page_number và is_ocr)
   */
  chunkText(pages: PageContent[]): ChunkItem[] {
    const chunks: ChunkItem[] = [];
    const MAX_CHUNK_CHARS = 2200; // ~500-700 tokens
    const MIN_CHUNK_CHARS = 100;

    for (const page of pages) {
      const pageText = (page.text || '').trim();
      if (!pageText) continue;

      // Phân tách theo đoạn văn (paragraph)
      const paragraphs = pageText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

      let currentChunk = '';
      for (const p of paragraphs) {
        if (currentChunk.length + p.length > MAX_CHUNK_CHARS && currentChunk.length >= MIN_CHUNK_CHARS) {
          chunks.push({
            pageNumber: page.pageNumber,
            content: currentChunk.trim(),
            isOcr: page.isOcr,
            tokenCount: Math.ceil(currentChunk.length / 4),
          });
          currentChunk = p;
        } else {
          currentChunk = currentChunk ? `${currentChunk}\n\n${p}` : p;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({
          pageNumber: page.pageNumber,
          content: currentChunk.trim(),
          isOcr: page.isOcr,
          tokenCount: Math.ceil(currentChunk.length / 4),
        });
      }
    }

    return chunks;
  }

  /**
   * Trích xuất 8–15 từ khoá học thuật bằng AI (1 lần duy nhất cho toàn bộ text của document)
   */
  async extractDocumentKeywords(
    fullText: string,
    userId?: number | null,
    documentId?: number | null
  ): Promise<string[]> {
    const sampleText = fullText.substring(0, 20000); // Lấy tối đa 20.000 ký tự đại diện

    try {
      const response = await aiProviderService.chat({
        messages: [
          {
            role: 'system',
            content: `Bạn là công cụ trích xuất từ khoá học thuật. Đọc nội dung tài liệu được cung cấp và trả về 8–15 từ khoá/cụm từ khoá quan trọng nhất (khái niệm, thuật ngữ chuyên môn — KHÔNG lấy từ khoá chung chung như "bài học", "chương", "phần"). Trả về đúng JSON: { "keywords": string[] }, không thêm text khác, không markdown fence.`,
          },
          {
            role: 'user',
            content: `DOCUMENT:\n${sampleText}`,
          },
        ],
        taskType: 'keyword_extraction',
        tier: 'fast',
        jsonMode: true,
        temperature: 0.2,
        maxTokens: 2048,
        userId: userId ?? null,
        documentId: documentId ?? null,
      });

      let cleaned = response.text.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = KeywordExtractionOutputSchema.safeParse(JSON.parse(cleaned));
      if (parsed.success && parsed.data.keywords.length > 0) {
        return parsed.data.keywords.map(k => k.toLowerCase().trim()).filter(k => k.length >= 2);
      }
    } catch (err: any) {
      console.warn(`[DocProcessing] AI keyword extraction error for doc ${documentId}, using heuristic fallback:`, err?.message);
    }

    // Fallback heuristic nếu AI không khả dụng
    return heuristicKeywords(fullText, 12);
  }

  /**
   * Gán lại từ khoá cho từng chunk bằng string match
   */
  async assignKeywordsToChunks(chunks: DocumentChunkRow[], keywords: string[]): Promise<void> {
    const lowerKeywords = keywords.map(k => k.toLowerCase().trim()).filter(Boolean);

    for (const chunk of chunks) {
      const contentLower = (chunk.content || '').toLowerCase();
      const matched = lowerKeywords.filter(kw => contentLower.includes(kw));
      // Nếu chunk không chứa từ nào trong top keywords, lấy 3 từ khóa phổ biến trong chunk đó
      const finalKeywords = matched.length > 0 ? matched : heuristicKeywords(chunk.content, 4);

      await documentChunksRepository.setKeywords(chunk.id, finalKeywords);
    }
  }

  /**
   * PIPELINE CHÍNH: Xử lý tài liệu end-to-end (bọc timeout ~5 phút)
   */
  async processDocument(documentId: number): Promise<void> {
    console.log(`[DocProcessing] >>> START processing document ${documentId}`);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Thời gian xử lý tài liệu vượt quá giới hạn cho phép (5 phút)')), PROCESS_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.executePipeline(documentId), timeoutPromise]);
      console.log(`[DocProcessing] <<< FINISHED processing document ${documentId}: READY`);
    } catch (err: any) {
      console.error(`[DocProcessing] !!! FAILED processing document ${documentId}:`, err?.message || err);
      await this.setProcessingStatus(documentId, 'FAILED', {
        error: err?.message || 'Lỗi xử lý tài liệu không xác định',
      }).catch(e => console.error('[DocProcessing] Failed to set FAILED status:', e));
    }
  }

  private async executePipeline(documentId: number): Promise<void> {
    // Lấy thông tin tài liệu từ DB
    const docRes = await db.query('SELECT * FROM documents WHERE id = $1', [documentId]);
    if (docRes.rows.length === 0) {
      throw new Error(`Không tìm thấy tài liệu ID ${documentId}`);
    }
    const doc = docRes.rows[0];

    // ── BƯỚC 1: PARSING ──
    await this.setProcessingStatus(documentId, 'PARSING');

    const fileBuffer = await this.fetchFileBuffer(doc.doc_url);
    const fileName = doc.title || 'document';
    const mimeType = doc.file_type || 'application/octet-stream';

    // Xử lý PPTX / DOC nếu cần
    const conversion = await this.convertToPdfIfNeeded(fileBuffer, fileName, mimeType);

    let pages: PageContent[] = [];

    if (conversion.pdfBuffer) {
      // ── BƯỚC 2: Trích xuất text theo trang (pdf-parse) ──
      pages = await this.extractTextByPage(conversion.pdfBuffer);

      // Cập nhật số trang vào documents
      if (pages.length > 0) {
        await db.query('UPDATE documents SET page_count = $2 WHERE id = $1', [documentId, pages.length]);
      }

      // ── BƯỚC 3: OCR Fallback cho các trang là ảnh/scan ──
      for (const page of pages) {
        if (this.needsOcr(page.text)) {
          console.log(`[DocProcessing] Page ${page.pageNumber} of doc ${documentId} needs OCR (< ${OCR_THRESHOLD} chars)...`);
          const ocrText = await this.runOcr(conversion.pdfBuffer, page.pageNumber);
          if (ocrText && ocrText.length > 0) {
            page.text = ocrText;
            page.isOcr = true;
            console.log(`[DocProcessing] Page ${page.pageNumber} OCR success: ${ocrText.length} chars`);
          }
        }
      }
    } else if (conversion.directText) {
      // Tài liệu phân tích text layer trực tiếp từ PPTX / DOCX (fallback không có LibreOffice)
      pages = [{
        pageNumber: 1,
        text: conversion.directText,
        isOcr: false,
      }];
    } else {
      throw new Error('Không thể phân tích hoặc chuyển đổi định dạng tệp tin này');
    }

    // Kiểm tra tổng dung lượng văn bản sau parse + OCR
    const totalChars = pages.reduce((sum, p) => sum + (p.text || '').trim().length, 0);
    if (totalChars < 50) {
      throw new Error('Không trích xuất được nội dung từ file này (tài liệu rỗng hoặc không đọc được chữ)');
    }

    // ── BƯỚC 4: CHUNKING ──
    await this.setProcessingStatus(documentId, 'CHUNKING', { pageCount: pages.length });

    const chunkItems = this.chunkText(pages);
    if (chunkItems.length === 0) {
      throw new Error('Không tạo được đoạn văn bản nào từ tài liệu');
    }

    // Xoá chunks cũ nếu có và thêm chunks mới
    await documentChunksRepository.deleteByDocument(documentId);
    const insertedChunks = await documentChunksRepository.insertChunks(
      chunkItems.map((c, idx) => ({
        document_id: documentId,
        chunk_index: idx,
        content: c.content,
        page_number: c.pageNumber,
        token_count: c.tokenCount,
        is_ocr: c.isOcr,
      }))
    );

    // ── BƯỚC 5: EXTRACTING_KEYWORDS ──
    await this.setProcessingStatus(documentId, 'EXTRACTING_KEYWORDS');

    const fullDocumentText = pages.map(p => p.text).join('\n\n');
    const docKeywords = await this.extractDocumentKeywords(fullDocumentText, doc.user_id, documentId);

    // Gán lại keywords cho từng chunk
    await this.assignKeywordsToChunks(insertedChunks, docKeywords);

    // ── BƯỚC 6: READY ──
    await this.setProcessingStatus(documentId, 'READY', { pageCount: pages.length });
  }

  /**
   * Đảm bảo tài liệu có chunks (hỗ trợ gọi từ luồng cũ)
   */
  async ensureChunked(documents: Array<{ id: number; title: string; processing_status?: string; status?: string; doc_url: string | null; file_type: string | null; user_id: number }>) {
    const result = [];
    for (const doc of documents) {
      const currentStatus = doc.processing_status || doc.status || 'PENDING';
      const chunkCount = await documentChunksRepository.countByDocument(doc.id).catch(() => 0);

      if (['PENDING', 'PARSING', 'CHUNKING', 'EXTRACTING_KEYWORDS'].includes(currentStatus)) {
        result.push({ documentId: doc.id, title: doc.title, status: currentStatus, chunkCount });
        continue;
      }

      if (chunkCount === 0 && doc.doc_url) {
        // Tự động kích hoạt pipeline nền
        this.processDocument(doc.id).catch(err => console.error(`[DocProcessing] Auto-trigger failed for doc ${doc.id}:`, err));
        result.push({ documentId: doc.id, title: doc.title, status: 'PARSING', chunkCount: 0 });
        continue;
      }

      result.push({ documentId: doc.id, title: doc.title, status: 'READY', chunkCount });
    }
    return result;
  }

  /**
   * Lấy chi tiết tài liệu kèm danh sách chunks và keywords
   */
  async getDocumentChunks(documentId: number, userId: number) {
    const docRes = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [documentId, userId]);
    if (docRes.rows.length === 0) {
      return null;
    }
    const doc = docRes.rows[0];
    const chunks = await documentChunksRepository.listByDocument(documentId);
    const keywords = await documentChunksRepository.getKeywordCatalog(documentId);

    return {
      documentId: doc.id,
      title: doc.title,
      processing_status: doc.processing_status || doc.status,
      processing_error: doc.processing_error,
      page_count: doc.page_count,
      chunk_count: chunks.length,
      keywords,
      chunks: chunks.map(c => ({
        id: c.id,
        chunk_index: c.chunk_index,
        page_number: c.page_number,
        content_preview: c.content.substring(0, 200) + (c.content.length > 200 ? '...' : ''),
        keywords: c.keywords || [],
        is_ocr: c.is_ocr,
      })),
    };
  }

  /**
   * Lấy danh sách từ khoá cho endpoint /api/documents/:id/keywords
   */
  async getDocumentKeywords(documentId: number, userId: number) {
    const data = await this.getDocumentChunks(documentId, userId);
    if (!data) return null;
    return {
      documentId: data.documentId,
      title: data.title,
      status: data.processing_status,
      chunkCount: data.chunk_count,
      keywords: data.keywords,
    };
  }
}

export const documentProcessingService = new DocumentProcessingService();

