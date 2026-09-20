import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { questionGenerationService } from '../services/question-generation.service';
import { documentProcessingService } from '../services/document-processing.service';
import { AppError } from '../utils/AppError';

/**
 * Question Generation Controller — sinh câu hỏi từ bài học/slide, chọn model AI,
 * trọng tâm từ khoá, Preview (DRAFT) → Edit → Save (APPROVED).
 * Role check (teacher/admin) đã được enforce ở routes bằng requireRole middleware.
 */

export const generateQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = (req.body || {}) as any;

    const result = await questionGenerationService.generate({
      userId,
      sourceIds: body.sourceIds,
      textContent: body.textContent,
      focusKeywords: body.focusKeywords,
      audienceLevel: body.audienceLevel,
      questionType: body.questionType,
      difficulty: body.difficulty,
      quantity: body.quantity,
      templateId: body.templateId,
      modelId: body.modelId,
      customInstruction: body.customInstruction,
      mode: body.mode,
      name: body.name,
      configKey: body.configKey,
    });

    if (result.status === 'PROCESSING') {
      return res.status(202).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const body = (req.body || {}) as any;
    const updated = await questionGenerationService.updateQuestion(userId, id, {
      content: body.content,
      score: body.score,
      options: body.options,
      correct_answer: body.correct_answer,
      explanation: body.explanation,
      difficulty: body.difficulty,
    });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const deleted = await questionGenerationService.deleteQuestion(userId, id);
    if (!deleted) {
      throw new AppError('Câu hỏi không tồn tại', 404);
    }
    res.status(200).json({ message: 'Đã xoá câu hỏi', id: deleted.id, testSetId: deleted.test_set_id });
  } catch (error) {
    next(error);
  }
};

export const approveTestSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const testSet = await questionGenerationService.approveTestSet(userId, id);
    res.status(200).json({
      message: 'Đã duyệt bộ đề — câu hỏi đã hiển thị cho học sinh',
      testSet,
    });
  } catch (error) {
    next(error);
  }
};

export const getTestSet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const testSet = await questionGenerationService.getTestSet(userId, id);
    res.status(200).json(testSet);
  } catch (error) {
    next(error);
  }
};

export const getDocumentKeywords = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const data = await documentProcessingService.getDocumentKeywords(id, userId);
    if (!data) {
      throw new AppError('Không tìm thấy tài liệu', 404);
    }
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const listAIModels = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await questionGenerationService.listModels();
    res.status(200).json(models);
  } catch (error) {
    next(error);
  }
};

export const listAITemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(questionGenerationService.listTemplates());
  } catch (error) {
    next(error);
  }
};
