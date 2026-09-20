import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { AppError } from '../utils/AppError';

/**
 * AI Provider Service — lớp abstraction thay cho việc gọi thẳng Groq/Gemini hardcode.
 * - resolveModel(modelId) đọc từ bảng ai_models
 * - Adapter theo provider (GroqAdapter / GeminiAdapter) cùng implement 1 interface
 * - Ghi log mỗi lần gọi vào ai_request_logs (không lưu API key / prompt content)
 * - Giữ nguyên hành vi fallback cũ: thử provider ưu tiên trước, fail thì thử provider còn lại
 */

export type ProviderName = 'groq' | 'gemini';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderChatOptions {
  messages: ChatMessage[];
  /** id trong bảng ai_models — nếu bỏ trống dùng model mặc định theo env hoặc tier */
  modelId?: number | null;
  tier?: 'fast' | 'balanced' | 'advanced';
  temperature?: number;
  maxTokens?: number;
  /** Yêu cầu output JSON (chỉ bật response_format/json_mime_type khi model hỗ trợ) */
  jsonMode?: boolean;
  /** Loại task để ghi log: 'question_generation' | 'keyword_extraction' | 'chat' | 'mindmap' | 'flashcard' */
  taskType: string;
  userId?: number | null;
  documentId?: number | null;
  timeoutMs?: number;
  /** Override tên model theo provider (giữ tương thích model cũ: compound-mini, llama-3.1-8b-instant...) */
  modelOverride?: { groq?: string; gemini?: string };
}

export interface ProviderChatResult {
  text: string;
  provider: ProviderName;
  modelName: string;
  modelId: number | null;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
}

interface AdapterCompleteRequest {
  modelName: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  jsonMode: boolean;
}

interface AdapterCompleteResult {
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
}

interface AIProviderAdapter {
  readonly name: ProviderName;
  isAvailable(): boolean;
  supportsJsonMode(modelName: string): boolean;
  defaultModelName(): string;
  complete(req: AdapterCompleteRequest): Promise<AdapterCompleteResult>;
}

class GroqAdapter implements AIProviderAdapter {
  readonly name: ProviderName = 'groq';

  isAvailable(): boolean {
    const key = process.env.GROQ_API_KEY;
    return !!(key && !key.includes('your_'));
  }

  // groq/compound (agentic model) không hỗ trợ response_format json_object
  supportsJsonMode(modelName: string): boolean {
    return !modelName.includes('compound');
  }

  defaultModelName(): string {
    return process.env.GROQ_CHAT_MODEL || 'groq/compound';
  }

  async complete(req: AdapterCompleteRequest): Promise<AdapterCompleteResult> {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: req.messages.map(m => ({ role: m.role, content: m.content })) as any,
      model: req.modelName,
      temperature: req.temperature,
      max_tokens: req.maxTokens,
      ...(req.jsonMode && this.supportsJsonMode(req.modelName)
        ? { response_format: { type: 'json_object' as const } }
        : {}),
    });
    const text = completion.choices[0]?.message?.content || '';
    const usage = (completion as any)?.usage;
    return {
      text,
      inputTokens: usage?.prompt_tokens ?? null,
      outputTokens: usage?.completion_tokens ?? null,
    };
  }
}

class GeminiAdapter implements AIProviderAdapter {
  readonly name: ProviderName = 'gemini';

  isAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return !!(key && !key.includes('your_'));
  }

  supportsJsonMode(_modelName: string): boolean {
    return true; // Gemini hỗ trợ responseMimeType application/json
  }

  defaultModelName(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  async complete(req: AdapterCompleteRequest): Promise<AdapterCompleteResult> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const systemContent = req.messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const model = genAI.getGenerativeModel({
      model: req.modelName,
      ...(systemContent ? { systemInstruction: systemContent } : {}),
      generationConfig: {
        temperature: req.temperature,
        maxOutputTokens: req.maxTokens,
        ...(req.jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    });

    const turns = req.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    // Gemini bắt buộc lượt đầu là 'user'
    if (turns.length === 0 || turns[0].role !== 'user') {
      turns.unshift({ role: 'user', parts: [{ text: '(Bắt đầu)' }] });
    }

    const result = await model.generateContent({ contents: turns as any });
    const response = result.response;
    const usage = (response as any)?.usageMetadata;
    return {
      text: response.text(),
      inputTokens: usage?.promptTokenCount ?? null,
      outputTokens: usage?.candidatesTokenCount ?? null,
    };
  }
}

class AIProviderService {
  private adapters: Record<ProviderName, AIProviderAdapter> = {
    groq: new GroqAdapter(),
    gemini: new GeminiAdapter(),
  };

  private logsAvailable = true; // tắt warn lặp nếu bảng ai_request_logs chưa tồn tại

  // ─────────────────────────── Model resolution ───────────────────────────

  async resolveModel(
    modelId?: number | null,
    taskType?: string,
    targetTier?: 'fast' | 'balanced' | 'advanced'
  ): Promise<{
    id: number; model_name: string; display_name: string; tier: string; provider: ProviderName;
  } | null> {
    if (modelId) {
      const result = await db.query(
        `SELECT am.id, am.model_name, am.display_name, am.tier, ap.name AS provider
         FROM ai_models am
         JOIN ai_providers ap ON ap.id = am.provider_id
         WHERE am.id = $1 AND am.is_active = true AND ap.is_active = true`,
        [modelId]
      );
      if (result.rows[0]) return result.rows[0];
    }

    // Không có modelId: tự động chọn model theo tier hoặc taskType
    const effectiveTier = targetTier || (taskType === 'keyword_extraction' ? 'fast' : 'balanced');
    const tierResult = await db.query(
      `SELECT am.id, am.model_name, am.display_name, am.tier, ap.name AS provider
       FROM ai_models am
       JOIN ai_providers ap ON ap.id = am.provider_id
       WHERE am.tier = $1 AND am.is_active = true AND ap.is_active = true
       ORDER BY am.input_cost ASC NULLS LAST, am.id ASC
       LIMIT 1`,
      [effectiveTier]
    );

    if (tierResult.rows[0]) return tierResult.rows[0];

    // Fallback: lấy model bất kỳ đang active
    const fallbackResult = await db.query(
      `SELECT am.id, am.model_name, am.display_name, am.tier, ap.name AS provider
       FROM ai_models am
       JOIN ai_providers ap ON ap.id = am.provider_id
       WHERE am.is_active = true AND ap.is_active = true
       ORDER BY am.id ASC
       LIMIT 1`
    );
    return fallbackResult.rows[0] || null;
  }

  /** Tìm id trong bảng ai_models theo tên model (để lưu ai_model_id khi gọi bằng model mặc định env) */
  async findModelIdByName(modelName: string): Promise<number | null> {
    try {
      const result = await db.query(
        'SELECT id FROM ai_models WHERE model_name = $1 AND is_active = true LIMIT 1',
        [modelName]
      );
      return result.rows[0]?.id || null;
    } catch {
      return null;
    }
  }

  async listActiveModels() {
    const result = await db.query(
      `SELECT am.id, am.model_name, am.display_name, am.tier, am.capabilities, am.input_cost, am.output_cost, ap.name AS provider
       FROM ai_models am
       JOIN ai_providers ap ON ap.id = am.provider_id
       WHERE am.is_active = true AND ap.is_active = true
       ORDER BY 
         CASE am.tier WHEN 'fast' THEN 1 WHEN 'balanced' THEN 2 WHEN 'advanced' THEN 3 ELSE 4 END,
         ap.name, am.created_at`
    );
    return result.rows;
  }

  // ─────────────────────────── Chat / Completion ───────────────────────────

  private buildProviderOrder(resolved: { provider: ProviderName } | null): ProviderName[] {
    if (resolved) {
      const other: ProviderName = resolved.provider === 'groq' ? 'gemini' : 'groq';
      return [resolved.provider, other]; // giữ hành vi fallback chéo như code cũ
    }
    return ['groq', 'gemini']; // thứ tự mặc định cũ: Groq trước, Gemini sau
  }

  private async logRequest(params: {
    userId?: number | null;
    documentId?: number | null;
    taskType: string;
    modelId: number | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    latencyMs?: number;
    status: 'success' | 'failed' | 'timeout';
    errorMessage?: string | null;
  }): Promise<void> {
    if (!this.logsAvailable) return;
    try {
      await db.query(
        `INSERT INTO ai_request_logs
           (user_id, document_id, task_type, model_id, input_tokens, output_tokens, latency_ms, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          params.userId ?? null,
          params.documentId ?? null,
          params.taskType,
          params.modelId,
          params.inputTokens ?? null,
          params.outputTokens ?? null,
          params.latencyMs ?? null,
          params.status,
          params.errorMessage ? params.errorMessage.substring(0, 1000) : null,
        ]
      );
    } catch (err: any) {
      if (err?.code === '42P01') { // undefined_table — chưa chạy migration
        this.logsAvailable = false;
        return;
      }
      console.warn('[AIProvider] Failed to write ai_request_logs:', err?.message);
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('AI_REQUEST_TIMEOUT')), timeoutMs);
      promise.then(
        value => { clearTimeout(timer); resolve(value); },
        err => { clearTimeout(timer); reject(err); }
      );
    });
  }

  /**
   * Gọi AI qua adapter tương ứng model đã chọn hoặc tier yêu cầu. Fail/timeout → thử provider còn lại
   * (giữ nguyên fallback chain Groq → Gemini như luồng cũ). Mỗi lần gọi đều ghi log.
   */
  async chat(options: ProviderChatOptions): Promise<ProviderChatResult> {
    const resolved = await this.resolveModel(options.modelId, options.taskType, options.tier).catch(() => null);
    const temperature = options.temperature ?? 0.6;
    const maxTokens = options.maxTokens ?? 4096;
    const timeoutMs = options.timeoutMs ?? 120_000;

    let lastError: any = null;

    for (const providerName of this.buildProviderOrder(resolved)) {
      const adapter = this.adapters[providerName];
      if (!adapter || !adapter.isAvailable()) continue;

      const modelName =
        options.modelOverride?.[providerName] ||
        (resolved && resolved.provider === providerName ? resolved.model_name : adapter.defaultModelName());
      const startedAt = Date.now();

      try {
        const result = await this.withTimeout(
          adapter.complete({
            modelName,
            messages: options.messages,
            temperature,
            maxTokens,
            jsonMode: !!options.jsonMode,
          }),
          timeoutMs
        );
        if (!result.text || !result.text.trim()) {
          throw new Error('AI trả về nội dung rỗng');
        }
        const latencyMs = Date.now() - startedAt;
        const modelId = resolved && resolved.provider === providerName
          ? resolved.id
          : await this.findModelIdByName(modelName);

        this.logRequest({
          userId: options.userId,
          documentId: options.documentId,
          taskType: options.taskType,
          modelId,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs,
          status: 'success',
        }).catch(() => {});

        return {
          text: result.text,
          provider: providerName,
          modelName,
          modelId,
          latencyMs,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        };
      } catch (err: any) {
        const isTimeout = err?.message === 'AI_REQUEST_TIMEOUT';
        lastError = err;
        this.logRequest({
          userId: options.userId,
          documentId: options.documentId,
          taskType: options.taskType,
          modelId: resolved && resolved.provider === providerName ? resolved.id : null,
          latencyMs: Date.now() - startedAt,
          status: isTimeout ? 'timeout' : 'failed',
          errorMessage: `${providerName}/${modelName}: ${err?.message || 'unknown error'}`,
        }).catch(() => {});
        console.error(`[AIProvider] ${providerName}/${modelName} ${isTimeout ? 'timeout' : 'failed'}, trying next provider:`, err?.message);
      }
    }

    if (lastError?.message === 'AI_REQUEST_TIMEOUT') {
      throw new AppError('AI phản hồi quá thời gian cho phép. Vui lòng thử lại hoặc chọn model khác.', 504);
    }
    throw new AppError(
      'Dịch vụ AI hiện không khả dụng hoặc chưa được cấu hình (GROQ_API_KEY / GEMINI_API_KEY). Vui lòng liên hệ quản trị viên.',
      503
    );
  }

  /** Alias cho chat — thống nhất gọi API theo adapter */
  async generate(options: ProviderChatOptions): Promise<ProviderChatResult> {
    return this.chat(options);
  }
}

export const aiProviderService = new AIProviderService();

