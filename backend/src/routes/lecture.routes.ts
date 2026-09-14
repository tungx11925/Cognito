import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import * as LectureController from '../controllers/lecture.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// All lecture routes require authentication
router.use(authenticate);

router.get('/', LectureController.listLectures);
router.get('/:id', LectureController.getLecture);
router.post('/upload', upload.single('file'), LectureController.uploadAndCreateLecture);
router.put('/:id/slides/:slideId', LectureController.updateSlide);
router.delete('/:id', LectureController.deleteLecture);

export default router;
