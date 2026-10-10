import { Router } from 'express';
import { authenticate, requirePremium } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
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

// User-keyed AI rate limiters
const aiChatLimiter = rateLimiter(60 * 1000, 30);
const aiQuizLimiter = rateLimiter(60 * 1000, 20);
const aiMindmapLimiter = rateLimiter(60 * 1000, 20);

router.post('/chat', aiChatLimiter, validate(aiChatSchema), AiController.chatWithDocument);
router.post('/generate-quiz', aiQuizLimiter, requirePremium, validate(aiGenerateQuizSchema), AiController.generateQuiz);
router.get('/mindmap/:docId', validate(aiGetMindmapSchema), AiController.getMindmap);
router.post('/generate-mindmap', aiMindmapLimiter, requirePremium, validate(aiGenerateMindmapSchema), AiController.generateMindmap);

// ── Question Generator: danh sách AI model (dropdown) + prompt template ──
router.get('/models', AiController.listAIModels);
import promptRoutes from './ai-prompt.routes';

router.use('/prompts', promptRoutes);

export default router;

