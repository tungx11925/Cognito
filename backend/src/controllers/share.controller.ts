import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';

export const generateShareLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { documentId, deckId, visibility, accessType = 'viewer', expiresInDays } = req.body;

    if (!documentId && !deckId) {
      return res.status(400).json({ error: 'documentId or deckId is required' });
    }

    // Verify ownership and update visibility
    if (documentId) {
      const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [documentId, userId]);
      if (docCheck.rows.length === 0) return res.status(403).json({ error: 'Permission denied' });
      
      await db.query('UPDATE documents SET visibility = $1 WHERE id = $2', [visibility, documentId]);
    } else if (deckId) {
      const deckCheck = await db.query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deckId, userId]);
      if (deckCheck.rows.length === 0) return res.status(403).json({ error: 'Permission denied' });
      
      await db.query('UPDATE flashcard_decks SET visibility = $1 WHERE id = $2', [visibility, deckId]);
    }

    if (visibility === 'private') {
      return res.status(200).json({ message: 'Resource is now private' });
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    const result = await db.query(
      `INSERT INTO shared_links (document_id, deck_id, share_token, access_type, expires_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [documentId || null, deckId || null, shareToken, accessType, expiresAt]
    );

    res.status(201).json({
      message: 'Share link generated',
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${shareToken}`,
      linkData: result.rows[0]
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const accessSharedLink = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `SELECT sl.*, 
              d.title as doc_title, d.doc_url, d.visibility as doc_visibility,
              c.name as deck_title, c.visibility as deck_visibility
       FROM shared_links sl
       LEFT JOIN documents d ON sl.document_id = d.id
       LEFT JOIN flashcard_decks c ON sl.deck_id = c.id
       WHERE sl.share_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link does not exist' });
    }

    const link = result.rows[0];

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ error: 'This link has expired' });
    }
    
    // Check if underlying resource is still public or restricted
    const visibility = link.doc_visibility || link.deck_visibility;
    if (visibility === 'private') {
      return res.status(403).json({ error: 'This resource is no longer shared' });
    }

    res.status(200).json({
      resource: {
        type: link.document_id ? 'document' : 'deck',
        id: link.document_id || link.deck_id,
        title: link.doc_title || link.deck_title,
        doc_url: link.doc_url,
      },
      access_type: link.access_type
    });
  } catch (error) {
    console.error('Error accessing share link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
