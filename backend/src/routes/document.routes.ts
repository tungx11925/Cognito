import { Router } from 'express';
import { uploadDocument, getDocuments, getDocumentById } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF hoặc Word (DOC/DOCX)'));
    }
  }
});

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);

export default router;
