import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import {
  createDeckSchema, updateDeckSchema, createFlashcardSchema,
  updateFlashcardSchema, starFlashcardSchema, reviewFlashcardSchema,
  matchLeaderboardSchema, studySettingsSchema
} from '../schemas/flashcard.schema';
import * as FlashcardController from '../controllers/flashcard.controller';
import multer from 'multer';

const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadImageMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

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

// Deck Study Settings
router.get('/decks/:deckId/settings', FlashcardController.getStudySettings);
router.put('/decks/:deckId/settings', validate(studySettingsSchema), FlashcardController.saveStudySettings);

// Deck Cards
router.get('/decks/:deckId/cards', FlashcardController.getDeckCards);
router.get('/decks/:deckId/review', FlashcardController.getDueCards);
router.post('/decks/:deckId/fork', FlashcardController.forkDeck);
router.post('/decks/:deckId/match-leaderboard', validate(matchLeaderboardSchema), FlashcardController.addLeaderboardEntry);

// Flashcards & Images
router.post('/upload-image', uploadImageMem.single('image'), FlashcardController.uploadFlashcardImage);
router.post('/', validate(createFlashcardSchema), FlashcardController.createFlashcard);
router.put('/:id', validate(updateFlashcardSchema), FlashcardController.updateFlashcard);
router.delete('/:id', FlashcardController.deleteFlashcard);
router.put('/:id/star', validate(starFlashcardSchema), FlashcardController.starFlashcard);
router.post('/review/:id', validate(reviewFlashcardSchema), FlashcardController.reviewFlashcard);


// AI Flashcard Generation from Document
router.post('/generate-from-file', rateLimiter(60 * 1000, 15), uploadMem.single('document'), FlashcardController.generateFlashcardsFromFile);

export default router;
