import { Router } from 'express';
import { uploadDocument, getDocuments, getDocumentById, deleteDocument } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';

const router = Router();

// Use memory storage — file goes to buffer, then streamed to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, Word (DOC/DOCX), TXT hoặc ảnh (PNG/JPG)'));
    }
  }
});

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;
