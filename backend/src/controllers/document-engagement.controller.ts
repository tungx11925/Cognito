import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { documentEngagementService } from '../services/document-engagement.service';

export const toggleLikeDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const documentId = parseInt(req.params.id, 10);
    const result = await documentEngagementService.toggleLike(userId, documentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const toggleSaveDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const documentId = parseInt(req.params.id, 10);
    const result = await documentEngagementService.toggleSave(userId, documentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDocumentEngagement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || null;
    const documentId = parseInt(req.params.id, 10);
    const result = await documentEngagementService.getEngagement(userId, documentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserSavedDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const { search, category, page, limit } = req.query;
    const result = await documentEngagementService.getUserSavedDocuments(userId, {
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserLikedDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const { search, category, page, limit } = req.query;
    const result = await documentEngagementService.getUserLikedDocuments(userId, {
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
