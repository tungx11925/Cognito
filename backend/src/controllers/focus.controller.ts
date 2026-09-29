import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/auth.middleware';
import { focusService } from '../services/focus.service';

export const startSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { target_duration_seconds, document_id, quiz_id, learning_goal_id } = req.body;

    const session = await focusService.startSession(userId, {
      targetDurationSeconds: target_duration_seconds,
      documentId: document_id,
      quizId: quiz_id,
      learningGoalId: learning_goal_id,
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

export const recordDistraction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id, 10);
    const { event_type, duration_seconds, details } = req.body;

    const result = await focusService.recordDistraction(userId, sessionId, {
      eventType: event_type,
      durationSeconds: duration_seconds,
      details,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const pingActive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id, 10);
    const { seconds } = req.body;

    const result = await focusService.pingActive(userId, sessionId, seconds);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const finishSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id, 10);
    const { status, actual_duration_seconds } = req.body;

    const result = await focusService.finishSession(userId, sessionId, {
      status,
      actualDurationSeconds: actual_duration_seconds,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getActiveSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const active = await focusService.getActiveSession(userId);

    res.status(200).json({ activeSession: active });
  } catch (error) {
    next(error);
  }
};

export const getSessionSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id, 10);

    const summary = await focusService.getSessionSummary(userId, sessionId);

    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export const interruptSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let userId = req.user?.id;
    // Hỗ trợ token từ query string hoặc body (dành cho navigator.sendBeacon)
    if (!userId) {
      const token = (req.query.token as string) || req.body?.token;
      if (token) {
        try {
          const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
          const decoded: any = jwt.verify(token, jwtSecret);
          userId = decoded.userId || decoded.id;
        } catch {
          // Token không hợp lệ
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Chưa xác thực danh tính' });
    }

    const sessionId = parseInt(req.params.id, 10);
    const actualDurationSeconds = req.body?.actual_duration_seconds;

    const result = await focusService.interruptSession(sessionId, userId, actualDurationSeconds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
