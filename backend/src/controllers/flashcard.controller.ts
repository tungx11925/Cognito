import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { flashcardService } from '../services/flashcard.service';

export const getDecks = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const decks = await flashcardService.getDecks(userId);
    res.status(200).json(decks);
  } catch (error) {
    next(error);
  }
};

export const getDeckById = async (req: Request, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.id, 10);
    const deck = await flashcardService.getDeckById(deckId);
    res.status(200).json(deck);
  } catch (error) {
    next(error);
  }
};

export const getDeckCards = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const cards = await flashcardService.getDeckCards(deckId, userId);
    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
};

export const getDueCards = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const cards = await flashcardService.getDueCards(deckId, userId);
    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
};

export const createDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const { name, description, is_public } = req.body;
    const deck = await flashcardService.createDeck(userId, name, description, is_public);
    res.status(201).json(deck);
  } catch (error) {
    next(error);
  }
};

export const updateDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    // Requires authenticate to be safe
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { name, description, is_public } = req.body;

    // Verify ownership
    const existing = await flashcardService.getDeckById(deckId);
    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bộ thẻ này' });
    }

    const deck = await flashcardService.updateDeck(deckId, name, description, is_public);
    res.status(200).json(deck);
  } catch (error) {
    next(error);
  }
};

export const deleteDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    // Requires authenticate to be safe
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    // Verify ownership
    const existing = await flashcardService.getDeckById(deckId);
    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bộ thẻ này' });
    }

    await flashcardService.deleteDeck(deckId);
    res.status(200).json({ message: 'Đã xóa bộ bài thành công' });
  } catch (error) {
    next(error);
  }
};

export const createFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const { deck_id, document_id, front, back } = req.body;
    const card = await flashcardService.createFlashcard(userId, deck_id, document_id, front, back);
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
};

export const updateFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { front, back } = req.body;

    const updated = await flashcardService.updateFlashcard(cardId, userId, front, back);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    await flashcardService.deleteFlashcard(cardId, userId);
    res.status(200).json({ message: 'Đã xóa thẻ thành công' });
  } catch (error) {
    next(error);
  }
};

export const starFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { is_starred } = req.body;
    const updated = await flashcardService.starFlashcard(cardId, userId, is_starred);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const getCommunityDecks = async (req: Request, res: Response, next: any) => {
  try {
    const decks = await flashcardService.getCommunityDecks();
    res.status(200).json(decks);
  } catch (error) {
    next(error);
  }
};

export const forkDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const deck = await flashcardService.forkDeck(deckId, userId);
    res.status(201).json(deck);
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req: Request, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const leaderboard = await flashcardService.getLeaderboard(deckId);
    res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
};

export const addLeaderboardEntry = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const { time_ms } = req.body;
    const entry = await flashcardService.addLeaderboardEntry(deckId, userId, time_ms);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

export const reviewFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { difficulty } = req.body;
    const result = await flashcardService.reviewFlashcard(cardId, userId, difficulty);
    res.status(200).json({
      message: 'Flashcard reviewed successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};
