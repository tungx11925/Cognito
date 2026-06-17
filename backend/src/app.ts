import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import appRoutes from './routes/app.routes';
import documentRoutes from './routes/document.routes';
import path from 'path';

const app = express();
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
app.use('/api', appRoutes);

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler for returning JSON instead of HTML (e.g. from Multer)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Lỗi hệ thống máy chủ' });
});

export default app;
