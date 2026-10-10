import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createPromptTemplateSchema, createPromptHistorySchema } from '../schemas/ai-prompt.schema';
import * as AiPromptController from '../controllers/ai-prompt.controller';

const router = Router();

router.use(authenticate);

// Templates
router.get('/templates', AiPromptController.getTemplates);
router.post('/templates', validate(createPromptTemplateSchema), AiPromptController.createTemplate);
router.put('/templates/:id', validate(createPromptTemplateSchema), AiPromptController.updateTemplate);
router.delete('/templates/:id', AiPromptController.deleteTemplate);

// History
router.get('/history', AiPromptController.getHistory);
router.post('/history', validate(createPromptHistorySchema), AiPromptController.addHistory);
router.put('/history/:id/pin', AiPromptController.togglePinHistory);
router.delete('/history/:id', AiPromptController.deleteHistory);

export default router;
