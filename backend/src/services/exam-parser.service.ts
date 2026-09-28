import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { aiProviderService } from './ai-provider.service';
import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface ParsedExamQuestion {
  index: number;
  type: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'ESSAY' | 'TRUE_FALSE';
  content: string;
  score: number;
  options?: Record<string, string>;
  correctAnswer?: string | string[];
  explanation?: string;
  sourceText?: string;
}

export interface ExamParseResult {
  title: string;
  extractionMethod: 'RULE_BASED' | 'AI_NORMALIZED';
  questions: ParsedExamQuestion[];
  stats: {
    totalQuestions: number;
    multipleChoiceCount: number;
    trueFalseCount: number;
    fillBlankCount: number;
    essayCount: number;
    answerKeyCount: number;
  };
  warnings: string[];
}

export class ExamParserService {
  /**
   * Bóc tách toàn bộ text thô từ file tải lên (.docx, .pdf, .xlsx, .txt, .csv)
   */
  async extractTextFromFile(filePath: string, originalName: string): Promise<string> {
    const ext = path.extname(originalName).toLowerCase();

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    }

    if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }

    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return '';
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      return rows
        .map(r => (Array.isArray(r) ? r.join(' | ') : ''))
        .filter(line => line.trim().length > 0)
        .join('\n');
    }

    if (ext === '.txt' || ext === '.md') {
      return fs.readFileSync(filePath, 'utf-8');
    }

    throw new AppError(`Định dạng file ${ext} không được hỗ trợ (chỉ nhận .pdf, .docx, .xlsx, .txt)`, 400);
  }

  /**
   * Trích xuất bảng đáp án ở cuối văn bản (Answer Key Table)
   * e.g. "BẢNG ĐÁP ÁN: 1.A 2.B 3.C..." hoặc "ĐÁP ÁN: 1-A, 2-B..."
   */
  extractAnswerKeyTable(text: string): { mainText: string; answerKeyMap: Map<number, string> } {
    const answerKeyMap = new Map<number, string>();
    const keyHeaderRegex = /(?:^|\n)\s*(?:BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s*CHI\s*TIẾT|ANSWER\s+KEY|HƯỚNG\s+DẪN\s+CHẤM|PHẦN\s+ĐÁP\s+ÁN|KEY\s*TRẮC\s*NGHIỆM|BẢNG\s+TRẢ\s+LỜI)\s*[:\-–]?\s*([\s\S]*)$/i;

    let match = text.match(keyHeaderRegex);
    if (!match) {
      // Thử tìm dòng tiêu đề riêng biệt "ĐÁP ÁN" hoặc "KEY" ở cuối văn bản có chứa ít nhất 2 cặp số-đáp án
      const standaloneRegex = /(?:^|\n)\s*(?:ĐÁP\s+ÁN|KEY)\s*[:\-–]?\s*\n\s*([\s\S]*)$/i;
      const standMatch = text.match(standaloneRegex);
      if (standMatch && standMatch[1]) {
        const testPairs = standMatch[1].match(/(?:Câu\s*)?\d+[\s.:\-–)]+[A-D]\b/gi);
        if (testPairs && testPairs.length >= 2) {
          match = standMatch;
        }
      }
    }

    if (!match || match.index === undefined) {
      return { mainText: text, answerKeyMap };
    }

    const mainText = text.substring(0, match.index).trim();
    const keySection = match[1];

    // Tìm các cặp số - chữ: "1.A", "1: B", "1-C", "Câu 1: D", "1A"
    const pairRegex = /(?:Câu\s*)?(\d+)[\s.:\-–)]+([A-D]|ĐÚNG|SAI|TRUE|FALSE)\b/gi;
    let m;
    while ((m = pairRegex.exec(keySection)) !== null) {
      const qNum = parseInt(m[1], 10);
      let ans = m[2].toUpperCase();
      if (ans === 'ĐÚNG') ans = 'TRUE';
      if (ans === 'SAI') ans = 'FALSE';
      answerKeyMap.set(qNum, ans);
    }

    // Nếu không khớp regex trên, thử dạng "1A 2B 3C"
    if (answerKeyMap.size === 0) {
      const compactRegex = /\b(\d+)\s*([A-D])\b/g;
      while ((m = compactRegex.exec(keySection)) !== null) {
        answerKeyMap.set(parseInt(m[1], 10), m[2].toUpperCase());
      }
    }

    return { mainText, answerKeyMap };
  }

  /**
   * Bóc tách câu hỏi và các phương án từ văn bản bằng Rule-Based / Regex (Deterministic)
   */
  parseRuleBased(text: string): { questions: ParsedExamQuestion[]; answerKeyFoundCount: number } {
    const { mainText, answerKeyMap } = this.extractAnswerKeyTable(text);
    const cleanedText = mainText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Phân tách danh sách câu hỏi
    // Ưu tiên Pattern có tiền tố "Câu 1", "Bài 1", "Question 1", "Q1"
    const questionHeaderRegex = /(?:^|\n)\s*(?:Câu|Bài|Question|\bQ)\s*(\d+)[\s.:\-–)]+/gi;
    let headerMatches: { index: number; qNum: number; fullMatchLength: number }[] = [];
    let match;

    while ((match = questionHeaderRegex.exec(cleanedText)) !== null) {
      headerMatches.push({
        index: match.index,
        qNum: parseInt(match[1], 10),
        fullMatchLength: match[0].length,
      });
    }

    // Nếu không có "Câu X", thử tìm dạng số thứ tự "1.", "2.", "3."
    if (headerMatches.length < 2) {
      const numberedRegex = /(?:^|\n)\s*(\d+)[\s.:)]+(?=[A-ZÀ-Ỹa-z0-9])/gi;
      const fallbackMatches: { index: number; qNum: number; fullMatchLength: number }[] = [];
      while ((match = numberedRegex.exec(cleanedText)) !== null) {
        fallbackMatches.push({
          index: match.index,
          qNum: parseInt(match[1], 10),
          fullMatchLength: match[0].length,
        });
      }
      if (fallbackMatches.length >= 2) {
        headerMatches = fallbackMatches;
      }
    }

    if (headerMatches.length === 0) {
      return { questions: [], answerKeyFoundCount: 0 };
    }

    const questions: ParsedExamQuestion[] = [];
    let answerKeyFoundCount = 0;

    for (let i = 0; i < headerMatches.length; i++) {
      const current = headerMatches[i];
      const nextIndex = i < headerMatches.length - 1 ? headerMatches[i + 1].index : cleanedText.length;
      const rawBlock = cleanedText.substring(current.index, nextIndex);

      // Bỏ phần header "Câu 1:" để lấy nội dung mà không làm mất ký tự đầu
      const blockContent = rawBlock.substring(current.fullMatchLength).trim();

      // 2. Tìm đáp án nội tuyến (Inline Answer Key) e.g. "Đáp án: A", "Answer: B", "Chọn: C"
      let inlineAnswer: string | undefined = undefined;
      const inlineAnsRegex = /(?:Đáp\s*án|Đ\/A|Answer|Key|Chọn)[\s.:\-–]+([A-D]|ĐÚNG|SAI|TRUE|FALSE)\b/i;
      const ansMatch = blockContent.match(inlineAnsRegex);
      if (ansMatch) {
        inlineAnswer = ansMatch[1].toUpperCase();
        if (inlineAnswer === 'ĐÚNG') inlineAnswer = 'TRUE';
        if (inlineAnswer === 'SAI') inlineAnswer = 'FALSE';
      }

      // Xóa dòng đáp án nội tuyến khỏi nội dung câu hỏi
      const contentWithoutAns = blockContent.replace(inlineAnsRegex, '').trim();

      // 3. Bóc tách các phương án lựa chọn A, B, C, D
      const options: Record<string, string> = {};
      const optionRegex = /(?:^|\s|\n)([A-D])[\s.:)\-–]+([\s\S]*?)(?=(?:[\s\n][A-D][\s.:)\-–]+|$))/gi;
      let optMatch;
      const foundOptions: { key: string; text: string; index: number }[] = [];

      while ((optMatch = optionRegex.exec(contentWithoutAns)) !== null) {
        foundOptions.push({
          key: optMatch[1].toUpperCase(),
          text: optMatch[2].trim(),
          index: optMatch.index,
        });
      }

      // Xác định nội dung thân câu hỏi (stem) và options
      let questionStem = contentWithoutAns;
      let qType: 'MULTIPLE_CHOICE' | 'FILL_BLANK' | 'ESSAY' | 'TRUE_FALSE' = 'MULTIPLE_CHOICE';

      if (foundOptions.length >= 2) {
        // Có ít nhất 2 phương án A, B
        const firstOptIndex = foundOptions[0].index;
        questionStem = contentWithoutAns.substring(0, firstOptIndex).trim();
        for (const opt of foundOptions) {
          options[opt.key] = opt.text.replace(/\n+/g, ' ').trim();
        }

        // Kiểm tra Đúng/Sai
        if (
          foundOptions.length === 2 &&
          ((options.A?.toLowerCase().includes('đúng') && options.B?.toLowerCase().includes('sai')) ||
           (options.A?.toLowerCase().includes('true') && options.B?.toLowerCase().includes('false')))
        ) {
          qType = 'TRUE_FALSE';
        } else {
          qType = 'MULTIPLE_CHOICE';
        }
      } else {
        // Không có A, B, C, D rõ ràng -> kiểm tra Điền từ hoặc Tự luận
        if (contentWithoutAns.includes('___') || /\[\.\.\.\]|\(\.\.\.\)/.test(contentWithoutAns)) {
          qType = 'FILL_BLANK';
        } else {
          qType = 'ESSAY';
        }
      }

      // Xác định đáp án đúng cuối cùng (ưu tiên bảng đáp án cuối bài, sau đó đến inline)
      const finalCorrectAnswer = answerKeyMap.get(current.qNum) || inlineAnswer;
      if (finalCorrectAnswer) {
        answerKeyFoundCount++;
      }

      // Chuẩn hóa câu hỏi
      const finalContent = questionStem.length > 0 ? questionStem : blockContent;
      if (finalContent.length >= 5) {
        questions.push({
          index: i + 1,
          type: qType,
          content: finalContent,
          score: qType === 'ESSAY' ? 2.0 : 1.0,
          options: Object.keys(options).length > 0 ? options : undefined,
          correctAnswer: finalCorrectAnswer,
          sourceText: rawBlock.substring(0, 300),
        });
      }
    }

    return { questions, answerKeyFoundCount };
  }

  /**
   * Phân tích đề thi bằng AI Normalization khi regex không nhận diện được (đề có layout vỡ, OCR lỗi)
   */
  async parseWithAINormalization(text: string, userId?: number): Promise<ParsedExamQuestion[]> {
    const sampleText = text.substring(0, 25000); // Giới hạn context an toàn
    const prompt = `Bạn là công cụ chuẩn hóa đề thi (Exam Normalization Engine).
Nhiệm vụ: Đọc văn bản thô của đề thi bên dưới, trích xuất tất cả các câu hỏi và đáp án sang mảng JSON.
QUY TẮC BẮT BUỘC:
1. KHÔNG tự ý sáng tạo hay thêm bớt câu hỏi ngoài nội dung đề thi.
2. Trả về đúng định dạng JSON:
{
  "questions": [
    {
      "index": 1,
      "type": "MULTIPLE_CHOICE" | "FILL_BLANK" | "ESSAY" | "TRUE_FALSE",
      "content": "<nội dung câu hỏi>",
      "score": 1.0,
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correctAnswer": "<đáp án A, B, C, D nếu có trong đề, nếu không để null>",
      "explanation": "<ghi chú đáp án nếu có trong đề>"
    }
  ]
}

NỘI DUNG ĐỀ THI:
${sampleText}`;

    const res = await aiProviderService.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 8000,
      jsonMode: true,
      taskType: 'question_generation',
      userId: userId || null,
    });

    let raw = res.text.trim();
    raw = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed?.questions) ? parsed.questions : Array.isArray(parsed) ? parsed : [];
      return list.map((q: any, idx: number) => ({
        index: idx + 1,
        type: q.type || 'MULTIPLE_CHOICE',
        content: q.content || 'Câu hỏi',
        score: Number(q.score) || 1.0,
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || undefined,
        explanation: q.explanation || undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Phương thức tổng hợp: Tiếp nhận file hoặc text, thực hiện bóc tách với Rule-Based trước,
   * tự động fallback AI nếu được yêu cầu hoặc nếu rule-based không tìm thấy câu hỏi.
   */
  async parseExam(options: {
    filePath?: string;
    originalName?: string;
    textContent?: string;
    useAI?: boolean;
    userId?: number;
    name?: string;
  }): Promise<ExamParseResult> {
    let rawText = '';
    const examTitle = options.name?.trim() || options.originalName?.replace(/\.[^/.]+$/, '') || 'Đề thi nhập vào';

    if (options.filePath && options.originalName) {
      rawText = await this.extractTextFromFile(options.filePath, options.originalName);
    } else if (options.textContent && options.textContent.trim()) {
      rawText = options.textContent.trim();
    } else {
      throw new AppError('Cần cung cấp file hoặc nội dung văn bản đề thi', 400);
    }

    if (rawText.length < 20) {
      throw new AppError('Nội dung đề thi quá ngắn hoặc file rỗng', 400);
    }

    const warnings: string[] = [];

    // 1. Thử phân tích bằng Rule-Based / Regex trước (Không dùng AI theo đúng Master Prompt)
    let { questions, answerKeyFoundCount } = this.parseRuleBased(rawText);
    let extractionMethod: 'RULE_BASED' | 'AI_NORMALIZED' = 'RULE_BASED';

    // 2. Nếu Rule-based tìm thấy < 2 câu hỏi và được phép dùng AI -> fallback sang AI Normalization
    if (questions.length < 2 && options.useAI !== false) {
      warnings.push('Cấu trúc đề thi không đồng nhất với quy chuẩn Regex; đã sử dụng AI Normalization để chuẩn hóa.');
      const aiQuestions = await this.parseWithAINormalization(rawText, options.userId);
      if (aiQuestions.length > 0) {
        questions = aiQuestions;
        extractionMethod = 'AI_NORMALIZED';
        answerKeyFoundCount = questions.filter(q => !!q.correctAnswer).length;
      }
    }

    if (questions.length === 0) {
      throw new AppError('Không thể nhận diện được câu hỏi nào từ file/văn bản đã cung cấp.', 422);
    }

    // Thống kê chi tiết
    const stats = {
      totalQuestions: questions.length,
      multipleChoiceCount: questions.filter(q => q.type === 'MULTIPLE_CHOICE').length,
      trueFalseCount: questions.filter(q => q.type === 'TRUE_FALSE').length,
      fillBlankCount: questions.filter(q => q.type === 'FILL_BLANK').length,
      essayCount: questions.filter(q => q.type === 'ESSAY').length,
      answerKeyCount: answerKeyFoundCount,
    };

    return {
      title: examTitle,
      extractionMethod,
      questions,
      stats,
      warnings,
    };
  }

  /**
   * Lưu danh sách câu hỏi đã preview/sửa đổi vào Database (tạo test_set + questions)
   */
  async saveToQuestionSet(params: {
    userId: number;
    name: string;
    questions: ParsedExamQuestion[];
    status?: 'DRAFT' | 'APPROVED';
  }) {
    const { userId, name, questions, status = 'DRAFT' } = params;
    if (!questions || questions.length === 0) {
      throw new AppError('Danh sách câu hỏi không được rỗng', 400);
    }

    const totalScore = questions.reduce((sum, q) => sum + (Number(q.score) || 1.0), 0);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const tsRes = await client.query(
        `INSERT INTO test_sets (name, total_questions, total_score, is_active, created_by, status, generation_config)
         VALUES ($1, $2, $3, true, $4, $5, $6)
         RETURNING *`,
        [
          name.trim() || `Đề thi nhập vào (${questions.length} câu)`,
          questions.length,
          totalScore,
          userId,
          status,
          JSON.stringify({ importType: 'EXISTING_EXAM_IMPORT', importedAt: new Date().toISOString() }),
        ]
      );
      const testSet = tsRes.rows[0];

      const insertedQuestions: any[] = [];
      for (const q of questions) {
        const qRes = await client.query(
          `INSERT INTO questions (test_set_id, type, content, score, status, options, correct_answer, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            testSet.id,
            q.type,
            q.content,
            Number(q.score) || 1.0,
            status,
            q.options ? JSON.stringify(q.options) : null,
            q.correctAnswer ? JSON.stringify(q.correctAnswer) : null,
            q.explanation || null,
          ]
        );
        insertedQuestions.push(qRes.rows[0]);
      }

      await client.query('COMMIT');
      return {
        testSet,
        questions: insertedQuestions,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const examParserService = new ExamParserService();
