import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import appRoutes from './routes/app.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api', appRoutes);

export default app;
