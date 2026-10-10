import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { progressService } from '../services/progress.service';
import { streakService } from '../services/streak.service';

export const getProgressSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const summary = await progressService.getProgressSummary(userId);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export const getStreak = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const streak = await streakService.calculateUserStreak(userId);
    res.status(200).json(streak);
  } catch (error) {
    next(error);
  }
};
