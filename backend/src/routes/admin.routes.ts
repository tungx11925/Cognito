import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import { 
  getAdminStats, 
  getUsers, 
  createUser,
  updateUser,
  deleteUser, 
  getDocuments, 
  deleteDocument,
  getTransactions,
  warnUser,
  getUserDetails
} from '../controllers/admin.controller';

const router = Router();

// Middleware checking for admin email 'admin@edushare.com'
const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.email !== 'admin@edushare.com') {
    return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ dành cho quản trị viên.' });
  }
  next();
};

// All admin routes are protected by authenticate + authorizeAdmin
router.use(authenticate, authorizeAdmin);

router.get('/stats', getAdminStats);
router.get('/users', rateLimiter(60000, 120), getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/warn', rateLimiter(60000, 10), warnUser);
router.get('/users/:id/details', getUserDetails);
router.get('/documents', rateLimiter(60000, 120), getDocuments);
router.delete('/documents/:id', deleteDocument);
router.get('/transactions', getTransactions);

export default router;
