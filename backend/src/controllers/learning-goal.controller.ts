import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { learningGoalService } from '../services/learning-goal.service';

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, subject, target_type, target_value, period } = req.body;

    const goal = await learningGoalService.createGoal(userId, {
      title,
      subject,
      targetType: target_type,
      targetValue: target_value,
      period,
    });

    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const listGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const goals = await learningGoalService.listGoals(userId);
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(req.params.id, 10);
    const { title, subject, target_type, target_value, period, is_active } = req.body;

    const updated = await learningGoalService.updateGoal(userId, goalId, {
      title,
      subject,
      targetType: target_type,
      targetValue: target_value,
      period,
      isActive: is_active,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const goalId = parseInt(req.params.id, 10);

    const result = await learningGoalService.deleteGoal(userId, goalId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
