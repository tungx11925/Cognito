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
    const sessionId = parseInt(req.params.id, 10);
    const actualDurationSeconds = req.body?.actual_duration_seconds;
    const interruptToken = req.body?.interrupt_token;

    let userId = req.user?.id;

    // Kiểm tra Authorization header nếu chưa qua middleware authenticate
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'your_secret_key';
        const decoded: any = jwt.verify(token, jwtSecret);
        userId = decoded.userId || decoded.id;
      } catch {
        // Token không hợp lệ
      }
    }

    if (!userId && !interruptToken) {
      return res.status(401).json({ error: 'Chưa xác thực danh tính (yêu cầu JWT hoặc interrupt_token trong body)' });
    }

    const result = await focusService.interruptSession(
      sessionId,
      { userId, interruptToken },
      actualDurationSeconds
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
