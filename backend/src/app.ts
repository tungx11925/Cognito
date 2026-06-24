import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import appRoutes from './routes/app.routes';
import documentRoutes from './routes/document.routes';
import shareRoutes from './routes/share.routes';
import paymentRoutes from './routes/payment.routes';
import aiRoutes from './routes/ai.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import adminRoutes from './routes/admin.routes';
import aiTestRoutes from './routes/ai-test.routes';
import { bootstrapAITestSchema } from './db/ai-test-schema';
import path from 'path';

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
app.use('/api/shares', shareRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', aiTestRoutes);
app.use('/api/ai', aiTestRoutes);
app.use('/api', appRoutes);

// Run AI test schema migration on startup
bootstrapAITestSchema();

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler for returning JSON instead of HTML (e.g. from Multer)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Lỗi hệ thống máy chủ' });
});

export default app;
