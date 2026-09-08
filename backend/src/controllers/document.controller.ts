import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { documentService } from '../services/document.service';

export const uploadDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn file hợp lệ (PDF, DOC, DOCX)' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { title, description, category } = req.body;

    const docUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

    const document = await documentService.uploadDocument({
      userId,
      title,
      description,
      category,
      docUrl
    });

    res.status(201).json({
      message: 'Tải lên tài liệu thành công',
      document
    });
  } catch (error: any) {
    next(error);
  }
};

export const getDocuments = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const { search, category } = req.query;
    
    const documents = await documentService.getDocuments(
      userId, 
      search as string, 
      category as string
    );

    res.status(200).json(documents);
  } catch (error: any) {
    next(error);
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const docId = parseInt(req.params.id, 10);

    const document = await documentService.getDocumentById(docId, userId);

    res.status(200).json(document);
  } catch (error: any) {
    next(error);
  }
};

export const createDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const document = await documentService.createDocument({
      userId,
      ...req.body
    });

    res.status(201).json(document);
  } catch (error: any) {
    next(error);
  }
};

export const updateDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    const { title, description, category } = req.body;

    const document = await documentService.updateDocument(docId, userId, { title, description, category });
    res.status(200).json(document);
  } catch (error: any) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Vui lòng đăng nhập' });

    const docId = parseInt(req.params.id, 10);
    await documentService.deleteDocument(docId, userId);
    
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    next(error);
  }
};
