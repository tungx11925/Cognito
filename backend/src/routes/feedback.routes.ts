import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import { submitFeedback, getMyFeedbackStatus } from '../controllers/feedback.controller';

const router = Router();

// Check user feedback status
router.get('/status', optionalAuthenticate, getMyFeedbackStatus);

// Public / User feedback submission
router.post('/', optionalAuthenticate, submitFeedback);

export default router;
