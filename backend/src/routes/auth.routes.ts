import { Router } from 'express';
import { register, login, googleLogin, getUsers } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/users', getUsers);

export default router;

