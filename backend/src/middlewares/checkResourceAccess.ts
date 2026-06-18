import { Response, NextFunction } from 'express';
import { db } from '../db';
import { AuthRequest } from './auth.middleware';

export const checkResourceAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const documentId = req.params.documentId || req.params.id;
    const deckId = req.params.deckId;
    const shareToken = req.query.share_token as string;

    if (!documentId && !deckId) {
      return res.status(400).json({ error: 'Resource ID required' });
    }

    let resource;
    
    if (documentId) {
      const result = await db.query('SELECT user_id, visibility FROM documents WHERE id = $1', [documentId]);
      if (result.rows.length > 0) resource = result.rows[0];
    } else if (deckId) {
      const result = await db.query('SELECT user_id, visibility FROM flashcard_decks WHERE id = $1', [deckId]);
      if (result.rows.length > 0) resource = result.rows[0];
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // 1. If public
    if (resource.visibility === 'public') {
      return next();
    }

    // 2. If restricted, check share_token
    if (resource.visibility === 'restricted' && shareToken) {
      const linkCheck = await db.query(
        `SELECT id FROM shared_links WHERE share_token = $1 AND (document_id = $2 OR deck_id = $3)`,
        [shareToken, documentId || null, deckId || null]
      );
      if (linkCheck.rows.length > 0) {
        return next();
      }
    }

    // 3. If private or restricted without valid token, must be owner
    if (resource.user_id === userId) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Error checking resource access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
