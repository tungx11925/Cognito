import assert from 'assert';
import {
  aiProviderService,
  AIProviderAdapter,
  AdapterCompleteRequest,
  AdapterCompleteResult,
  ProviderName,
} from '../src/services/ai-provider.service';
import { AppError } from '../src/utils/AppError';

async function runGeminiFallbackMockTests() {
  console.log('========================================================================');
  console.log('       GAP-07: GEMINI FALLBACK & FAILOVER MOCK VERIFICATION SUITE');
  console.log('========================================================================\n');

  // Lưu trữ các adapter ban đầu để khôi phục sau test
  const originalGroq = aiProviderService.getAdapter('groq')!;
  const originalGemini = aiProviderService.getAdapter('gemini')!;

  try {
    // ─── TEST 1: Normal execution with Primary Provider (Groq) ───────────
    console.log('Test 1: Primary provider (Groq) hoạt động bình thường...');
    const mockGroqNormal: AIProviderAdapter = {
      name: 'groq',
      isAvailable: () => true,
      supportsJsonMode: () => true,
      defaultModelName: () => 'openai/gpt-oss-120b',
      complete: async (req: AdapterCompleteRequest): Promise<AdapterCompleteResult> => {
        return {
          text: 'Phản hồi thành công từ Groq Primary Provider',
          inputTokens: 120,
          outputTokens: 45,
        };
      },
    };
    aiProviderService.setAdapter('groq', mockGroqNormal);

    const res1 = await aiProviderService.chat({
      messages: [{ role: 'user', content: 'Xin chào Cognito AI' }],
      taskType: 'chat',
      tier: 'fast',
    });

    assert.strictEqual(res1.provider, 'groq', 'Phải dùng provider Groq');
    assert.strictEqual(res1.text, 'Phản hồi thành công từ Groq Primary Provider');
    assert.strictEqual(res1.inputTokens, 120);
    assert.strictEqual(res1.outputTokens, 45);
    console.log('  ✓ Test 1 PASSED: Groq hoàn thành thành công.\n');

    // ─── TEST 2: Groq 429 Rate Limit -> Failover to Gemini ─────────────────
    console.log('Test 2: Groq lỗi 429 Rate Limit -> Tự động Fallback sang Gemini...');
    let groqCallAttempts = 0;
    let geminiCallAttempts = 0;

    const mockGroqRateLimited: AIProviderAdapter = {
      name: 'groq',
      isAvailable: () => true,
      supportsJsonMode: () => true,
      defaultModelName: () => 'openai/gpt-oss-120b',
      complete: async (): Promise<AdapterCompleteResult> => {
        groqCallAttempts++;
        throw new Error('Groq 429 Rate Limit Exceeded: TPM quota reached');
      },
    };

    const mockGeminiSuccess: AIProviderAdapter = {
      name: 'gemini',
      isAvailable: () => true,
      supportsJsonMode: () => true,
      defaultModelName: () => 'gemini-1.5-flash',
      complete: async (req: AdapterCompleteRequest): Promise<AdapterCompleteResult> => {
        geminiCallAttempts++;
        return {
          text: 'Phản hồi dự phòng thành công từ Google Gemini Flash',
          inputTokens: 150,
          outputTokens: 60,
        };
      },
    };

    aiProviderService.setAdapter('groq', mockGroqRateLimited);
    aiProviderService.setAdapter('gemini', mockGeminiSuccess);

    const res2 = await aiProviderService.chat({
      messages: [{ role: 'user', content: 'Câu hỏi kích hoạt fallback khi Groq bị nghẽn' }],
      taskType: 'chat',
      tier: 'fast',
    });

    assert.strictEqual(groqCallAttempts, 1, 'Groq phải được gọi 1 lần và thất bại');
    assert.strictEqual(geminiCallAttempts, 1, 'Gemini phải được gọi cứu cánh 1 lần');
    assert.strictEqual(res2.provider, 'gemini', 'Kết quả trả về phải là Gemini');
    assert.strictEqual(res2.text, 'Phản hồi dự phòng thành công từ Google Gemini Flash');
    console.log('  ✓ Test 2 PASSED: Groq 429 failover sang Gemini thành công.\n');

    // ─── TEST 3: Groq Timeout -> Failover to Gemini ────────────────────────
    console.log('Test 3: Groq Timeout (treo mạng) -> Tự động Failover sang Gemini...');
    const mockGroqHangs: AIProviderAdapter = {
      name: 'groq',
      isAvailable: () => true,
      supportsJsonMode: () => true,
      defaultModelName: () => 'openai/gpt-oss-120b',
      complete: async (): Promise<AdapterCompleteResult> => {
        // Giả lập treo lâu hơn timeoutMs
        await new Promise(resolve => setTimeout(resolve, 500));
        return { text: 'Quá trễ', inputTokens: 0, outputTokens: 0 };
      },
    };

    aiProviderService.setAdapter('groq', mockGroqHangs);
    aiProviderService.setAdapter('gemini', mockGeminiSuccess);

    const res3 = await aiProviderService.chat({
      messages: [{ role: 'user', content: 'Test Groq timeout' }],
      taskType: 'chat',
      tier: 'fast',
      timeoutMs: 100, // Timeout ngắn 100ms để test nhanh
    });

    assert.strictEqual(res3.provider, 'gemini', 'Timeout ở Groq phải failover sang Gemini');
    console.log('  ✓ Test 3 PASSED: Groq timeout failover sang Gemini thành công.\n');

    // ─── TEST 4: Gemini Format & System Instruction Mapping Verification ───
    console.log('Test 4: Kiểm chứng cấu trúc tham số chuyển đổi cho Gemini Adapter...');
    let capturedReq: AdapterCompleteRequest | null = null;
    const mockGeminiInspector: AIProviderAdapter = {
      name: 'gemini',
      isAvailable: () => true,
      supportsJsonMode: () => true,
      defaultModelName: () => 'gemini-1.5-flash',
      complete: async (req: AdapterCompleteRequest): Promise<AdapterCompleteResult> => {
        capturedReq = req;
        return { text: '{"result": "ok"}', inputTokens: 50, outputTokens: 20 };
      },
    };

    aiProviderService.setAdapter('groq', mockGroqRateLimited);
    aiProviderService.setAdapter('gemini', mockGeminiInspector);

    await aiProviderService.chat({
      messages: [
        { role: 'system', content: 'Bạn là chuyên gia sư phạm Cognito AI.' },
        { role: 'user', content: 'Tạo trắc nghiệm dạng JSON' },
      ],
      taskType: 'question_generation',
      tier: 'fast',
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 2048,
    });

    assert(capturedReq !== null, 'Phải capture được request gửi tới Gemini');
    assert.strictEqual((capturedReq as any).jsonMode, true, 'jsonMode phải được truyền');
    assert.strictEqual((capturedReq as any).temperature, 0.2, 'temperature phải được truyền');
    assert.strictEqual((capturedReq as any).maxTokens, 2048, 'maxTokens phải được truyền');
    assert.strictEqual((capturedReq as any).messages.length, 2, 'Cả 2 messages phải được truyền');
    console.log('  ✓ Test 4 PASSED: Các tham số system/jsonMode/temperature cho Gemini hợp lệ.\n');

    // ─── TEST 5: Cả 2 Provider cùng lỗi -> Báo lỗi rõ ràng cho người dùng ───
    console.log('Test 5: Cả Groq và Gemini cùng lỗi -> Hệ thống ném lỗi AppError chuẩn mực...');
    const mockGeminiFailed: AIProviderAdapter = {
      name: 'gemini',
      isAvailable: () => true,
      supportsJsonMode: () => true,
      defaultModelName: () => 'gemini-1.5-flash',
      complete: async (): Promise<AdapterCompleteResult> => {
        throw new Error('Gemini API 503 Service Unavailable');
      },
    };

    aiProviderService.setAdapter('groq', mockGroqRateLimited);
    aiProviderService.setAdapter('gemini', mockGeminiFailed);

    let errorThrown: any = null;
    try {
      await aiProviderService.chat({
        messages: [{ role: 'user', content: 'Test cả 2 die' }],
        taskType: 'chat',
        tier: 'fast',
      });
    } catch (err: any) {
      errorThrown = err;
    }

    assert(errorThrown instanceof AppError, 'Phải ném ra AppError');
    assert.strictEqual(errorThrown.statusCode, 503, 'StatusCode phải là 503 Service Unavailable');
    console.log('  ✓ Test 5 PASSED: Cả 2 provider lỗi trả về 503 AppError chuẩn.\n');

    // ─── TEST 6: Prompt vượt ngưỡng tối đa (32,000 chars) -> Chặn ngay ────
    console.log('Test 6: Prompt vượt quá 32,000 ký tự -> Chặn ngay lập tức trước khi gọi API...');
    const hugePrompt = 'A'.repeat(33_000);
    let promptError: any = null;
    try {
      await aiProviderService.chat({
        messages: [{ role: 'user', content: hugePrompt }],
        taskType: 'chat',
      });
    } catch (err: any) {
      promptError = err;
    }
    assert(promptError instanceof AppError, 'Phải chặn prompt quá lớn bằng AppError');
    assert.strictEqual(promptError.code, 'PROMPT_TOO_LARGE');
    console.log('  ✓ Test 6 PASSED: Kiểm soát độ dài prompt an toàn.\n');

    console.log('========================================================================');
    console.log('🎉 GAP-07: TẤT CẢ 6/6 TEST SUITES CHO GEMINI FALLBACK ĐÃ PASS HOÀN HẢO!');
    console.log('========================================================================\n');
  } finally {
    // Luôn khôi phục lại các adapter nguyên bản sau khi test xong
    aiProviderService.setAdapter('groq', originalGroq);
    aiProviderService.setAdapter('gemini', originalGemini);
  }
}

runGeminiFallbackMockTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ GAP-07 TEST SUITE FAILED:', err);
    process.exit(1);
  });
