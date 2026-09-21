import { aiProviderService } from '../services/ai-provider.service';

export interface GeneratedQuestion {
  type: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'ESSAY' | 'TRUE_FALSE';
  content: string;
  score: number;
  options?: { A: string; B: string; C: string; D: string };
  correctAnswer: string | string[];
}


interface GenerateConfig {
  customPrompt: string;
  multipleChoiceCount: number;
  multipleChoiceScore: number;
  fillBlankCount: number;
  fillBlankScore: number;
  essayCount: number;
  essayScore: number;
  trueFalseCount: number;
  trueFalseScore: number;
  documentContent: string;
}

function buildSystemPrompt(cfg: GenerateConfig): string {
  return `${cfg.customPrompt}

--- LỆNH CHÍNH XÁC ---
Dựa trên NỘI DUNG TÀI LIỆU bên dưới, hãy tạo ra một bộ đề thi gồm:
- ${cfg.multipleChoiceCount} câu Trắc nghiệm (type: MULTIPLE_CHOICE) — mỗi câu ${cfg.multipleChoiceScore} điểm
- ${cfg.fillBlankCount} câu Điền từ (type: FILL_BLANK) — mỗi câu ${cfg.fillBlankScore} điểm
- ${cfg.essayCount} câu Tự luận (type: ESSAY) — mỗi câu ${cfg.essayScore} điểm
- ${cfg.trueFalseCount} câu Đúng/Sai (type: TRUE_FALSE) — mỗi câu ${cfg.trueFalseScore} điểm

ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC: Chỉ trả về một mảng JSON thuần túy (không có markdown, không có \`\`\`json), mỗi phần tử có cấu trúc:
{
  "type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "ESSAY" | "TRUE_FALSE",
  "content": "<nội dung câu hỏi>",
  "score": <điểm số>,
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },   // chỉ cho MULTIPLE_CHOICE
  "correctAnswer": "<đáp án>"   // chuỗi hoặc mảng cho FILL_BLANK
}

Với FILL_BLANK: Câu hỏi phải có dấu _____ để chỉ chỗ điền. correctAnswer là mảng các đáp án đều hợp lệ.
Với TRUE_FALSE: options là { "A": "Đúng", "B": "Sai" }, correctAnswer là "A" hoặc "B".
Với ESSAY: không cần options. correctAnswer là gợi ý đáp án.
Phân bổ đáp án ABCD đồng đều cho MULTIPLE_CHOICE.

--- NỘI DUNG TÀI LIỆU ---
${cfg.documentContent}`;
}

function parseAIResponse(raw: string): GeneratedQuestion[] {
  let cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('AI response is not an array');
  return parsed.map((q: any) => ({
    type: q.type || 'MULTIPLE_CHOICE',
    content: q.content || q.question || '',
    score: Number(q.score) || 1,
    options: q.options || undefined,
    correctAnswer: q.correctAnswer || q.correct_answer || '',
  }));
}

export interface GenerateWithAIOptions {
  /** Chọn model cụ thể từ bảng ai_models (tính năng Question Generator) */
  modelId?: number | null;
  userId?: number | null;
}

export async function generateQuestionsWithAI(
  cfg: GenerateConfig,
  opts?: GenerateWithAIOptions
): Promise<GeneratedQuestion[]> {
  const prompt = buildSystemPrompt(cfg);

  // Đi qua AIProviderAdapter (GroqAdapter → GeminiAdapter, fallback giữ nguyên hành vi cũ)
  const result = await aiProviderService.chat({
    messages: [{ role: 'user', content: prompt }],
    modelId: opts?.modelId ?? null,
    temperature: 0.6,
    maxTokens: 8000,
    taskType: 'question_generation',
    userId: opts?.userId ?? null,
  });
  return parseAIResponse(result.text);
}


export async function generateMindmapWithAI(documentTitle: string, documentContent: string): Promise<string> {
  const cleanContent = (documentContent || '').replace(/<[^>]*>?/gm, '').substring(0, 5000);
  const prompt = `Bạn là một chuyên gia vẽ Sơ Đồ Tư Duy (Mindmap Expert). Hãy đọc tài liệu dưới đây và tổng hợp kiến thức thành một Sơ Đồ Tư Duy (Mindmap) theo cú pháp Mermaid.js CHUẨN TƯ DUY TỔNG HỢP.

TIÊU ĐỀ TÀI LIỆU: ${documentTitle}
NỘI DUNG TÀI LIỆU:
${cleanContent}

NGUYÊN TẮC THIẾT KẾ SƠ ĐỒ TƯ DUY (MINDMAP RULES):
1. TUYỆT ĐỐI KHÔNG CHÉP NGUYÊN CÂU/ĐOẠN VĂN: Mỗi nút CHỈ DÙNG TỪ KHÓA SÚC TÍCH, THUẬT NGỮ, CÔNG THỨC KHÁI QUÁT (dưới 6 từ mỗi nút).
2. CẤU TRÚC PHÂN NHÁNH ĐA CHỦ ĐỀ (BẮT BUỘC có 4 đến 6 nhánh chính Cấp 1 tỏa ra xung quanh):
   - Nút gốc: root((${documentTitle.replace(/[()]/g, '')}))
   - Nhánh Cấp 1: Các trụ cột kiến thức chính (Ví dụ: Định Nghĩa, Đồ Thị Parabol, Sự Biến Thiên, Phương Trình Bậc Hai, Dạng Bài Tập, Ứng Dụng Thực Tế...).
   - Nhánh Cấp 2: Các khía cạnh cốt lõi / trường hợp / trục đối xứng / công thức.
   - Nhánh Cấp 3: Từ khóa làm rõ, công thức chi tiết hoặc giá trị cụ thể.
3. TỔNG HỢP KIẾN THỨC THÔNG MINH: Tự động hệ thống hóa và bổ sung các góc nhìn tư duy bài học đầy đủ, khoa học (Khái niệm, Đồ thị, Công thức, Các bước giải, Ứng dụng).
4. QUY TẮC CÚ PHÁP MERMAID:
   - Dòng đầu tiên: mindmap
   - Dòng thứ hai: root((Tên chủ đề chính))
   - Cấp 1 thụt lùi 2 khoảng trắng.
   - Cấp 2 thụt lùi 4 khoảng trắng.
   - Cấp 3 thụt lùi 6 khoảng trắng.
   - TUYỆT ĐỐI KHÔNG dùng ký tự đặc biệt như ngoặc (), ngoặc vuông [], dấu kép "" trong tên các nút.
   - CHỈ TRẢ VỀ DUY NHẤT MÃ MERMAID PURE (Không văn bản giải thích, KHÔNG bọc trong khối \`\`\`mermaid \`\`\`).`;

  // Đi qua AIProviderAdapter (GroqAdapter → GeminiAdapter)
  const result = await aiProviderService.chat({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    maxTokens: 2000,
    taskType: 'mindmap',
  });
  let raw = result.text;
  const idx = raw.indexOf('mindmap');
  if (idx !== -1) raw = raw.substring(idx);
  return raw.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
}

export async function parseExamWithAI(documentContent: string, opts?: GenerateWithAIOptions): Promise<GeneratedQuestion[]> {
  const prompt = `Bạn là một chuyên gia nhận dạng và trích xuất câu hỏi từ đề thi. Dưới đây là nội dung văn bản được trích xuất từ một file đề thi (PDF/DOCX). Nhiệm vụ của bạn là đọc hiểu và trích xuất toàn bộ câu hỏi trong đề thi này sang định dạng JSON.

ĐỊNH DẠNG TRẢ VỀ BẮT BUỘC: Chỉ trả về một mảng JSON thuần túy (không có markdown, không có \`\`\`json), mỗi phần tử có cấu trúc:
{
  "type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "ESSAY" | "TRUE_FALSE",
  "content": "<nội dung câu hỏi>",
  "score": <điểm số, mặc định 1.0>,
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },   // chỉ cho MULTIPLE_CHOICE
  "correctAnswer": "<đáp án>"   // Bắt buộc trích xuất đáp án nếu có trong đề. Nếu không có, hãy tự giải và đưa ra đáp án đúng.
}

--- NỘI DUNG ĐỀ THI ---
${documentContent}`;

  const result = await aiProviderService.chat({
    messages: [{ role: 'user', content: prompt }],
    modelId: opts?.modelId ?? null,
    temperature: 0.1, // Thấp để bám sát nội dung gốc
    maxTokens: 8000,
    taskType: 'question_generation',
    userId: opts?.userId ?? null,
  });
  return parseAIResponse(result.text);
}
