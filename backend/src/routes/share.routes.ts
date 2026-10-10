import { Router } from 'express';
import { generateShareLink, accessSharedLink, getShareStatus } from '../controllers/share.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/shares/status/:resourceType/:resourceId
router.get('/status/:resourceType/:resourceId', authenticate, getShareStatus);

// POST /api/shares/generate
router.post('/generate', authenticate, generateShareLink);

// GET /api/shares/access/:token
router.get('/access/:token', accessSharedLink);

export default router;
