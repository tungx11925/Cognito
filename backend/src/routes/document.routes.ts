import { Router } from 'express';
import { 
  uploadDocument, 
  getDocuments, 
  getDocumentById, 
  getDocumentStatus, 
  getDocumentChunks,
  reprocessDocument, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { uploadDocumentSchema, getDocumentsSchema, getDocumentByIdSchema, getDocumentStatusSchema, createDocumentSchema, updateDocumentSchema } from '../schemas/document.schema';
import multer from 'multer';

const router = Router();

// Use memory storage — file goes to buffer, then streamed to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), TXT hoặc ảnh (PNG/JPG)'));
    }
  }
});

router.use(authenticate);

router.post('/upload', upload.single('file'), validate(uploadDocumentSchema), uploadDocument);
router.post('/', validate(createDocumentSchema), createDocument);
router.get('/', validate(getDocumentsSchema), getDocuments);
router.get('/:id/status', validate(getDocumentStatusSchema), getDocumentStatus);
router.get('/:id/chunks', validate(getDocumentStatusSchema), getDocumentChunks);
router.get('/:id', validate(getDocumentByIdSchema), getDocumentById);
router.post('/:id/reprocess', validate(getDocumentStatusSchema), reprocessDocument);
router.put('/:id', validate(updateDocumentSchema), updateDocument);
router.delete('/:id', deleteDocument);

export default router;

