import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { activePingSchema, createStudySessionSchema, upsertNoteSchema, getNotesByDocumentSchema } from '../schemas/study.schema';
import * as StudyController from '../controllers/study.controller';

const router = Router();

router.use(authenticate);

router.get('/study-sessions/stats', StudyController.getStudyStats);
router.post('/study-sessions/active-ping', validate(activePingSchema), StudyController.activePing);
router.post('/study-sessions', validate(createStudySessionSchema), StudyController.createStudySession);

router.get('/notes/document/:docId', validate(getNotesByDocumentSchema), StudyController.getNotesByDocument);
router.post('/notes', validate(upsertNoteSchema), StudyController.upsertNote);

export default router;
