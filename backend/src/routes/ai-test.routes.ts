import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import { validate } from '../middlewares/validate';
import { testSetController } from '../controllers/test-set.controller';
import {
  configKeyParamsSchema,
  updateAIConfigSchema,
  deckIdParamsSchema,
  docIdParamsSchema,
  testSetIdParamsSchema,
  toggleTestSetStatusSchema,
  testSetQuestionsParamsSchema,
  updateSingleQuestionSchema,
  bulkUpdateQuestionsSchema,
} from '../schemas/test-set.schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateSafeFileName } from '../utils/file-security';

const router = Router();

const examUploadDir = path.join(process.cwd(), 'uploads/exams');
if (!fs.existsSync(examUploadDir)) {
  fs.mkdirSync(examUploadDir, { recursive: true });
}

const allowedExamExts = ['.docx', '.doc', '.pdf', '.xlsx', '.xls', '.csv', '.txt', '.md'];

const examStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, examUploadDir);
  },
  filename: (_req, file, cb) => {
    try {
      const safeName = generateSafeFileName('exam', file.originalname, allowedExamExts);
      cb(null, safeName);
    } catch (err: any) {
      cb(err, '');
    }
  },
});

const upload = multer({
  storage: examStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExamExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng file ${ext} không được hỗ trợ`));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// 1. AI Task Configurations (per user + configKey)
router.get(
  '/ai-configs/:configKey',
  rateLimiter(60000, 60),
  validate(configKeyParamsSchema),
  (req: any, res: any) => testSetController.getAIConfig(req, res)
);

router.put(
  '/ai-configs/:configKey',
  rateLimiter(60000, 60),
  validate(updateAIConfigSchema),
  (req: any, res: any) => testSetController.updateAIConfig(req, res)
);

// 2. Resource Pickers for Test Generator
router.get(
  '/ai-test/my-documents',
  rateLimiter(60000, 60),
  (req: any, res: any) => testSetController.getMyDocuments(req, res)
);

router.get(
  '/ai-test/my-decks',
  rateLimiter(60000, 60),
  (req: any, res: any) => testSetController.getMyDecks(req, res)
);

router.get(
  '/ai-test/deck-content/:deckId',
  rateLimiter(60000, 60),
  validate(deckIdParamsSchema),
  (req: any, res: any) => testSetController.getDeckContent(req, res)
);

router.get(
  '/ai-test/document-content/:docId',
  rateLimiter(60000, 60),
  validate(docIdParamsSchema),
  (req: any, res: any) => testSetController.getDocumentContent(req, res)
);

// 3. Test Sets Management
router.get(
  '/test-sets',
  rateLimiter(60000, 60),
  (req: any, res: any) => testSetController.getTestSets(req, res)
);

router.patch(
  '/test-sets/:id/status',
  rateLimiter(60000, 60),
  validate(toggleTestSetStatusSchema),
  (req: any, res: any) => testSetController.toggleStatus(req, res)
);

router.delete(
  '/test-sets/:id',
  rateLimiter(60000, 30),
  validate(testSetIdParamsSchema),
  (req: any, res: any) => testSetController.deleteTestSet(req, res)
);

// 4. Questions Management in Test Sets
router.get(
  '/questions/test-sets/:testSetId',
  rateLimiter(60000, 60),
  validate(testSetQuestionsParamsSchema),
  (req: any, res: any) => testSetController.getQuestions(req, res)
);

router.put(
  '/questions/:id',
  rateLimiter(60000, 60),
  validate(updateSingleQuestionSchema),
  (req: any, res: any) => testSetController.updateQuestion(req, res)
);

router.put(
  '/questions/bulk-update',
  rateLimiter(60000, 30),
  validate(bulkUpdateQuestionsSchema),
  (req: any, res: any) => testSetController.bulkUpdateQuestions(req, res)
);

// 5. Exam File Upload & Extraction
router.post(
  '/test-sets/upload-exam',
  rateLimiter(60000, 20),
  upload.single('file'),
  (req: any, res: any) => testSetController.uploadExam(req, res)
);

export default router;
