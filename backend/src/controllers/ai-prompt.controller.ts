import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { aiPromptService } from '../services/ai-prompt.service';

export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const templates = await aiPromptService.getTemplates(userId);
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, prompt_text, category } = req.body;
    const created = await aiPromptService.createTemplate(userId, title, prompt_text, category);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const templateId = parseInt(req.params.id, 10);
    const { title, prompt_text, category } = req.body;
    const updated = await aiPromptService.updateTemplate(templateId, userId, title, prompt_text, category);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const templateId = parseInt(req.params.id, 10);
    await aiPromptService.deleteTemplate(templateId, userId);
    res.status(200).json({ message: 'Đã xóa mẫu prompt thành công' });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.query.document_id ? parseInt(req.query.document_id as string, 10) : undefined;
    const history = await aiPromptService.getHistory(userId, documentId);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

export const addHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { document_id, prompt_text, context_mode, scope, is_pinned } = req.body;
    const item = await aiPromptService.addHistory(
      userId,
      document_id || null,
      prompt_text,
      context_mode,
      scope,
      is_pinned
    );
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

export const togglePinHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const historyId = parseInt(req.params.id, 10);
    const updated = await aiPromptService.togglePinHistory(historyId, userId);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const historyId = parseInt(req.params.id, 10);
    await aiPromptService.deleteHistory(historyId, userId);
    res.status(200).json({ message: 'Đã xóa prompt khỏi lịch sử' });
  } catch (error) {
    next(error);
  }
};
