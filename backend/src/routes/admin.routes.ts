import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import { 
  getAdminStats, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getDocuments, 
  deleteDocument, 
  warnUser, 
  suspendUser, 
  unsuspendUser, 
  getUserDetails, 
  getAdminSubscriptions, 
  getAdminOrders, 
  syncSubscriptionsCron, 
  cancelAdminSubscription,
  getAICostStats
} from '../controllers/admin.controller';
import { getAdminFeedbacks, deleteAdminFeedback } from '../controllers/feedback.controller';

const router = Router();

// All admin routes are strictly guarded by authenticate + requireRole('admin')
// Non-admin accounts will strictly receive HTTP 403 Forbidden
router.use(authenticate, requireRole('admin'));

// 1. Dashboard & Platform Analytics
router.get('/stats', rateLimiter(60000, 60), getAdminStats);
router.get('/ai-costs', rateLimiter(60000, 60), getAICostStats);

// 2. User Management (Guarded by Role + Rate Limited for Defense-in-Depth)
router.get('/users', rateLimiter(60000, 120), getUsers);
router.post('/users', rateLimiter(60000, 30), createUser);
router.get('/users/:id/details', rateLimiter(60000, 120), getUserDetails);
router.put('/users/:id', rateLimiter(60000, 60), updateUser);
router.delete('/users/:id', rateLimiter(60000, 30), deleteUser);
router.post('/users/:id/warn', rateLimiter(60000, 60), warnUser);
router.post('/users/:id/suspend', rateLimiter(60000, 30), suspendUser);
router.post('/users/:id/unsuspend', rateLimiter(60000, 30), unsuspendUser);

// 3. Subscription & Revenue Management
router.get('/subscriptions', rateLimiter(60000, 120), getAdminSubscriptions);
router.post('/subscriptions/sync', rateLimiter(60000, 60), syncSubscriptionsCron);
router.post('/subscriptions/:id/cancel', rateLimiter(60000, 60), cancelAdminSubscription);
router.get('/orders', rateLimiter(60000, 120), getAdminOrders);

// 4. Documents & Content Management (Zero Private Content Leakage)
router.get('/documents', rateLimiter(60000, 120), getDocuments);
router.delete('/documents/:id', rateLimiter(60000, 30), deleteDocument);
router.get('/feedbacks', rateLimiter(60000, 120), getAdminFeedbacks);
router.delete('/feedbacks/:id', rateLimiter(60000, 30), deleteAdminFeedback);

export default router;
