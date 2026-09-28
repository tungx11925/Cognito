import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { logActivitySchema } from '../schemas/progress.schema';
import * as LearningActivityController from '../controllers/learning-activity.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(logActivitySchema), LearningActivityController.logActivity);
router.get('/', LearningActivityController.listActivities);

export default router;
