import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  createDeckSchema, updateDeckSchema, createFlashcardSchema,
  updateFlashcardSchema, starFlashcardSchema, reviewFlashcardSchema,
  matchLeaderboardSchema
} from '../schemas/flashcard.schema';
import * as FlashcardController from '../controllers/flashcard.controller';

const router = Router();

// Community decks (public)
router.get('/community/decks', FlashcardController.getCommunityDecks);
router.get('/decks/:deckId/match-leaderboard', FlashcardController.getLeaderboard);

// Protected routes
router.use(authenticate);

// Decks
router.get('/decks', FlashcardController.getDecks);
router.post('/decks', validate(createDeckSchema), FlashcardController.createDeck);
router.get('/decks/:id', FlashcardController.getDeckById);
router.put('/decks/:id', validate(updateDeckSchema), FlashcardController.updateDeck);
router.delete('/decks/:id', FlashcardController.deleteDeck);

// Deck Cards
router.get('/decks/:deckId/cards', FlashcardController.getDeckCards);
router.get('/decks/:deckId/review', FlashcardController.getDueCards);
router.post('/decks/:deckId/fork', FlashcardController.forkDeck);
router.post('/decks/:deckId/match-leaderboard', validate(matchLeaderboardSchema), FlashcardController.addLeaderboardEntry);

// Flashcards
router.post('/', validate(createFlashcardSchema), FlashcardController.createFlashcard);
router.put('/:id', validate(updateFlashcardSchema), FlashcardController.updateFlashcard);
router.delete('/:id', FlashcardController.deleteFlashcard);
router.put('/:id/star', validate(starFlashcardSchema), FlashcardController.starFlashcard);
router.post('/review/:id', validate(reviewFlashcardSchema), FlashcardController.reviewFlashcard);

export default router;
