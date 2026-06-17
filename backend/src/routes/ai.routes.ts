import { Router } from 'express';
import { chatWithDocument, generateFlashcards } from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// AI routes (Protected)
router.post('/chat', authenticate, chatWithDocument);
router.post('/flashcards/generate', authenticate, generateFlashcards);

export default router;
