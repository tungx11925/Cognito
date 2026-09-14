import { db } from '../db';

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
    const result = await db.query('SELECT * FROM flashcard_decks WHERE id = $1', [deckId]);
    return result.rows[0];
  }

  async getDeckCards(deckId: number) {
    const result = await db.query('SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY id ASC', [deckId]);
    return result.rows;
  }

  async getDueCards(deckId: number) {
    const result = await db.query(
      'SELECT * FROM flashcards WHERE deck_id = $1 AND (next_review_at IS NULL OR next_review_at <= CURRENT_TIMESTAMP) ORDER BY next_review_at ASC',
      [deckId]
    );
    return result.rows;
  }

  async createDeck(userId: number, name: string, description: string, isPublic: boolean) {
    const result = await db.query(
      'INSERT INTO flashcard_decks (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, description, isPublic]
    );
    return result.rows[0];
  }

  async updateDeck(deckId: number, name: string, description: string, isPublic: boolean) {
    const result = await db.query(
      'UPDATE flashcard_decks SET name = $1, description = $2, is_public = $3 WHERE id = $4 RETURNING *',
      [name, description, isPublic, deckId]
    );
    return result.rows[0];
  }

  async deleteDeck(deckId: number) {
    const result = await db.query('DELETE FROM flashcard_decks WHERE id = $1 RETURNING *', [deckId]);
    return result.rows[0];
  }

  async createFlashcard(deckId: number, documentId: number | null, front: string, back: string) {
    const result = await db.query(
      'INSERT INTO flashcards (deck_id, document_id, front, back) VALUES ($1, $2, $3, $4) RETURNING *',
      [deckId, documentId, front, back]
    );
    return result.rows[0];
  }

  async updateFlashcard(cardId: number, front: string, back: string) {
    const result = await db.query(
      'UPDATE flashcards SET front = $1, back = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [front, back, cardId]
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

  async checkPurchase(userId: number, deckId: number) {
    const result = await db.query(
      'SELECT id FROM purchased_resources WHERE user_id = $1 AND deck_id = $2',
      [userId, deckId]
    );
    return result.rows.length > 0;
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
