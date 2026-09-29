import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { activePingSchema, createStudySessionSchema, upsertNoteSchema, getNotesByDocumentSchema } from '../schemas/study.schema';
import * as StudyController from '../controllers/study.controller';

const router = Router();

router.get('/study-sessions/stats', authenticate, StudyController.getStudyStats);
router.post('/study-sessions/active-ping', authenticate, validate(activePingSchema), StudyController.activePing);
router.post('/study-sessions', authenticate, validate(createStudySessionSchema), StudyController.createStudySession);

export default router;
