import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { noteService } from '../services/note.service';

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { title, content, document_id } = req.body;
    const note = await noteService.createNote(userId, { title, content, document_id });
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

export const getUserNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { q, document_id } = req.query as { q?: string; document_id?: string };
    const docId = document_id ? parseInt(document_id, 10) : undefined;
    const notes = await noteService.getUserNotes(userId, { q, documentId: docId });
    res.status(200).json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

export const getNotesByDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const docId = parseInt(req.params.docId, 10);
    const notes = await noteService.getNotesByDocument(userId, docId);
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const noteId = parseInt(req.params.id, 10);
    const note = await noteService.getNoteById(noteId, userId);
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const noteId = parseInt(req.params.id, 10);
    const { title, content, document_id } = req.body;
    const updated = await noteService.updateNote(noteId, userId, { title, content, document_id });
    res.status(200).json({ success: true, note: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const noteId = parseInt(req.params.id, 10);
    const result = await noteService.deleteNote(noteId, userId);
    res.status(200).json({ message: 'Đã xóa ghi chú thành công', ...result });
  } catch (error) {
    next(error);
  }
};
