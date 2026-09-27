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


export async function generateMindmapWithAI(
  documentTitle: string, 
  documentContent: string,
  meta?: { userId?: number; documentId?: number }
): Promise<string> {
  const cleanContent = (documentContent || '').replace(/<[^>]*>?/gm, '').substring(0, 8000);
  const cleanTitle = (documentTitle || 'Tài Liệu')
    .replace(/[()\[\]{}:"']/g, '')
    .trim()
    .substring(0, 50);

  const prompt = `Bạn là chuyên gia cố vấn học tập và kiến trúc sư tri thức. Hãy đọc kỹ tài liệu dưới đây và chuyển hóa toàn bộ kiến thức quan trọng thành một Sơ Đồ Tư Duy (Mindmap) chuẩn tư duy logic sâu sắc bằng cú pháp Mermaid.js.

TIÊU ĐỀ TÀI LIỆU: ${cleanTitle}
NỘI DUNG TÀI LIỆU:
${cleanContent}

NGUYÊN TẮC THIẾT KẾ SƠ ĐỒ TƯ DUY (MINDMAP):
1. TRÍCH XUẤT ĐÚNG TRỌNG TÂM TÀI LIỆU:
   - Nút gốc (root): Đặt tên theo chủ đề cốt lõi thực sự của tài liệu (ví dụ nếu tài liệu là dự án MOMI thì root((MOMI Chăm Sóc Mẹ và Bé)), nếu là bài toán thì root((Hàm Số Bậc Hai)). TUYỆT ĐỐI không dùng mã số ngẫu nhiên hoặc từ vô nghĩa.
   - 4 đến 6 Nhánh Cấp 1: Phải là các trụ cột nội dung THỰC TẾ của tài liệu này (Ví dụ với đồ án/dự án: Bối Cảnh và Mục Tiêu, Đối Tượng Sử Dụng, Tính Năng Nổi Bật, Giải Pháp Công Nghệ, Giá Trị Mang Lại; với kiến thức bài học: Bản Chất Cốt Lõi, Cơ Chế Hoạt Động, Quy Trình Triển Khai, Tình Huống Thực Tế).
   - Nhánh Cấp 2 & Cấp 3: Khắc họa chi tiết các thành phần, chức năng, luận điểm hoặc ví dụ thực tế được nêu trong tài liệu.
2. TUYỆT ĐỐI CẤM (BỊ PHẠT NẾU VI PHẠM):
   - KHÔNG dùng các từ nhãn sáo rỗng vô hồn như "Định Nghĩa", "Mô Hình", "Công Thức", "Bước 1", "Bước 2", "Lĩnh vực 1", "Lĩnh vực 2", "Đặc điểm", "Khái niệm". Mỗi nút bắt buộc phải chứa thông tin chuyên môn thực tế của tài liệu.
   - Mỗi nút chỉ từ 2 đến 6 từ ngắn gọn, súc tích, mang tính từ khóa hoặc khái niệm rõ ràng.
3. QUY TẮC CÚ PHÁP MERMAID BẮT BUỘC:
   - Dòng 1: mindmap
   - Dòng 2:   root((Tên Chủ Đề Chính))
   - Cấp 1: thụt lề 4 khoảng trắng
   - Cấp 2: thụt lề 6 khoảng trắng
   - Cấp 3: thụt lề 8 khoảng trắng
   - Tuyệt đối KHÔNG sử dụng các ký tự đặc biệt như: ngoặc đơn (), ngoặc vuông [], ngoặc nhọn {}, dấu hai chấm :, dấu kép ", dấu gạch chéo /, dấu & trong tên các nút nhánh con (vì sẽ làm sập cú pháp Mermaid).
   - CHỈ TRẢ VỀ DUY NHẤT ĐOẠN MÃ MERMAID PURE (bắt đầu bằng từ khóa mindmap, không có bất kỳ lời mở đầu, giải thích hay markdown code fence).`;

  // Đi qua AIProviderAdapter (GroqAdapter → GeminiAdapter)
  const result = await aiProviderService.chat({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 2000,
    taskType: 'mindmap',
    userId: meta?.userId,
    documentId: meta?.documentId,
  });
  let raw = result.text;
  const idx = raw.indexOf('mindmap');
  if (idx !== -1) raw = raw.substring(idx);
  const stripped = raw.replace(/```mermaid/gi, '').replace(/```/g, '').trim();

  // Normalize mindmap indentation and strip invalid syntax
  const lines = stripped.split('\n');
  const out: string[] = [];
  let rootIndented = false;
  let baseIndent = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase() === 'mindmap') {
      out.push('mindmap');
      continue;
    }
    if (!rootIndented && (trimmed.startsWith('root(') || trimmed.startsWith('root(('))) {
      out.push('  ' + trimmed);
      rootIndented = true;
      baseIndent = rawLine.match(/^(\s*)/)?.[0].length || 0;
      continue;
    }

    const curIndent = rawLine.match(/^(\s*)/)?.[0].length || 0;
    let level = 1;
    if (curIndent > baseIndent) {
      level = 1 + Math.max(1, Math.round((curIndent - baseIndent) / 2));
    }
    let cleanText = trimmed.replace(/[()\[\]{}:\"']/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) continue;
    out.push(' '.repeat(2 + level * 2) + cleanText);
  }

  return out.length > 0 ? out.join('\n') : stripped;
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
