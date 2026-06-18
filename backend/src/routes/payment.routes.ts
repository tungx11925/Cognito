import { Router } from 'express';
import { downloadDocument } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Process download payment (Wallet -> Doc Owner)
router.post('/download/:documentId', authenticate, downloadDocument);

export default router;
