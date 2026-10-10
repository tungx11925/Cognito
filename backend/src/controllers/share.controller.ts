import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db, withTransaction } from '../db';

export const getShareStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { resourceType, resourceId } = req.params;
    const rId = parseInt(resourceId, 10);

    if (resourceType === 'document') {
      const docRes = await db.query(
        'SELECT id, user_id, title, visibility, is_community_published FROM documents WHERE id = $1',
        [rId]
      );
      if (docRes.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
      const doc = docRes.rows[0];
      if (doc.user_id !== userId) return res.status(403).json({ error: 'Permission denied' });

      // Check existing active shared link
      const linkRes = await db.query(
        'SELECT share_token, access_type FROM shared_links WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1',
        [rId]
      );
      const shareToken = linkRes.rows[0]?.share_token;

      // Check community resource
      const commRes = await db.query(
        'SELECT id, is_public FROM community_resources WHERE resource_type = $1 AND resource_id = $2 AND user_id = $3',
        ['document', rId, userId]
      );

      return res.status(200).json({
        visibility: doc.visibility || 'private',
        isCommunityPublished: !!doc.is_community_published || (commRes.rows.length > 0 && commRes.rows[0].is_public),
        shareUrl: shareToken ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${shareToken}` : null,
        accessType: linkRes.rows[0]?.access_type || 'viewer'
      });
    } else if (resourceType === 'deck') {
      const deckRes = await db.query(
        'SELECT id, user_id, name, visibility FROM flashcard_decks WHERE id = $1',
        [rId]
      );
      if (deckRes.rows.length === 0) return res.status(404).json({ error: 'Deck not found' });
      const deck = deckRes.rows[0];
      if (deck.user_id !== userId) return res.status(403).json({ error: 'Permission denied' });

      const linkRes = await db.query(
        'SELECT share_token, access_type FROM shared_links WHERE deck_id = $1 ORDER BY created_at DESC LIMIT 1',
        [rId]
      );
      const shareToken = linkRes.rows[0]?.share_token;

      const commRes = await db.query(
        'SELECT id, is_public FROM community_resources WHERE resource_type = $1 AND resource_id = $2 AND user_id = $3',
        ['flashcard_deck', rId, userId]
      );

      return res.status(200).json({
        visibility: deck.visibility || 'private',
        isCommunityPublished: commRes.rows.length > 0 && commRes.rows[0].is_public,
        shareUrl: shareToken ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${shareToken}` : null,
        accessType: linkRes.rows[0]?.access_type || 'viewer'
      });
    }

    return res.status(400).json({ error: 'Invalid resource type' });
  } catch (error: any) {
    console.error('Error fetching share status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateShareLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { documentId, deckId, visibility, accessType = 'viewer', expiresInDays } = req.body;

    if (!documentId && !deckId) {
      return res.status(400).json({ error: 'documentId or deckId is required' });
    }

    const shareToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/shared/${shareToken}`;

    return await withTransaction(async (client) => {
      // 1. Process DOCUMENT
      if (documentId) {
        const docCheck = await client.query(
          'SELECT id, user_id, title, description, category FROM documents WHERE id = $1',
          [documentId]
        );
        if (docCheck.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
        const doc = docCheck.rows[0];
        if (doc.user_id !== userId) return res.status(403).json({ error: 'Permission denied' });

        if (visibility === 'public') {
          // Public: published to community AND available via link
          await client.query(
            `UPDATE documents SET visibility = 'public', is_community_published = true, updated_at = NOW() WHERE id = $1`,
            [documentId]
          );

          // Synchronize with community_resources table
          const existingComm = await client.query(
            `SELECT id FROM community_resources WHERE resource_type = 'document' AND resource_id = $1 AND user_id = $2`,
            [documentId, userId]
          );

          if (existingComm.rows.length > 0) {
            await client.query(
              `UPDATE community_resources 
               SET is_public = true, is_hidden = false, title = $1, description = $2, category = $3, updated_at = NOW() 
               WHERE id = $4`,
              [doc.title, doc.description || '', doc.category || 'Chung', existingComm.rows[0].id]
            );
          } else {
            await client.query(
              `INSERT INTO community_resources (
                user_id, resource_type, resource_id, title, description, category, is_public, is_hidden, is_test
              ) VALUES ($1, 'document', $2, $3, $4, $5, true, false, false)`,
              [userId, documentId, doc.title, doc.description || '', doc.category || 'Chung']
            );
          }

          // Insert or update shared_links
          const linkResult = await client.query(
            `INSERT INTO shared_links (document_id, share_token, access_type, expires_at)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [documentId, shareToken, accessType, expiresAt]
          );

          return res.status(200).json({
            message: 'Đã xuất bản lên Cộng đồng và tạo liên kết chia sẻ thành công',
            visibility: 'public',
            isCommunityPublished: true,
            shareUrl,
            linkData: linkResult.rows[0]
          });

        } else if (visibility === 'restricted') {
          // Restricted: Accessible via link only, NOT published to community
          await client.query(
            `UPDATE documents SET visibility = 'restricted', is_community_published = false, updated_at = NOW() WHERE id = $1`,
            [documentId]
          );

          // Remove or hide from community
          await client.query(
            `DELETE FROM community_resources WHERE resource_type = 'document' AND resource_id = $1 AND user_id = $2`,
            [documentId, userId]
          );

          const linkResult = await client.query(
            `INSERT INTO shared_links (document_id, share_token, access_type, expires_at)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [documentId, shareToken, accessType, expiresAt]
          );

          return res.status(200).json({
            message: 'Đã bật chia sẻ bằng liên kết (Không hiển thị trên Cộng đồng)',
            visibility: 'restricted',
            isCommunityPublished: false,
            shareUrl,
            linkData: linkResult.rows[0]
          });

        } else {
          // Private: Only owner
          await client.query(
            `UPDATE documents SET visibility = 'private', is_community_published = false, updated_at = NOW() WHERE id = $1`,
            [documentId]
          );

          // Remove from community and remove shared links
          await client.query(
            `DELETE FROM community_resources WHERE resource_type = 'document' AND resource_id = $1 AND user_id = $2`,
            [documentId, userId]
          );
          await client.query('DELETE FROM shared_links WHERE document_id = $1', [documentId]);

          return res.status(200).json({
            message: 'Đã chuyển tài liệu về chế độ riêng tư (Chỉ mình bạn xem được)',
            visibility: 'private',
            isCommunityPublished: false,
            shareUrl: null
          });
        }
      }

      // 2. Process FLASHCARD DECK
      if (deckId) {
        const deckCheck = await client.query(
          'SELECT id, user_id, name, description FROM flashcard_decks WHERE id = $1',
          [deckId]
        );
        if (deckCheck.rows.length === 0) return res.status(404).json({ error: 'Deck not found' });
        const deck = deckCheck.rows[0];
        if (deck.user_id !== userId) return res.status(403).json({ error: 'Permission denied' });

        if (visibility === 'public') {
          await client.query(
            `UPDATE flashcard_decks SET visibility = 'public' WHERE id = $1`,
            [deckId]
          );

          const existingComm = await client.query(
            `SELECT id FROM community_resources WHERE resource_type = 'flashcard_deck' AND resource_id = $1 AND user_id = $2`,
            [deckId, userId]
          );

          if (existingComm.rows.length > 0) {
            await client.query(
              `UPDATE community_resources 
               SET is_public = true, is_hidden = false, title = $1, description = $2, updated_at = NOW() 
               WHERE id = $3`,
              [deck.name, deck.description || '', existingComm.rows[0].id]
            );
          } else {
            await client.query(
              `INSERT INTO community_resources (
                user_id, resource_type, resource_id, title, description, category, is_public, is_hidden, is_test
              ) VALUES ($1, 'flashcard_deck', $2, $3, $4, 'Thẻ ghi nhớ', true, false, false)`,
              [userId, deckId, deck.name, deck.description || '']
            );
          }

          const linkResult = await client.query(
            `INSERT INTO shared_links (deck_id, share_token, access_type, expires_at)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [deckId, shareToken, accessType, expiresAt]
          );

          return res.status(200).json({
            message: 'Đã xuất bản bộ thẻ lên Cộng đồng và tạo liên kết thành công',
            visibility: 'public',
            isCommunityPublished: true,
            shareUrl,
            linkData: linkResult.rows[0]
          });
        } else if (visibility === 'restricted') {
          await client.query(
            `UPDATE flashcard_decks SET visibility = 'restricted' WHERE id = $1`,
            [deckId]
          );
          await client.query(
            `DELETE FROM community_resources WHERE resource_type = 'flashcard_deck' AND resource_id = $1 AND user_id = $2`,
            [deckId, userId]
          );

          const linkResult = await client.query(
            `INSERT INTO shared_links (deck_id, share_token, access_type, expires_at)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [deckId, shareToken, accessType, expiresAt]
          );

          return res.status(200).json({
            message: 'Đã bật chia sẻ bộ thẻ bằng liên kết',
            visibility: 'restricted',
            isCommunityPublished: false,
            shareUrl,
            linkData: linkResult.rows[0]
          });
        } else {
          await client.query(
            `UPDATE flashcard_decks SET visibility = 'private' WHERE id = $1`,
            [deckId]
          );
          await client.query(
            `DELETE FROM community_resources WHERE resource_type = 'flashcard_deck' AND resource_id = $1 AND user_id = $2`,
            [deckId, userId]
          );
          await client.query('DELETE FROM shared_links WHERE deck_id = $1', [deckId]);

          return res.status(200).json({
            message: 'Đã chuyển bộ thẻ về chế độ riêng tư',
            visibility: 'private',
            isCommunityPublished: false,
            shareUrl: null
          });
        }
      }
    });
  } catch (error: any) {
    console.error('Error generating share link:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
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
      return res.status(404).json({ error: 'Liên kết không tồn tại hoặc đã bị gỡ' });
    }

    const link = result.rows[0];

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(403).json({ error: 'Liên kết này đã hết hạn' });
    }
    
    // Check if underlying resource is still public or restricted
    const visibility = link.doc_visibility || link.deck_visibility;
    if (visibility === 'private') {
      return res.status(403).json({ error: 'Tài nguyên này đã chuyển về chế độ riêng tư' });
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
