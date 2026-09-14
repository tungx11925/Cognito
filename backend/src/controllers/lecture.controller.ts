import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { lectureService } from '../services/lecture.service';

export const listLectures = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const lectures = await lectureService.listLectures(userId);
    res.status(200).json(lectures);
  } catch (error) {
    next(error);
  }
};

export const getLecture = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const lecture = await lectureService.getLectureById(id);
    res.status(200).json(lecture);
  } catch (error) {
    next(error);
  }
};

export const uploadAndCreateLecture = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file tài liệu bài giảng (PDF, DOCX, TXT)' });
    }

    const userId = req.user!.id;
    const { title, subject } = req.body;

    const lecture = await lectureService.createLectureFromFile(
      userId,
      req.file.buffer,
      req.file.originalname,
      title,
      subject
    );

    res.status(201).json(lecture);
  } catch (error) {
    next(error);
  }
};

export const updateSlide = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lectureId = parseInt(req.params.id, 10);
    const slideId = parseInt(req.params.slideId, 10);
    const updated = await lectureService.updateSlide(lectureId, slideId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteLecture = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const result = await lectureService.deleteLecture(id, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
