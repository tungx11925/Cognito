import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import * as ActivityController from '../controllers/activity.controller';

const router = Router();

// Public routes (optional auth / SSE)
router.get('/notifications/stream', ActivityController.streamNotifications);
router.get('/leaderboard', ActivityController.getLeaderboard);

// Protected routes
router.get('/tasks', authenticate, ActivityController.getTasks);
router.post('/tasks/progress', authenticate, ActivityController.updateTaskProgress);

// Friends & Profile
router.get('/friends', authenticate, ActivityController.getFriends);
router.get('/users/:targetUserId/profile', optionalAuthenticate, ActivityController.getProfile);

export default router;
