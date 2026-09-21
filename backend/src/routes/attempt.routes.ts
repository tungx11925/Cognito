import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as attemptController from '../controllers/attempt.controller';

const router = express.Router();

router.post('/assignments/:assignmentId/start', authenticate, attemptController.startAttempt);
router.post('/attempts/:attemptId/submit', authenticate, attemptController.submitAttempt);
router.put('/attempts/:attemptId/answers', authenticate, attemptController.saveAnswers);
router.get('/assignments/:assignmentId/attempts', authenticate, attemptController.getStudentAttempts);

export default router;
