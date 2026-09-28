import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { createGoalSchema, updateGoalSchema } from '../schemas/progress.schema';
import * as LearningGoalController from '../controllers/learning-goal.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createGoalSchema), LearningGoalController.createGoal);
router.get('/', LearningGoalController.listGoals);
router.put('/:id', validate(updateGoalSchema), LearningGoalController.updateGoal);
router.delete('/:id', LearningGoalController.deleteGoal);

export default router;
