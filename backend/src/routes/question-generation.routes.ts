import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  generateQuestionsSchema,
  updateQuestionSchema,
  questionIdParamsSchema,
  testSetIdParamsSchema,
  documentIdParamsSchema,
} from '../schemas/question-generation.schema';
import {
  generateQuestions,
  updateQuestion,
  deleteQuestion,
  approveTestSet,
  getTestSet,
  getDocumentKeywords,
} from '../controllers/question-generation.controller';

/**
 * Question Generator routes.
 * Mọi route GHI dữ liệu (generate/patch/delete/approve) bắt buộc qua
 * requireRole('teacher','admin') — role lấy từ JWT đã decode, KHÔNG nhận từ body/query.
 */
const router = Router();

router.use(authenticate);

// ── Sinh câu hỏi (user/admin) ──
router.post('/questions/generate', requireRole('user', 'admin'), validate(generateQuestionsSchema), generateQuestions);

// ── Preview: sửa / xoá câu hỏi + duyệt bộ đề (user/admin) ──
router.patch('/questions/:id', requireRole('user', 'admin'), validate(updateQuestionSchema), updateQuestion);
router.delete('/questions/:id', requireRole('user', 'admin'), validate(questionIdParamsSchema), deleteQuestion);
router.post('/test-sets/:id/approve', requireRole('user', 'admin'), validate(testSetIdParamsSchema), approveTestSet);

// ── Đọc dữ liệu (mọi user đã đăng nhập) ──
router.get('/test-sets/:id', validate(testSetIdParamsSchema), getTestSet);
router.get('/documents/:id/keywords', validate(documentIdParamsSchema), getDocumentKeywords);

export default router;
