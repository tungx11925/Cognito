import { Router } from 'express';
import { optionalAuthenticate } from '../middlewares/auth.middleware';
import { searchController } from '../controllers/search.controller';

const router = Router();

// GET /api/search - Unified Search (Supports guest or authenticated)
router.get('/', optionalAuthenticate, (req, res, next) => {
  searchController.search(req as any, res, next);
});

// GET /api/search/suggestions - Autocomplete keyword suggestions
router.get('/suggestions', (req, res, next) => {
  searchController.getSuggestions(req, res, next);
});

export default router;
