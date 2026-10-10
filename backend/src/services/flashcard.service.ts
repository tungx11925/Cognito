import { flashcardRepository } from '../repositories/flashcard.repository';
import { AppError } from '../utils/AppError';
import { activityService } from './activity.service';
import { communityService } from './community.service';
import { db } from '../db';

class FlashcardService {
  async getDecks(userId: number) {
    return await flashcardRepository.getDecks(userId);
  }

  async getDeckById(deckId: number) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck) {
      throw new AppError('Không tìm thấy bộ bài', 404);
    }
    return deck;
  }

  async getDeckCards(deckId: number, userId?: number) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }
    // Cho phép nếu là chủ sở hữu, hoặc deck public / link
    const isOwner = userId !== undefined && deck.user_id === userId;
    const isPublic = deck.is_public || deck.visibility === 'public' || deck.visibility === 'link';
    if (!isOwner && !isPublic) {
      throw new AppError('Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại', 403);
    }
    return await flashcardRepository.getDeckCards(deckId);
  }

  async getDueCards(deckId: number, userId: number) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck || (deck.user_id !== userId && !deck.is_public)) {
      throw new AppError('Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại', 403);
    }
    return await flashcardRepository.getDueCards(deckId);
  }

  async createDeck(
    userId: number,
    name: string,
    description?: string,
    isPublic?: boolean,
    visibility?: 'private' | 'link' | 'public',
    category?: string | null,
    cards?: Array<{ front: string; back: string; position?: number; term_image_url?: string | null; definition_image_url?: string | null }>
  ) {
    const vis = visibility || (isPublic ? 'public' : 'private');
    const pub = vis === 'public';
    let deck;

    if (cards && Array.isArray(cards) && cards.length > 0) {
      deck = await flashcardRepository.createDeckWithCards(userId, name, description || '', vis, category || null, cards);
    } else {
      deck = await flashcardRepository.createDeck(userId, name, description || '', pub, vis, category || null);
    }

    // Phase 40B: Sync to community_resources if public
    if (vis === 'public') {
      try {
        await communityService.publishResource(userId, {
          resourceType: 'flashcard_deck',
          resourceId: deck.id,
          title: name,
          description: description || '',
          category: category || 'Chung',
          tags: ['flashcard', category || 'chung'],
          isPublic: true,
        });
      } catch (err) {
        console.warn('Sync deck to community non-fatal error:', err);
      }
    }

    return deck;
  }

  async updateDeck(
    deckId: number,
    userId: number,
    name?: string,
    description?: string,
    isPublic?: boolean,
    visibility?: 'private' | 'link' | 'public',
    category?: string | null,
    cards?: Array<{ id?: number; front: string; back: string; position?: number; term_image_url?: string | null; definition_image_url?: string | null }>
  ) {
    const currentDeck = await this.getDeckById(deckId);
    if (currentDeck.user_id !== userId) {
      throw new AppError('Bạn không có quyền sửa bộ thẻ này', 403);
    }

    const newName = name !== undefined ? name : currentDeck.name;
    const newDesc = description !== undefined ? description : currentDeck.description;
    const newVis = visibility !== undefined ? visibility : (isPublic !== undefined ? (isPublic ? 'public' : 'private') : (currentDeck.visibility || 'private'));
    const newIsPublic = newVis === 'public';
    const newCat = category !== undefined ? category : currentDeck.category;

    let updatedDeck;
    if (cards !== undefined && Array.isArray(cards)) {
      updatedDeck = await flashcardRepository.updateDeckWithCards(deckId, newName, newDesc, newVis, newCat, cards);
    } else {
      updatedDeck = await flashcardRepository.updateDeck(deckId, newName, newDesc, newIsPublic, newVis, newCat);
    }

    // Phase 40B: Sync to community
    if (newVis === 'public') {
      try {
        await communityService.publishResource(userId, {
          resourceType: 'flashcard_deck',
          resourceId: deckId,
          title: newName,
          description: newDesc,
          category: newCat || 'Chung',
          tags: ['flashcard', newCat || 'chung'],
          isPublic: true,
        });
      } catch (err) {
        console.warn('Sync deck to community non-fatal error:', err);
      }
    } else {
      try {
        await db.query(
          `DELETE FROM community_resources WHERE resource_type = 'flashcard_deck' AND resource_id = $1`,
          [deckId]
        );
      } catch (err) {
        console.warn('Unpublish deck from community non-fatal error:', err);
      }
    }

    return updatedDeck;
  }

  async getStudySettings(userId: number, deckId: number) {
    return await flashcardRepository.getStudySettings(userId, deckId);
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
    return await flashcardRepository.saveStudySettings(userId, deckId, settings);
  }


  async deleteDeck(deckId: number) {
    const deleted = await flashcardRepository.deleteDeck(deckId);
    if (!deleted) {
      throw new AppError('Không tìm thấy bộ bài để xóa', 404);
    }
    return deleted;
  }

  async createFlashcard(
    userId: number,
    deckId: number,
    documentId: number | null,
    front: string,
    back: string,
    position: number = 0,
    termImageUrl?: string | null,
    definitionImageUrl?: string | null
  ) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck || deck.user_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại', 403);
    }
    if (documentId) {
      const docCheck = await db.query(
        'SELECT id, user_id, visibility FROM documents WHERE id = $1',
        [documentId]
      );
      if (docCheck.rows.length === 0) {
        throw new AppError('Tài liệu được gắn không tồn tại', 404);
      }
      const doc = docCheck.rows[0];
      if (doc.user_id !== userId && doc.visibility !== 'public') {
        throw new AppError('Bạn không có quyền truy cập hoặc liên kết với tài liệu riêng tư này', 403);
      }
    }
    return await flashcardRepository.createFlashcard(deckId, documentId, front, back, position, termImageUrl, definitionImageUrl);
  }

  async updateFlashcard(
    cardId: number,
    userId: number,
    front: string,
    back: string,
    position?: number,
    termImageUrl?: string | null,
    definitionImageUrl?: string | null
  ) {
    const card = await flashcardRepository.getCardWithDeckUser(cardId, userId);
    if (!card) {
      throw new AppError('Flashcard không tồn tại hoặc không có quyền', 404);
    }
    const updated = await flashcardRepository.updateFlashcard(cardId, front, back, position, termImageUrl, definitionImageUrl);
    return updated;
  }

  async deleteFlashcard(cardId: number, userId: number) {
    const card = await flashcardRepository.getCardWithDeckUser(cardId, userId);
    if (!card) {
      throw new AppError('Flashcard không tồn tại hoặc không có quyền', 404);
    }
    const deleted = await flashcardRepository.deleteFlashcard(cardId);
    return deleted;
  }

  async starFlashcard(cardId: number, userId: number, isStarred: boolean) {
    const card = await flashcardRepository.getCardWithDeckUser(cardId, userId);
    if (!card) {
      throw new AppError('Flashcard không tồn tại hoặc không có quyền', 404);
    }
    const updated = await flashcardRepository.starFlashcard(cardId, isStarred);
    return updated;
  }

  async getCommunityDecks() {
    return await flashcardRepository.getCommunityDecks();
  }

  async forkDeck(deckId: number, userId: number) {
    const originalDeck = await flashcardRepository.getDeckForFork(deckId);
    if (!originalDeck) {
      throw new AppError('Không tìm thấy bộ thẻ', 404);
    }
    
    let isAuthorized = false;
    if (originalDeck.user_id === userId) isAuthorized = true;
    if (originalDeck.visibility === 'public' && (originalDeck.price === 0 || originalDeck.price === null)) isAuthorized = true;
    if (originalDeck.is_public && (originalDeck.price === 0 || originalDeck.price === null)) isAuthorized = true;
    
    if (!isAuthorized) {
      throw new AppError('Bạn không có quyền sao chép bộ thẻ riêng tư này', 403);
    }

    const newDeckName = originalDeck.name || originalDeck.title + ' (Copy)';
    const newDeck = await flashcardRepository.createDeck(
      userId, 
      newDeckName, 
      originalDeck.description, 
      false
    );

    await flashcardRepository.copyCards(deckId, newDeck.id);
    
    return newDeck;
  }

  async getLeaderboard(deckId: number) {
    return await flashcardRepository.getLeaderboard(deckId);
  }

  async addLeaderboardEntry(deckId: number, userId: number, timeMs: number) {
    return await flashcardRepository.addLeaderboardEntry(deckId, userId, timeMs);
  }

  async reviewFlashcard(cardId: number, userId: number, difficulty: 'easy' | 'good' | 'hard' | 'again') {
    const card = await flashcardRepository.getCardWithDeckUser(cardId, userId);
    if (!card) {
      throw new AppError('Flashcard not found or access denied', 404);
    }

    let { ease_factor, repetitions, interval_days } = card;

    if (difficulty === 'hard' || difficulty === 'again') {
      repetitions = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    } else if (difficulty === 'good') {
      repetitions += 1;
      if (repetitions === 1) interval_days = 1;
      else if (repetitions === 2) interval_days = 6;
      else interval_days = Math.round(interval_days * ease_factor);
    } else if (difficulty === 'easy') {
      repetitions += 1;
      ease_factor = ease_factor + 0.15;
      if (repetitions === 1) interval_days = 3;
      else interval_days = Math.round(interval_days * ease_factor * 1.5);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval_days);

    const updatedCard = await flashcardRepository.updateCardReview(cardId, ease_factor, repetitions, interval_days, nextReview);

    try {
      await db.query(
        `INSERT INTO learning_activities (user_id, activity_type, entity_type, entity_id, duration_seconds, details)
         VALUES ($1, 'study_flashcards', 'flashcard', $2, 30, $3)`,
        [userId, cardId, JSON.stringify({ deckId: card.deck_id, difficulty })]
      );
      await db.query(
        `INSERT INTO user_study_dates (user_id, study_date)
         VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
         ON CONFLICT (user_id, study_date) DO NOTHING`,
        [userId]
      );
    } catch (actErr) {
      console.warn('Flashcard activity log non-fatal error:', actErr);
    }
    
    const updatedStreak = await activityService.updateUserStreak(userId);
    const taskUpdate = await activityService.incrementTaskProgress(userId, 'study_flashcards', 1);

    return {
      card: updatedCard,
      next_review_days: interval_days,
      updated_streak: updatedStreak,
      task_update: taskUpdate
    };
  }
}

export const flashcardService = new FlashcardService();
