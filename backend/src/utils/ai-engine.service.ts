import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

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

export async function generateQuestionsWithAI(cfg: GenerateConfig): Promise<GeneratedQuestion[]> {
  const prompt = buildSystemPrompt(cfg);
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // Attempt 1: Groq (faster)
  if (groqKey && !groqKey.includes('your_')) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.6,
        max_tokens: 8000,
      });
      const raw = completion.choices[0]?.message?.content || '[]';
      return parseAIResponse(raw);
    } catch (err) {
      console.error('[AI Engine] Groq failed, falling back to Gemini:', err);
    }
  }

  // Attempt 2: Gemini
  if (geminiKey && !geminiKey.includes('your_')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      return parseAIResponse(raw);
    } catch (err) {
      console.error('[AI Engine] Gemini failed:', err);
    }
  }

  throw new Error('Không có AI API key hợp lệ. Vui lòng cấu hình GROQ_API_KEY hoặc GEMINI_API_KEY trong file .env');
}
