import { Router } from 'express';
import { 
  register, 
  login, 
  googleLogin, 
  getMe, 
  logout, 
  checkAvailability, 
  updateAvatar, 
  updateProfile,
  toggleVerification,
  verify2FA,
  changePassword
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for local storage of image uploads before sending to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận các loại file ảnh (JPEG, PNG, WEBP, GIF)'));
    }
  }
});

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.post('/check-availability', checkAvailability);
router.get('/me', authenticate, getMe);
router.post('/avatar', authenticate, upload.single('avatar'), updateAvatar);
router.put('/profile', authenticate, updateProfile);
router.post('/toggle-verification', authenticate, toggleVerification);
router.post('/verify-2fa', verify2FA);
router.put('/change-password', authenticate, changePassword);

export default router;
