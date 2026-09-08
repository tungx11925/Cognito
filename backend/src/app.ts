import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import flashcardRoutes from './routes/flashcard.routes';
import activityRoutes from './routes/activity.routes';
import shareRoutes from './routes/share.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import adminRoutes from './routes/admin.routes';
import studyRoutes from './routes/study.routes';
import path from 'path';

// Validate essential environment variables before starting
const requiredEnvVars = ['JWT_SECRET_KEY', 'DATABASE_URL'];
const missingEnvs = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error(`🔴 CRITICAL ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  console.error('The server cannot start safely without these variables configured.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', true);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, origin);
  },
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', activityRoutes);
app.use('/api', studyRoutes);

import { errorHandler } from './middlewares/errorHandler';

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler
app.use(errorHandler);

export default app;
