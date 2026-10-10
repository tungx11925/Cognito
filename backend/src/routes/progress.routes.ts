import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ProgressController from '../controllers/progress.controller';

const router = Router();

router.use(authenticate);

router.get('/summary', ProgressController.getProgressSummary);
router.get('/streak', ProgressController.getStreak);

export default router;
