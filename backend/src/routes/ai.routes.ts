import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { 
  aiChatSchema, 
  aiGenerateQuizSchema, 
  aiGenerateMindmapSchema, 
  aiGetMindmapSchema 
} from '../schemas/ai.schema';
import * as AiController from '../controllers/ai.controller';

const router = Router();

// Protected routes
router.use(authenticate);

router.post('/chat', validate(aiChatSchema), AiController.chatWithDocument);
router.post('/generate-quiz', requireRole('premium', 'admin'), validate(aiGenerateQuizSchema), AiController.generateQuiz);
router.get('/mindmap/:docId', validate(aiGetMindmapSchema), AiController.getMindmap);
router.post('/generate-mindmap', requireRole('premium', 'admin'), validate(aiGenerateMindmapSchema), AiController.generateMindmap);

// ── Question Generator: danh sách AI model (dropdown) + prompt template ──
router.get('/models', AiController.listAIModels);
router.get('/templates', AiController.listAITemplates);

export default router;
