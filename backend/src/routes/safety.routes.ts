import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportContent,
  getUserReports,
  getModerationReports,
  applyModerationAction,
  getModerationHistory,
  suspendUser,
  unsuspendUser,
  getModerationStats,
} from '../controllers/safety.controller';

// ─── USER SAFETY ROUTER (/api/community) ───
export const userSafetyRouter = Router();

// User Blocking
userSafetyRouter.post('/blocks/:userId', authenticate, blockUser);
userSafetyRouter.delete('/blocks/:userId', authenticate, unblockUser);
userSafetyRouter.get('/blocks', authenticate, getBlockedUsers);

// User Content Reporting
userSafetyRouter.post('/reports', authenticate, reportContent);
userSafetyRouter.get('/my-reports', authenticate, getUserReports);

// ─── ADMIN MODERATION ROUTER (/api/admin) ───
export const adminModerationRouter = Router();

adminModerationRouter.get('/moderation/stats', authenticate, requireRole('admin'), getModerationStats);
adminModerationRouter.get('/moderation/reports', authenticate, requireRole('admin'), getModerationReports);
adminModerationRouter.post('/moderation/reports/:id/action', authenticate, requireRole('admin'), applyModerationAction);
adminModerationRouter.get('/moderation/history', authenticate, requireRole('admin'), getModerationHistory);
adminModerationRouter.post('/moderation/users/:id/suspend', authenticate, requireRole('admin'), suspendUser);
adminModerationRouter.post('/moderation/users/:id/unsuspend', authenticate, requireRole('admin'), unsuspendUser);

export default userSafetyRouter;
