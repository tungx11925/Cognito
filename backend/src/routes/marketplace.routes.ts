import { Router } from 'express';
import { getMarketplaceResources, unlockResource } from '../controllers/marketplace.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/marketplace/resources
router.get('/resources', getMarketplaceResources);

// POST /api/marketplace/unlock
router.post('/unlock', authenticate, unlockResource);

export default router;
