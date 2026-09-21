import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { 
  aiChatSchema, 
  aiGenerateQuizSchema, 
  aiGenerateMindmapSchema, 
  aiGetMindmapSchema 
} from '../schemas/ai.schema';
import * as AiController from '../controllers/ai.controller';

const router = Router();

const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validMimes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (validMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Định dạng không được hỗ trợ.'));
  }
});

// Protected routes
router.use(authenticate);
import { requireRole } from '../middlewares/auth.middleware';

router.post('/chat', validate(aiChatSchema), AiController.chatWithDocument);
router.post('/generate-quiz', requireRole('premium', 'admin'), validate(aiGenerateQuizSchema), AiController.generateQuiz);
router.post('/generate-flashcards-from-file', requireRole('premium', 'admin'), uploadMem.single('document'), AiController.generateFlashcardsFromFile);
router.get('/mindmap/:docId', validate(aiGetMindmapSchema), AiController.getMindmap);
router.post('/generate-mindmap', requireRole('premium', 'admin'), validate(aiGenerateMindmapSchema), AiController.generateMindmap);

// ── Question Generator: danh sách AI model (dropdown) + prompt template ──
router.get('/models', AiController.listAIModels);
router.get('/templates', AiController.listAITemplates);

export default router;
