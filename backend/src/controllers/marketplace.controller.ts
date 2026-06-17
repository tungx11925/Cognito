import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';

export const getMarketplaceResources = async (req: AuthRequest, res: Response) => {
  try {
    const { type, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 'document' as type, d.id, d.title, d.description, d.price, u.username as author_name, d.created_at
      FROM documents d
      JOIN users u ON d.user_id = u.id
      WHERE d.visibility = 'public'
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND d.title ILIKE $${params.length}`;
    }

    let deckQuery = `
      SELECT 'deck' as type, c.id, c.name as title, c.description, c.price, u.username as author_name, c.created_at
      FROM flashcard_decks c
      JOIN users u ON c.user_id = u.id
      WHERE c.visibility = 'public'
    `;

    if (search) {
      deckQuery += ` AND c.name ILIKE $${params.length}`;
    }

    let finalQuery = '';
    if (type === 'document') {
      finalQuery = query;
    } else if (type === 'deck') {
      finalQuery = deckQuery;
    } else {
      finalQuery = `${query} UNION ALL ${deckQuery}`;
    }

    finalQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(finalQuery, params);
    
    res.status(200).json({ resources: result.rows });
  } catch (error) {
    console.error('Error fetching marketplace resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlockResource = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { documentId, deckId } = req.body;

    if (!documentId && !deckId) {
      return res.status(400).json({ error: 'documentId or deckId is required' });
    }

    // 1. Check if already purchased
    const purchaseCheck = await db.query(
      `SELECT id FROM purchased_resources WHERE user_id = $1 AND (document_id = $2 OR deck_id = $3)`,
      [userId, documentId || null, deckId || null]
    );

    if (purchaseCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Resource already unlocked' });
    }

    // 2. Get resource price and owner
    let price = 0;
    let ownerId = null;

    if (documentId) {
      const docCheck = await db.query('SELECT price, user_id FROM documents WHERE id = $1 AND visibility = $2', [documentId, 'public']);
      if (docCheck.rows.length === 0) return res.status(404).json({ error: 'Public document not found' });
      price = docCheck.rows[0].price;
      ownerId = docCheck.rows[0].user_id;
    } else {
      const deckCheck = await db.query('SELECT price, user_id FROM flashcard_decks WHERE id = $1 AND visibility = $2', [deckId, 'public']);
      if (deckCheck.rows.length === 0) return res.status(404).json({ error: 'Public deck not found' });
      price = deckCheck.rows[0].price;
      ownerId = deckCheck.rows[0].user_id;
    }

    if (ownerId === userId) {
      return res.status(400).json({ error: 'You already own this resource' });
    }

    // 3. Transaction
    await db.query('BEGIN');

    if (price > 0) {
      // Check buyer balance
      const userCheck = await db.query('SELECT wallet_balance FROM users WHERE id = $1', [userId]);
      const balance = userCheck.rows[0].wallet_balance;

      if (balance < price) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct from buyer
      await db.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [price, userId]);
      
      // Add to seller
      await db.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [price, ownerId]);

      // Record transaction
      await db.query(
        `INSERT INTO transactions (user_id, document_id, amount, status) VALUES ($1, $2, $3, $4)`,
        [userId, documentId || null, -price, 'success']
      );
    }

    // 4. Record purchase
    await db.query(
      `INSERT INTO purchased_resources (user_id, document_id, deck_id) VALUES ($1, $2, $3)`,
      [userId, documentId || null, deckId || null]
    );

    await db.query('COMMIT');

    res.status(200).json({ message: 'Resource unlocked successfully' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error unlocking resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
