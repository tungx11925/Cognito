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
  estimatedCost?: number;
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
    return process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-120b';
  }

  async complete(req: AdapterCompleteRequest): Promise<AdapterCompleteResult> {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const maxTokens = Math.max(req.maxTokens || 4096, 4096);
    const completion = await groq.chat.completions.create({
      messages: req.messages.map(m => ({ role: m.role, content: m.content })) as any,
      model: req.modelName,
      temperature: req.temperature,
      max_tokens: maxTokens,
      ...(req.jsonMode && this.supportsJsonMode(req.modelName)
        ? { response_format: { type: 'json_object' as const } }
        : {}),
    });
    let text = completion.choices[0]?.message?.content || '';
    if (!text.trim() && (completion.choices[0]?.message as any)?.reasoning) {
      text = (completion.choices[0]?.message as any).reasoning;
    }
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
    return !!(key && !key.includes('your_') && !key.includes('placeholder') && key.length > 20);
  }

  supportsJsonMode(_modelName: string): boolean {
    return true; // Gemini hỗ trợ responseMimeType application/json
  }

  defaultModelName(): string {
    return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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

  /**
   * Inject hoặc khôi phục adapter phục vụ testing và mock sandbox (GAP-07)
   */
  setAdapter(provider: ProviderName, adapter: AIProviderAdapter): void {
    this.adapters[provider] = adapter;
  }

  getAdapter(provider: ProviderName): AIProviderAdapter | undefined {
    return this.adapters[provider];
  }

  // ─────────────────────────── Model resolution ───────────────────────────

  async resolveModel(
    modelId?: number | null,
    taskType?: string,
    targetTier?: 'fast' | 'balanced' | 'advanced'
  ): Promise<{
    id: number;
    model_name: string;
    display_name: string;
    tier: string;
    input_cost: number | null;
    output_cost: number | null;
    provider: ProviderName;
  } | null> {
    if (modelId) {
      const result = await db.query(
        `SELECT am.id, am.model_name, am.display_name, am.tier, am.input_cost, am.output_cost, ap.name AS provider
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
      `SELECT am.id, am.model_name, am.display_name, am.tier, am.input_cost, am.output_cost, ap.name AS provider
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
      `SELECT am.id, am.model_name, am.display_name, am.tier, am.input_cost, am.output_cost, ap.name AS provider
       FROM ai_models am
       JOIN ai_providers ap ON ap.id = am.provider_id
       WHERE am.is_active = true AND ap.is_active = true
       ORDER BY am.id ASC
       LIMIT 1`
    );
    return fallbackResult.rows[0] || null;
  }

  /** Tìm id trong bảng ai_models theo tên model */
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

  /** Tìm thông tin giá theo tên model (USD trên 1M tokens) */
  async findModelPricingByName(modelName: string): Promise<{ id: number; input_cost: number; output_cost: number } | null> {
    try {
      const result = await db.query(
        'SELECT id, input_cost, output_cost FROM ai_models WHERE model_name = $1 AND is_active = true LIMIT 1',
        [modelName]
      );
      if (!result.rows[0]) return null;
      return {
        id: result.rows[0].id,
        input_cost: Number(result.rows[0].input_cost || 0.10),
        output_cost: Number(result.rows[0].output_cost || 0.40),
      };
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
    return result.rows.map(m => {
      const adapter = this.adapters[m.provider as ProviderName];
      const isAvailable = adapter ? adapter.isAvailable() : false;
      return {
        ...m,
        is_available: isAvailable,
        isAvailable,
      };
    });
  }

  // ─────────────────────────── Cost Calculation & Budget Control ───────────────────────────

  /**
   * Tính chi phí AI ước tính theo số token thực tế và đơn giá (USD trên 1 triệu tokens).
   */
  calculateEstimatedCost(
    inputTokens: number | null,
    outputTokens: number | null,
    pricing?: { input_cost?: number | string | null; output_cost?: number | string | null } | null
  ): number {
    const inTokens = inputTokens || 0;
    const outTokens = outputTokens || 0;
    const inRate = pricing?.input_cost !== undefined && pricing?.input_cost !== null ? Number(pricing.input_cost) : 0.10;
    const outRate = pricing?.output_cost !== undefined && pricing?.output_cost !== null ? Number(pricing.output_cost) : 0.40;
    const total = (inTokens / 1_000_000) * inRate + (outTokens / 1_000_000) * outRate;
    return Number(total.toFixed(6));
  }

  private cachedDailyCost: { timestamp: number; cost: number } | null = null;

  getGlobalDailyBudgetCap(): number {
    return parseFloat(process.env.SYSTEM_AI_DAILY_BUDGET_USD || '10.0');
  }

  resetBudgetCache() {
    this.cachedDailyCost = null;
  }

  async getTodayAICost(): Promise<number> {
    const now = Date.now();
    const cacheTtl = process.env.NODE_ENV === 'test' ? 0 : 2_000;
    if (this.cachedDailyCost && cacheTtl > 0 && now - this.cachedDailyCost.timestamp < cacheTtl) {
      return this.cachedDailyCost.cost;
    }
    try {
      const res = await db.query(
        `SELECT COALESCE(SUM(estimated_cost), 0)::float as total
         FROM ai_request_logs
         WHERE created_at >= CURRENT_DATE`
      );
      const cost = parseFloat(res.rows[0]?.total || '0');
      this.cachedDailyCost = { timestamp: now, cost };
      return cost;
    } catch (err: any) {
      console.warn('[AIProvider] Failed to query today AI cost:', err?.message);
      return 0;
    }
  }

  async checkGlobalDailyBudget(): Promise<void> {
    const todayCost = await this.getTodayAICost();
    const budgetCap = this.getGlobalDailyBudgetCap();
    if (todayCost >= budgetCap) {
      console.error(`[AIProvider] CRITICAL: System daily AI budget cap exceeded! ($${todayCost.toFixed(4)} >= $${budgetCap.toFixed(4)})`);
      throw new AppError(
        `Ngân sách AI toàn hệ thống trong ngày đã chạm giới hạn an toàn ($${budgetCap.toFixed(2)}/ngày). Vui lòng thử lại vào ngày mai hoặc liên hệ quản trị viên.`,
        429,
        'SYSTEM_AI_BUDGET_EXCEEDED'
      );
    }
  }

  // ─────────────────────────── Chat / Completion ───────────────────────────

  private buildProviderOrder(
    resolved: { provider: ProviderName } | null,
    totalChars = 0,
    hasExplicitModel = false
  ): ProviderName[] {
    const longDocThreshold = Number(process.env.AI_LONG_DOC_CHAR_THRESHOLD || 8000);
    // Nếu tài liệu dài > 8.000 ký tự (AI_LONG_DOC_CHAR_THRESHOLD) và không ép chọn model cụ thể,
    // ưu tiên Gemini trước Groq (miễn là Gemini khả dụng)
    if (!hasExplicitModel && totalChars > longDocThreshold && this.adapters.gemini.isAvailable()) {
      return ['gemini', 'groq'];
    }

    const groqAdapter = this.adapters['groq'];
    // Ưu tiên Groq trước vì tốc độ chip LPU siêu nhanh (~800ms)
    if (groqAdapter && groqAdapter.isAvailable()) {
      return ['groq', 'gemini'];
    }
    if (resolved) {
      const other: ProviderName = resolved.provider === 'groq' ? 'gemini' : 'groq';
      return [resolved.provider, other];
    }
    return ['groq', 'gemini'];
  }

  private async logRequest(params: {
    userId?: number | null;
    documentId?: number | null;
    taskType: string;
    modelId: number | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    estimatedCost?: number | null;
    latencyMs?: number;
    status: 'success' | 'failed' | 'timeout';
    errorMessage?: string | null;
  }): Promise<void> {
    if (!this.logsAvailable) return;
    try {
      await db.query(
        `INSERT INTO ai_request_logs
           (user_id, document_id, task_type, model_id, input_tokens, output_tokens, estimated_cost, latency_ms, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          params.userId ?? null,
          params.documentId ?? null,
          params.taskType,
          params.modelId,
          params.inputTokens ?? null,
          params.outputTokens ?? null,
          params.estimatedCost ?? 0,
          params.latencyMs ?? null,
          params.status,
          params.errorMessage ? params.errorMessage.substring(0, 1000) : null,
        ]
      );
      if (params.estimatedCost && this.cachedDailyCost) {
        this.cachedDailyCost.cost += params.estimatedCost;
      }
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
   * Gọi AI qua adapter tương ứng model đã chọn hoặc tier yêu cầu.
   * - Token / Prompt Length limit: chặn prompt vượt quá 32,000 ký tự (~8,000 tokens).
   * - Global Daily Budget Cap: kiểm tra trần chi tiêu toàn hệ thống trong ngày.
   * - Failover & Timeout: mặc định 30s timeout, nếu lỗi/timeout lập tức failover sang provider phụ.
   * - Ghi nhận số token và chi phí thực tế (estimated_cost) vào ai_request_logs.
   */
  async chat(options: ProviderChatOptions): Promise<ProviderChatResult> {
    // 1. Kiểm tra độ dài prompt (Cost & Token Limit per request)
    const MAX_PROMPT_CHARS = 32_000;
    const totalChars = (options.messages || []).reduce((acc, m) => acc + (m.content?.length || 0), 0);
    if (totalChars > MAX_PROMPT_CHARS) {
      throw new AppError(
        `Nội dung yêu cầu AI (${totalChars} ký tự) vượt quá giới hạn tối đa cho phép (${MAX_PROMPT_CHARS} ký tự). Vui lòng rút ngắn nội dung tài liệu hoặc câu hỏi.`,
        400,
        'PROMPT_TOO_LARGE'
      );
    }

    // 2. Kiểm tra ngân sách AI toàn hệ thống trong ngày (Global Budget Cap)
    await this.checkGlobalDailyBudget();

    const resolved = await this.resolveModel(options.modelId, options.taskType, options.tier).catch(() => null);
    const temperature = options.temperature ?? 0.6;
    const maxTokens = Math.min(options.maxTokens ?? 4096, 4096);
    // Timeout cấu hình linh hoạt: flashcard mặc định ~15s (AI_FLASHCARD_TIMEOUT_MS), câu hỏi 45s, các task khác 30s
    const flashcardTimeout = Number(process.env.AI_FLASHCARD_TIMEOUT_MS) || 15_000;
    const timeoutMs = options.timeoutMs ?? (
      options.taskType === 'flashcard' ? flashcardTimeout :
      (options.taskType === 'question_generation' ? 45_000 : 30_000)
    );

    let lastError: any = null;

    for (const providerName of this.buildProviderOrder(resolved, totalChars, !!options.modelId)) {
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

        // Tra cứu đơn giá model để tính chi phí thực tế
        const pricing = resolved && resolved.provider === providerName
          ? { input_cost: resolved.input_cost, output_cost: resolved.output_cost }
          : await this.findModelPricingByName(modelName);
        const estimatedCost = this.calculateEstimatedCost(result.inputTokens, result.outputTokens, pricing);

        this.logRequest({
          userId: options.userId,
          documentId: options.documentId,
          taskType: options.taskType,
          modelId,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost,
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
          estimatedCost,
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
      throw new AppError('AI phản hồi quá thời gian cho phép (timeout). Vui lòng thử lại hoặc chọn model khác.', 504);
    }
    throw new AppError(
      'Dịch vụ AI hiện không khả dụng hoặc chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
      503
    );
  }

  /** Alias cho chat — thống nhất gọi API theo adapter */
  async generate(options: ProviderChatOptions): Promise<ProviderChatResult> {
    return this.chat(options);
  }

  /**
   * Gọi AI (model fast) 1 lần duy nhất để chấm điểm độ quan trọng của tất cả các slides.
   * Dùng cho STAGE 2 của thuật toán MCQ.
   */
  async getAiSalienceScores(slides: { id: number; title: string; keywords: string[] }[]): Promise<Record<number, number>> {
    if (slides.length === 0) return {};
    const slideText = slides.map(s => `[ID: ${s.id}] Tiêu đề: ${s.title || '(Không có)'} | Từ khoá: ${s.keywords.join(', ')}`).join('\n');
    
    const prompt = `Bạn là một chuyên gia phân tích bài giảng. Dưới đây là danh sách các slide (gồm ID, tiêu đề và từ khoá) của một bài giảng.
Hãy chấm điểm độ quan trọng cốt lõi (từ 1 đến 10) cho nội dung của TỪNG slide dựa trên mức độ quan trọng của nó đối với việc ra đề thi. 
- Slide chứa định nghĩa, quy trình, khái niệm chính, phân loại -> Điểm cao (7-10).
- Slide giới thiệu, mục lục, chào hỏi, kết luận, cảm ơn -> Điểm thấp (1-3).
- Slide ví dụ phụ, hình ảnh minh hoạ -> Điểm trung bình (4-6).

CHỈ TRẢ VỀ JSON theo định dạng { "<ID_Slide>": <điểm_số> }. Không giải thích gì thêm.
Danh sách slide:
${slideText}`;

    try {
      const result = await this.chat({
        messages: [{ role: 'user', content: prompt }],
        tier: 'fast', // Dùng model nhanh/rẻ
        taskType: 'question_generation',
        jsonMode: true,
      });

      let parsed = {};
      try {
        let cleaned = result.text.trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) cleaned = cleaned.substring(start, end + 1);
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.error('[AIProvider] Failed to parse AI salience score JSON:', result.text);
      }

      const scores: Record<number, number> = {};
      for (const s of slides) {
        const rawScore = (parsed as any)[s.id?.toString()];
        const score = typeof rawScore === 'number' ? rawScore : parseInt(rawScore, 10);
        scores[s.id] = (!isNaN(score) && score >= 1 && score <= 10) ? score : 5; // default 5 nếu lỗi
      }
      return scores;
    } catch (error) {
      console.warn('[AIProvider] getAiSalienceScores failed, returning default scores:', error);
      const scores: Record<number, number> = {};
      slides.forEach(s => scores[s.id] = 5);
      return scores;
    }
  }

  /**
   * Tạo embeddings cho một danh sách các đoạn text (dùng Gemini text-embedding-004).
   * Hỗ trợ cho STAGE 5 Grounding & Duplicate Check.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];
    
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes('your_')) {
      console.warn('[AIProvider] GEMINI_API_KEY is not available for embeddings.');
      return texts.map(() => []);
    }

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      
      // Batch embedding
      const requests = texts.map(t => ({
        content: { role: 'user', parts: [{ text: t }] }
      }));
      
      const result = await model.batchEmbedContents({
        requests
      });
      
      return result.embeddings.map(e => e.values);
    } catch (error: any) {
      console.error('[AIProvider] generateEmbeddings failed:', error?.message);
      return texts.map(() => []);
    }
  }
}

export const aiProviderService = new AIProviderService();
export { AIProviderService, GroqAdapter, GeminiAdapter };
export type { AIProviderAdapter, AdapterCompleteRequest, AdapterCompleteResult };

