import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { assignmentAttemptService } from '../services/assignment-attempt.service';
import { db } from '../db';

export const startAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentAttemptService.startAttempt(req.params.assignmentId, req.user!.id);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    const data = await assignmentAttemptService.submitAttempt(req.params.attemptId, req.user!.id, answers);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const saveAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    const data = await assignmentAttemptService.saveAnswersOnly(req.params.attemptId, req.user!.id, answers);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getStudentAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const data = await db.query(
      `SELECT * FROM assignment_attempts WHERE assignment_id = $1 AND student_id = $2 ORDER BY start_time DESC`,
      [req.params.assignmentId, req.user!.id]
    );
    res.json(data.rows);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
