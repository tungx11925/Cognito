import { Router } from 'express';
import { register, login, getMe, logout, checkAvailability } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/check-availability', checkAvailability);
router.get('/me', authenticate, getMe);

export default router;
