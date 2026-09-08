import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { activityService } from '../services/activity.service';
import { profileService } from '../services/profile.service';

export const getTasks = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const tasks = await activityService.getOrCreateDailyTasks(userId);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const updateTaskProgress = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { task_type, increment } = req.body;
    const userId = req.user!.id;
    
    const result = await activityService.incrementTaskProgress(userId, task_type, increment || 1);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const friends = await profileService.getFriends(userId);
    res.status(200).json(friends);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const viewerId = req.user!.id;
    const targetUserId = parseInt(req.params.targetUserId, 10);
    
    const profile = await profileService.getTargetUserProfile(viewerId, targetUserId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};
