import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import {
  startFocusSessionSchema,
  recordDistractionEventSchema,
  finishFocusSessionSchema,
  focusPingSchema,
} from '../schemas/focus.schema';
import * as FocusController from '../controllers/focus.controller';

const router = Router();

router.use(authenticate);

router.post('/start', validate(startFocusSessionSchema), FocusController.startSession);
router.get('/active', FocusController.getActiveSession);
router.post('/:id/distraction', validate(recordDistractionEventSchema), FocusController.recordDistraction);
router.post('/:id/ping', validate(focusPingSchema), FocusController.pingActive);
router.post('/:id/finish', validate(finishFocusSessionSchema), FocusController.finishSession);
router.get('/:id/summary', FocusController.getSessionSummary);

export default router;
