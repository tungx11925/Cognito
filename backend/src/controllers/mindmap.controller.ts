import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { mindmapService } from '../services/mindmap.service';

export const createMindmap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, mermaid_code, document_id } = req.body;
    const mindmap = await mindmapService.createMindmap(userId, { title, mermaid_code, document_id });
    res.status(201).json({ success: true, mindmap });
  } catch (error) {
    next(error);
  }
};

export const getUserMindmaps = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { q, document_id } = req.query as { q?: string; document_id?: string };
    const docId = document_id ? parseInt(document_id, 10) : undefined;
    const mindmaps = await mindmapService.getUserMindmaps(userId, { q, documentId: docId });
    res.status(200).json({ success: true, mindmaps });
  } catch (error) {
    next(error);
  }
};

export const getMindmapsByDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const docId = parseInt(req.params.docId, 10);
    const mindmaps = await mindmapService.getMindmapsByDocument(userId, docId);
    res.status(200).json(mindmaps);
  } catch (error) {
    next(error);
  }
};

export const getMindmapById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const mindmapId = parseInt(req.params.id, 10);
    const mindmap = await mindmapService.getMindmapById(mindmapId, userId);
    res.status(200).json({ success: true, mindmap });
  } catch (error) {
    next(error);
  }
};

export const updateMindmap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const mindmapId = parseInt(req.params.id, 10);
    const { title, mermaid_code, document_id } = req.body;
    const updated = await mindmapService.updateMindmap(mindmapId, userId, { title, mermaid_code, document_id });
    res.status(200).json({ success: true, mindmap: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteMindmap = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const mindmapId = parseInt(req.params.id, 10);
    const result = await mindmapService.deleteMindmap(mindmapId, userId);
    res.status(200).json({ message: 'Đã xóa sơ đồ tư duy thành công', ...result });
  } catch (error) {
    next(error);
  }
};
