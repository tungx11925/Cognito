import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as ActivityController from '../controllers/activity.controller';

const router = Router();

// Protected routes
router.use(authenticate);

// Tasks
router.get('/tasks', ActivityController.getTasks);
router.post('/tasks/progress', ActivityController.updateTaskProgress);

// Friends & Profile
router.get('/friends', ActivityController.getFriends);
router.get('/users/:targetUserId/profile', ActivityController.getProfile);

export default router;
