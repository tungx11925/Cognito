import { Response } from 'express';
import fs from 'fs';
import { AuthRequest } from '../middlewares/auth.middleware';
import { examParserService, ParsedExamQuestion } from '../services/exam-parser.service';
import { AppError } from '../utils/AppError';

export class ExamImportController {
  /**
   * POST /api/exams/parse
   * Tiếp nhận file (.docx, .pdf, .xlsx, .txt) hoặc raw text để bóc tách câu hỏi, options, answer key.
   * KHÔNG lưu vào Database - Trả về dữ liệu để người dùng Preview và chỉnh sửa (User correction).
   */
  async parseExam(req: AuthRequest, res: Response) {
    const file = req.file;
    const { textContent, name, useAI } = req.body;
    const shouldFallbackAI = useAI === 'true' || useAI === true;

    try {
      if (!file && (!textContent || !textContent.trim())) {
        throw new AppError('Vui lòng tải lên file đề thi (.docx, .pdf, .xlsx, .txt) hoặc dán nội dung văn bản', 400);
      }

      let result;
      if (file) {
        result = await examParserService.parseExam({
          filePath: file.path,
          originalName: file.originalname,
          name: typeof name === 'string' ? name : undefined,
          useAI: shouldFallbackAI,
          userId: req.user?.id,
        });
      } else {
        result = await examParserService.parseExam({
          textContent: String(textContent),
          name: typeof name === 'string' ? name : undefined,
          useAI: shouldFallbackAI,
          userId: req.user?.id,
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } finally {
      if (file && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // Bỏ qua lỗi xóa file tạm
        }
      }
    }
  }

  /**
   * POST /api/exams/import
   * Nhận danh sách câu hỏi sau khi người dùng đã Preview & Sửa lỗi (User correction)
   * và lưu chính thức vào bảng test_sets + questions trong Database.
   */
  async importExam(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { name, questions, status } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('Danh sách câu hỏi không hợp lệ hoặc rỗng', 400);
    }

    const validatedQuestions: ParsedExamQuestion[] = questions.map((q: any, idx: number) => {
      if (!q.content || typeof q.content !== 'string' || q.content.trim().length === 0) {
        throw new AppError(`Câu hỏi số ${idx + 1} thiếu nội dung`, 400);
      }

      const validTypes = ['MULTIPLE_CHOICE', 'FILL_BLANK', 'ESSAY', 'TRUE_FALSE'];
      const qType = validTypes.includes(q.type) ? q.type : 'MULTIPLE_CHOICE';

      return {
        index: idx + 1,
        type: qType,
        content: q.content.trim(),
        score: Number(q.score) > 0 ? Number(q.score) : 1.0,
        options: q.options && typeof q.options === 'object' ? q.options : undefined,
        correctAnswer: q.correctAnswer !== undefined && q.correctAnswer !== null ? q.correctAnswer : undefined,
        explanation: typeof q.explanation === 'string' ? q.explanation.trim() : undefined,
      };
    });

    const targetStatus = status === 'APPROVED' ? 'APPROVED' : 'DRAFT';
    const examName = typeof name === 'string' && name.trim().length > 0
      ? name.trim()
      : `Đề thi nhập vào (${validatedQuestions.length} câu)`;

    const saved = await examParserService.saveToQuestionSet({
      userId,
      name: examName,
      questions: validatedQuestions,
      status: targetStatus,
    });

    return res.status(201).json({
      success: true,
      message: 'Đã nhập đề thi thành công vào ngân hàng đề',
      data: saved,
    });
  }
}

export const examImportController = new ExamImportController();
