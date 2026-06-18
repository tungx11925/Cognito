import { Router } from 'express';
import { generateShareLink, accessSharedLink } from '../controllers/share.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/shares/generate
router.post('/generate', authenticate, generateShareLink);

// GET /api/shares/access/:token
router.get('/access/:token', accessSharedLink);

export default router;
