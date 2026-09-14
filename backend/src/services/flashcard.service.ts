import { flashcardRepository } from '../repositories/flashcard.repository';
import { AppError } from '../utils/AppError';
import { activityService } from './activity.service';

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

  async getDeckCards(deckId: number, userId: number) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck || deck.user_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại', 403);
    }
    return await flashcardRepository.getDeckCards(deckId);
  }

  async getDueCards(deckId: number, userId: number) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck || deck.user_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại', 403);
    }
    return await flashcardRepository.getDueCards(deckId);
  }

  async createDeck(userId: number, name: string, description?: string, isPublic?: boolean) {
    return await flashcardRepository.createDeck(userId, name, description || '', isPublic || false);
  }

  async updateDeck(deckId: number, name?: string, description?: string, isPublic?: boolean) {
    const currentDeck = await this.getDeckById(deckId);
    const newName = name !== undefined ? name : currentDeck.name;
    const newDesc = description !== undefined ? description : currentDeck.description;
    const newIsPublic = isPublic !== undefined ? isPublic : currentDeck.is_public;
    
    return await flashcardRepository.updateDeck(deckId, newName, newDesc, newIsPublic);
  }

  async deleteDeck(deckId: number) {
    const deleted = await flashcardRepository.deleteDeck(deckId);
    if (!deleted) {
      throw new AppError('Không tìm thấy bộ bài để xóa', 404);
    }
    return deleted;
  }

  async createFlashcard(userId: number, deckId: number, documentId: number | null, front: string, back: string) {
    const deck = await flashcardRepository.getDeckById(deckId);
    if (!deck || deck.user_id !== userId) {
      throw new AppError('Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại', 403);
    }
    return await flashcardRepository.createFlashcard(deckId, documentId, front, back);
  }

  async updateFlashcard(cardId: number, userId: number, front: string, back: string) {
    const card = await flashcardRepository.getCardWithDeckUser(cardId, userId);
    if (!card) {
      throw new AppError('Flashcard không tồn tại hoặc không có quyền', 404);
    }
    const updated = await flashcardRepository.updateFlashcard(cardId, front, back);
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
      const hasPurchased = await flashcardRepository.checkPurchase(userId, deckId);
      if (hasPurchased) isAuthorized = true;
    }

    if (!isAuthorized) {
      throw new AppError('Bạn cần mở khóa bộ thẻ này trên chợ cộng đồng trước khi sao chép', 403);
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

  async reviewFlashcard(cardId: number, userId: number, difficulty: 'easy' | 'good' | 'hard') {
    const card = await flashcardRepository.getCardWithDeckUser(cardId, userId);
    if (!card) {
      throw new AppError('Flashcard not found or access denied', 404);
    }

    let { ease_factor, repetitions, interval_days } = card;

    if (difficulty === 'hard') {
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
