import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { quizController } from '../controllers/quiz.controller';

const router = Router();

// Bắt đầu làm bài thi (hỗ trợ cả thi lần đầu và Retry Mistakes)
router.post('/quizzes/start', authenticate, (req, res, next) => {
  quizController.startQuiz(req as any, res).catch(next);
});

// Nộp bài thi và chấm điểm Server-side
router.post('/quizzes/attempts/:attemptId/submit', authenticate, (req, res, next) => {
  quizController.submitQuiz(req as any, res).catch(next);
});

// Xem kết quả chi tiết của lượt làm bài
router.get('/quizzes/attempts/:attemptId', authenticate, (req, res, next) => {
  quizController.getAttemptResult(req as any, res).catch(next);
});

// Xem danh sách các câu làm sai (Review Mistakes)
router.get('/quizzes/attempts/:attemptId/mistakes', authenticate, (req, res, next) => {
  quizController.getAttemptMistakes(req as any, res).catch(next);
});

// Lịch sử làm bài thi của người dùng
router.get('/quizzes/history', authenticate, (req, res, next) => {
  quizController.getQuizHistory(req as any, res).catch(next);
});

export default router;
