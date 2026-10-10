import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import flashcardRoutes from './routes/flashcard.routes';
import activityRoutes from './routes/activity.routes';
import shareRoutes from './routes/share.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';
import adminRoutes from './routes/admin.routes';
import studyRoutes from './routes/study.routes';
import aiTestRoutes from './routes/ai-test.routes';
import questionGenerationRoutes from './routes/question-generation.routes';
import examImportRoutes from './routes/exam-import.routes';
import lectureRoutes from './routes/lecture.routes';
import quizRoutes from './routes/quiz.routes';
import noteRoutes from './routes/note.routes';
import mindmapRoutes from './routes/mindmap.routes';
import learningActivityRoutes from './routes/learning-activity.routes';
import learningGoalRoutes from './routes/learning-goal.routes';
import progressRoutes from './routes/progress.routes';
import focusRoutes from './routes/focus.routes';
import communityRoutes from './routes/community.routes';
import { userSafetyRouter, adminModerationRouter } from './routes/safety.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import searchRoutes from './routes/search.routes';
import { bootstrapAITestSchema } from './db/ai-test-schema';
import { bootstrapLectureSchema } from './db/lecture-schema';
import helmet from 'helmet';
import path from 'path';

// Validate essential environment variables before starting (Spec 3.7)
if (process.env.JWT_SECRET && !process.env.JWT_SECRET_KEY) {
  process.env.JWT_SECRET_KEY = process.env.JWT_SECRET;
}
const requiredEnvVars = ['JWT_SECRET_KEY', 'DATABASE_URL'];
const missingEnvs = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error(`🔴 CRITICAL ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  console.error('The server cannot start safely without these variables configured.');
  process.exit(1);
}

const app = express();
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 1);
app.set('trust proxy', trustProxyHops);

// HTTP Security Headers (Protection against MIME-sniffing, Clickjacking, XSS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://accounts.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://lh3.googleusercontent.com',
      ],
      connectSrc: [
        "'self'",
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'https://accounts.google.com',
        'https://api-merchant.payos.vn',
        'https://res.cloudinary.com',
      ],
      frameSrc: ["'self'", 'https://accounts.google.com', 'https://pay.payos.vn'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));
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
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminModerationRouter);
app.use('/api/lectures', lectureRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/mindmaps', mindmapRoutes);
app.use('/api/learning-activities', learningActivityRoutes);
app.use('/api/learning-goals', learningGoalRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/community', userSafetyRouter);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', activityRoutes);
app.use('/api', studyRoutes);
app.use('/api', aiTestRoutes);
app.use('/api', questionGenerationRoutes);
app.use('/api', examImportRoutes);
app.use('/api', quizRoutes);

// Tạo các bảng phục vụ tính năng "Bài tập AI" và "Bài giảng Giảng viên (Lecture Slides)"
bootstrapAITestSchema().catch(err => console.error('AI test schema bootstrap failed:', err));
bootstrapLectureSchema().catch(err => console.error('Lecture schema bootstrap failed:', err));

import { errorHandler } from './middlewares/errorHandler';

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler
app.use(errorHandler);

export default app;
