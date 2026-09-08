import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { studyService } from '../services/study.service';
import { activityService } from '../services/activity.service';

export const getStudyStats = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const stats = await studyService.getStats(userId);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const activePing = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { seconds } = req.body;
    const userId = req.user!.id;
    
    if (!seconds || typeof seconds !== 'number' || seconds <= 0) {
      return res.status(400).json({ error: 'Số giây không hợp lệ' });
    }

    const activeSeconds = await studyService.activePing(userId, seconds);
    const taskResult = await activityService.incrementTaskProgress(userId, 'study_time', seconds);

    res.status(200).json({ active_seconds: activeSeconds, task_update: taskResult });
  } catch (error) {
    next(error);
  }
};

export const createStudySession = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { document_id, duration_seconds } = req.body;
    const userId = req.user!.id;
    const session = await studyService.createStudySession(userId, document_id, duration_seconds);
    const updatedStreak = await activityService.updateUserStreak(userId);
    res.status(201).json({ ...session, updated_streak: updatedStreak });
  } catch (error) {
    next(error);
  }
};

export const getNotesByDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const docId = parseInt(req.params.docId, 10);
    const userId = req.user!.id;
    const notes = await studyService.getNotesByDocument(userId, docId);
    if (!notes) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const upsertNote = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { document_id, title, content } = req.body;
    const userId = req.user!.id;
    const note = await studyService.upsertNote(userId, document_id, title, content);
    res.status(201).json(note);
  } catch (error: any) {
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    next(error);
  }
};
