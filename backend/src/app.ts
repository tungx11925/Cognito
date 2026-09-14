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
import aiTestRoutes from './routes/ai-test.routes';
import lectureRoutes from './routes/lecture.routes';
import { bootstrapAITestSchema } from './db/ai-test-schema';
import { bootstrapLectureSchema } from './db/lecture-schema';
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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
app.use('/api/lectures', lectureRoutes);
app.use('/api', activityRoutes);
app.use('/api', studyRoutes);
app.use('/api', aiTestRoutes);

// Tạo các bảng phục vụ tính năng "Bài tập AI" và "Bài giảng Giảng viên (Lecture Slides)"
bootstrapAITestSchema().catch(err => console.error('AI test schema bootstrap failed:', err));
bootstrapLectureSchema().catch(err => console.error('Lecture schema bootstrap failed:', err));

import { errorHandler } from './middlewares/errorHandler';

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler
app.use(errorHandler);

export default app;
