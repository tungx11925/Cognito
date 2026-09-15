import { Router } from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import * as LectureController from '../controllers/lecture.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

router.get('/', optionalAuth, LectureController.listLectures);
router.get('/:id', optionalAuth, LectureController.getLecture);
router.post('/upload', optionalAuth, upload.single('file'), LectureController.uploadAndCreateLecture);
router.post('/:id/ai-assist', optionalAuth, LectureController.aiAssistSlide);
router.put('/:id/slides/:slideId', optionalAuth, LectureController.updateSlide);
router.delete('/:id', optionalAuth, LectureController.deleteLecture);

export default router;

