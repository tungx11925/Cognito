import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { searchService, UnifiedSearchQuery } from '../services/search.service';

export class SearchController {
  /**
   * GET /api/search
   * Unified search endpoint across documents, community, test sets, and profiles
   */
  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const tab = req.query.tab as any;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const type = typeof req.query.type === 'string' ? req.query.type : undefined;
      const sort = req.query.sort as any;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const onlyMine = req.query.onlyMine === 'true' || req.query.onlyMine === '1';

      const userId = req.user?.id;

      const query: UnifiedSearchQuery = {
        q,
        tab,
        category,
        type,
        sort,
        page,
        limit,
        onlyMine,
      };

      const result = await searchService.search(userId, query);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/search/suggestions
   * Fast autocomplete suggestions for global search bar
   */
  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const suggestions = await searchService.getSuggestions(q);

      return res.status(200).json({
        success: true,
        data: suggestions,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
