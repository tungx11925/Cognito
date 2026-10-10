import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createNoteSchema, updateNoteSchema, getNotesQuerySchema } from '../schemas/note.schema';
import * as NoteController from '../controllers/note.controller';

const router = Router();

router.use(authenticate);

// List & search notes
router.get('/', validate(getNotesQuerySchema), NoteController.getUserNotes);

// Create note (standalone or attached to document)
router.post('/', validate(createNoteSchema), NoteController.createNote);

// Backward compatibility: get notes by document
router.get('/document/:docId', NoteController.getNotesByDocument);

// Single note operations (with IDOR protection)
router.get('/:id', NoteController.getNoteById);
router.put('/:id', validate(updateNoteSchema), NoteController.updateNote);
router.delete('/:id', NoteController.deleteNote);

export default router;
