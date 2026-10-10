import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { quizService } from '../services/quiz.service';
import { AppError } from '../utils/AppError';

export class QuizController {
  async startQuiz(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { testSetId, isRetryMistakes, previousAttemptId } = req.body;

    if (!testSetId) {
      throw new AppError('testSetId là bắt buộc', 400);
    }

    const result = await quizService.startQuiz(userId, Number(testSetId), {
      isRetryMistakes: Boolean(isRetryMistakes),
      previousAttemptId: previousAttemptId ? Number(previousAttemptId) : undefined,
    });

    return res.status(201).json(result);
  }

  async submitQuiz(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const attemptId = Number(req.params.attemptId);
    const { answers, durationSeconds } = req.body;

    if (!attemptId || isNaN(attemptId)) {
      throw new AppError('attemptId không hợp lệ', 400);
    }

    if (!Array.isArray(answers)) {
      throw new AppError('answers phải là một mảng', 400);
    }

    const result = await quizService.submitQuiz(
      userId,
      attemptId,
      answers,
      Number(durationSeconds) || 0
    );

    return res.json(result);
  }

  async getAttemptResult(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const attemptId = Number(req.params.attemptId);

    if (!attemptId || isNaN(attemptId)) {
      throw new AppError('attemptId không hợp lệ', 400);
    }

    const result = await quizService.getAttemptResult(userId, attemptId);
    return res.json(result);
  }

  async getAttemptMistakes(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const attemptId = Number(req.params.attemptId);

    if (!attemptId || isNaN(attemptId)) {
      throw new AppError('attemptId không hợp lệ', 400);
    }

    const result = await quizService.getAttemptMistakes(userId, attemptId);
    return res.json(result);
  }

  async getQuizHistory(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const result = await quizService.listUserHistory(userId, limit, offset);
    return res.json(result);
  }
}

export const quizController = new QuizController();
