import { Router } from 'express';
import { uploadDocument, getDocuments, getDocumentById, createDocument, updateDocument, deleteDocument } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { uploadDocumentSchema, getDocumentsSchema, getDocumentByIdSchema, createDocumentSchema, updateDocumentSchema } from '../schemas/document.schema';
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

router.post('/upload', upload.single('file'), validate(uploadDocumentSchema), uploadDocument);
router.post('/', validate(createDocumentSchema), createDocument);
router.get('/', validate(getDocumentsSchema), getDocuments);
router.get('/:id', validate(getDocumentByIdSchema), getDocumentById);
router.put('/:id', validate(updateDocumentSchema), updateDocument);
router.delete('/:id', deleteDocument);

export default router;
