import { db, withTransaction } from '../db';
import { PoolClient } from 'pg';

class FlashcardRepository {

  async getDecks(userId: number) {
    const result = await db.query(
      `SELECT d.*,
              COALESCE(COUNT(f.id), 0)::int AS card_count,
              COALESCE(COUNT(CASE WHEN f.repetitions > 0 THEN 1 END), 0)::int AS mastered_count,
              COALESCE(COUNT(CASE WHEN f.next_review_at IS NULL OR f.next_review_at <= CURRENT_TIMESTAMP THEN 1 END), 0)::int AS due_count
       FROM flashcard_decks d
       LEFT JOIN flashcards f ON f.deck_id = d.id
       WHERE d.user_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getDeckById(deckId: number) {
    const result = await db.query(
      `SELECT d.*,
              COALESCE(COUNT(f.id), 0)::int AS card_count,
              COALESCE(COUNT(CASE WHEN f.repetitions > 0 THEN 1 END), 0)::int AS mastered_count,
              COALESCE(COUNT(CASE WHEN f.next_review_at IS NULL OR f.next_review_at <= CURRENT_TIMESTAMP THEN 1 END), 0)::int AS due_count
       FROM flashcard_decks d
       LEFT JOIN flashcards f ON f.deck_id = d.id
       WHERE d.id = $1
       GROUP BY d.id`,
      [deckId]
    );
    return result.rows[0];
  }

  async getDeckCards(deckId: number) {
    const result = await db.query(
      'SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY position ASC, id ASC',
      [deckId]
    );
    return result.rows;
  }

  async getDueCards(deckId: number) {
    const result = await db.query(
      'SELECT * FROM flashcards WHERE deck_id = $1 AND (next_review_at IS NULL OR next_review_at <= CURRENT_TIMESTAMP) ORDER BY position ASC, next_review_at ASC',
      [deckId]
    );
    return result.rows;
  }

  async createDeck(userId: number, name: string, description: string, isPublic: boolean, visibility: string = 'private', category?: string | null) {
    const vis = visibility || (isPublic ? 'public' : 'private');
    const pub = vis === 'public';
    const result = await db.query(
      'INSERT INTO flashcard_decks (user_id, name, description, is_public, visibility, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, name, description, pub, vis, category || null]
    );
    return result.rows[0];
  }

  async updateDeck(deckId: number, name: string, description: string, isPublic: boolean, visibility?: string, category?: string | null) {
    const vis = visibility || (isPublic ? 'public' : 'private');
    const pub = vis === 'public';
    const result = await db.query(
      'UPDATE flashcard_decks SET name = $1, description = $2, is_public = $3, visibility = $4, category = COALESCE($5, category) WHERE id = $6 RETURNING *',
      [name, description, pub, vis, category !== undefined ? category : null, deckId]
    );
    return result.rows[0];
  }

  async createDeckWithCards(
    userId: number,
    name: string,
    description: string,
    visibility: string,
    category: string | null,
    cards: Array<{ front: string; back: string; position?: number; term_image_url?: string | null; definition_image_url?: string | null }>
  ) {
    return await withTransaction(async (client: PoolClient) => {
      const isPublic = visibility === 'public';
      const deckRes = await client.query(
        `INSERT INTO flashcard_decks (user_id, name, description, is_public, visibility, category)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, name, description, isPublic, visibility, category]
      );
      const deck = deckRes.rows[0];

      const insertedCards = [];
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const pos = c.position !== undefined ? c.position : i;
        const cardRes = await client.query(
          `INSERT INTO flashcards (deck_id, front, back, position, term_image_url, definition_image_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [deck.id, c.front, c.back, pos, c.term_image_url || null, c.definition_image_url || null]
        );
        insertedCards.push(cardRes.rows[0]);
      }

      return {
        ...deck,
        cards: insertedCards,
        card_count: insertedCards.length
      };
    });
  }

  async updateDeckWithCards(
    deckId: number,
    name: string,
    description: string,
    visibility: string,
    category: string | null,
    cards?: Array<{ id?: number; front: string; back: string; position?: number; term_image_url?: string | null; definition_image_url?: string | null }>
  ) {
    return await withTransaction(async (client: PoolClient) => {
      const isPublic = visibility === 'public';
      const deckRes = await client.query(
        `UPDATE flashcard_decks 
         SET name = $1, description = $2, is_public = $3, visibility = $4, category = $5
         WHERE id = $6
         RETURNING *`,
        [name, description, isPublic, visibility, category, deckId]
      );
      const deck = deckRes.rows[0];

      if (!cards) {
        return deck;
      }

      // Collect IDs of cards that should be preserved/updated
      const incomingIds: number[] = [];
      const updatedCards = [];

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const pos = c.position !== undefined ? c.position : i;

        if (c.id) {
          incomingIds.push(c.id);
          // Update existing card without resetting SM-2 intervals/ease_factor!
          const uRes = await client.query(
            `UPDATE flashcards 
             SET front = $1, back = $2, position = $3, term_image_url = $4, definition_image_url = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 AND deck_id = $7
             RETURNING *`,
            [c.front, c.back, pos, c.term_image_url || null, c.definition_image_url || null, c.id, deckId]
          );
          if (uRes.rows[0]) {
            updatedCards.push(uRes.rows[0]);
          }
        } else {
          // New card
          const iRes = await client.query(
            `INSERT INTO flashcards (deck_id, front, back, position, term_image_url, definition_image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [deckId, c.front, c.back, pos, c.term_image_url || null, c.definition_image_url || null]
          );
          if (iRes.rows[0]) {
            incomingIds.push(iRes.rows[0].id);
            updatedCards.push(iRes.rows[0]);
          }
        }
      }

      // Delete removed cards
      if (incomingIds.length > 0) {
        await client.query(
          `DELETE FROM flashcards WHERE deck_id = $1 AND id NOT IN (${incomingIds.map((_, idx) => `$${idx + 2}`).join(',')})`,
          [deckId, ...incomingIds]
        );
      } else if (cards.length === 0) {
        await client.query('DELETE FROM flashcards WHERE deck_id = $1', [deckId]);
      }

      return {
        ...deck,
        cards: updatedCards,
        card_count: updatedCards.length
      };
    });
  }

  async getStudySettings(userId: number, deckId: number) {
    const result = await db.query(
      'SELECT * FROM flashcard_study_settings WHERE user_id = $1 AND deck_id = $2',
      [userId, deckId]
    );
    if (result.rows.length === 0) {
      return {
        user_id: userId,
        deck_id: deckId,
        shuffle_cards: false,
        front_display: 'term',
        starred_only: false,
        difficult_only: false,
        auto_tts: false,
      };
    }
    return result.rows[0];
  }

  async saveStudySettings(
    userId: number,
    deckId: number,
    settings: {
      shuffle_cards?: boolean;
      front_display?: 'term' | 'definition';
      starred_only?: boolean;
      difficult_only?: boolean;
      auto_tts?: boolean;
    }
  ) {
    const current = await this.getStudySettings(userId, deckId);
    const shuffle = settings.shuffle_cards !== undefined ? settings.shuffle_cards : current.shuffle_cards;
    const frontDisplay = settings.front_display !== undefined ? settings.front_display : current.front_display;
    const starredOnly = settings.starred_only !== undefined ? settings.starred_only : current.starred_only;
    const diffOnly = settings.difficult_only !== undefined ? settings.difficult_only : current.difficult_only;
    const autoTts = settings.auto_tts !== undefined ? settings.auto_tts : current.auto_tts;

    const result = await db.query(
      `INSERT INTO flashcard_study_settings (user_id, deck_id, shuffle_cards, front_display, starred_only, difficult_only, auto_tts, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, deck_id)
       DO UPDATE SET 
         shuffle_cards = EXCLUDED.shuffle_cards,
         front_display = EXCLUDED.front_display,
         starred_only = EXCLUDED.starred_only,
         difficult_only = EXCLUDED.difficult_only,
         auto_tts = EXCLUDED.auto_tts,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, deckId, shuffle, frontDisplay, starredOnly, diffOnly, autoTts]
    );
    return result.rows[0];
  }

  async deleteDeck(deckId: number) {
    const result = await db.query('DELETE FROM flashcard_decks WHERE id = $1 RETURNING *', [deckId]);
    return result.rows[0];
  }

  async createFlashcard(deckId: number, documentId: number | null, front: string, back: string, position: number = 0, termImageUrl?: string | null, definitionImageUrl?: string | null) {
    const result = await db.query(
      'INSERT INTO flashcards (deck_id, document_id, front, back, position, term_image_url, definition_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [deckId, documentId, front, back, position, termImageUrl || null, definitionImageUrl || null]
    );
    return result.rows[0];
  }

  async updateFlashcard(cardId: number, front: string, back: string, position?: number, termImageUrl?: string | null, definitionImageUrl?: string | null) {
    const result = await db.query(
      `UPDATE flashcards 
       SET front = $1, back = $2, 
           position = COALESCE($3, position), 
           term_image_url = COALESCE($4, term_image_url), 
           definition_image_url = COALESCE($5, definition_image_url), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 RETURNING *`,
      [front, back, position !== undefined ? position : null, termImageUrl !== undefined ? termImageUrl : null, definitionImageUrl !== undefined ? definitionImageUrl : null, cardId]
    );
    return result.rows[0];
  }

  async deleteFlashcard(cardId: number) {
    const result = await db.query('DELETE FROM flashcards WHERE id = $1 RETURNING id', [cardId]);
    return result.rows[0];
  }

  async starFlashcard(cardId: number, isStarred: boolean) {
    const result = await db.query(
      'UPDATE flashcards SET is_starred = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [isStarred, cardId]
    );
    return result.rows[0];
  }


  async getCommunityDecks() {
    const result = await db.query(`
      SELECT d.*, u.name as author_name, u.avatar_url,
             (SELECT COUNT(*) FROM flashcards WHERE deck_id = d.id) as card_count,
             (SELECT COUNT(*) FROM flashcard_decks WHERE forked_from_id = d.id) as fork_count
      FROM flashcard_decks d
      JOIN users u ON d.user_id = u.id
      WHERE d.is_public = true
      ORDER BY d.created_at DESC
    `);
    return result.rows;
  }

  // Allow fallback check for old tables in fork
  async getDeckForFork(deckId: number) {
    let result = await db.query('SELECT * FROM card_decks WHERE id = $1', [deckId]);
    if (result.rows.length === 0) {
      result = await db.query('SELECT * FROM flashcard_decks WHERE id = $1', [deckId]);
    }
    return result.rows[0];
  }

  async copyCards(sourceDeckId: number, targetDeckId: number) {
    const cards = await this.getDeckCards(sourceDeckId);
    for (let card of cards) {
      await db.query(
        'INSERT INTO flashcards (deck_id, front, back) VALUES ($1, $2, $3)',
        [targetDeckId, card.front, card.back]
      );
    }
  }

  async getLeaderboard(deckId: number) {
    const result = await db.query(`
      SELECT m.id, m.time_ms, m.played_at, u.name, u.avatar_url 
      FROM match_game_leaderboards m
      JOIN users u ON m.user_id = u.id
      WHERE m.deck_id = $1
      ORDER BY m.time_ms ASC
      LIMIT 5
    `, [deckId]);
    return result.rows;
  }

  async addLeaderboardEntry(deckId: number, userId: number, timeMs: number) {
    const result = await db.query(
      'INSERT INTO match_game_leaderboards (deck_id, user_id, time_ms) VALUES ($1, $2, $3) RETURNING *',
      [deckId, userId, timeMs]
    );
    return result.rows[0];
  }

  async getCardWithDeckUser(cardId: number, userId: number) {
    const result = await db.query(
      `SELECT f.* FROM flashcards f 
       JOIN flashcard_decks d ON f.deck_id = d.id 
       WHERE f.id = $1 AND d.user_id = $2`, 
      [cardId, userId]
    );
    return result.rows[0];
  }

  async updateCardReview(cardId: number, easeFactor: number, repetitions: number, intervalDays: number, nextReview: Date) {
    const result = await db.query(
      `UPDATE flashcards 
       SET ease_factor = $1, repetitions = $2, interval_days = $3, next_review_at = $4 
       WHERE id = $5 RETURNING *`,
      [easeFactor, repetitions, intervalDays, nextReview, cardId]
    );
    return result.rows[0];
  }
}

export const flashcardRepository = new FlashcardRepository();
