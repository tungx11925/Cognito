import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middlewares/auth.middleware';
import { examImportController } from '../controllers/exam-import.controller';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads/exams');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `exam-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.docx', '.doc', '.pdf', '.xlsx', '.xls', '.csv', '.txt', '.md'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng file ${ext} không được hỗ trợ. Chỉ hỗ trợ .docx, .pdf, .xlsx, .txt`));
    }
  },
});

// Parse đề thi (Preview, không lưu DB)
router.post('/exams/parse', authenticate, upload.single('file'), (req, res, next) => {
  examImportController.parseExam(req as any, res).catch(next);
});

// Import đề thi đã preview/sửa vào DB (test_sets + questions)
router.post('/exams/import', authenticate, (req, res, next) => {
  examImportController.importExam(req as any, res).catch(next);
});

export default router;
