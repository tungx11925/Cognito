import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { learningActivityService } from '../services/learning-activity.service';

export const logActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const {
      activity_type,
      entity_type,
      entity_id,
      duration_seconds,
      subject,
      details,
      idempotency_key,
    } = req.body;

    const result = await learningActivityService.logActivity(userId, {
      activityType: activity_type,
      entityType: entity_type,
      entityId: entity_id,
      durationSeconds: duration_seconds,
      subject,
      details,
      idempotencyKey: idempotency_key,
    });

    res.status(result.isNew ? 201 : 200).json(result);
  } catch (error) {
    next(error);
  }
};

export const listActivities = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit, offset, activity_type, subject } = req.query;

    const result = await learningActivityService.listActivities(userId, {
      limit: limit ? parseInt(limit as string, 10) : 20,
      offset: offset ? parseInt(offset as string, 10) : 0,
      activityType: activity_type as string,
      subject: subject as string,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
