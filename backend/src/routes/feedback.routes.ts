import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import { submitFeedback } from '../controllers/feedback.controller';

const router = Router();

// Public / User feedback submission
router.post('/', optionalAuthenticate, submitFeedback);

export default router;
