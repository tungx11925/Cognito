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
  changePassword,
  upgradePremium,
  forgotPassword,
  resetPassword,
  refresh
} from '../controllers/auth.controller';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';
import path from 'path';

import { generateSafeFileName } from '../utils/file-security';

const router = Router();

const allowedAvatarExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Configure multer for local storage of image uploads before sending to Cloudinary
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    try {
      const safeName = generateSafeFileName('avatar', file.originalname, allowedAvatarExts);
      cb(null, safeName);
    } catch (err: any) {
      cb(err, '');
    }
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

import { authRateLimiter } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate';
import { rateLimiter } from '../middlewares/rateLimiter.middleware';
import { 
  registerSchema, 
  loginSchema, 
  googleLoginSchema, 
  checkAvailabilitySchema, 
  updateProfileSchema, 
  toggleVerificationSchema, 
  verify2FASchema, 
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../schemas/auth.schema';

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/google', authRateLimiter, validate(googleLoginSchema), googleLogin);
router.post('/logout', logout);
router.post('/refresh', rateLimiter(60 * 1000, 120), refresh);
router.post('/check-availability', validate(checkAvailabilitySchema), checkAvailability);
router.get('/me', authenticate, rateLimiter(60 * 1000, 300), getMe);
router.post('/avatar', authenticate, upload.single('avatar'), updateAvatar);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/toggle-verification', authenticate, validate(toggleVerificationSchema), toggleVerification);
router.post('/verify-2fa', authRateLimiter, validate(verify2FASchema), verify2FA);
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/upgrade-premium', authenticate, upgradePremium);
router.post('/forgot-password', rateLimiter(15 * 60 * 1000, 10), validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', rateLimiter(15 * 60 * 1000, 15), validate(resetPasswordSchema), resetPassword);

// Security Probe Endpoints (for auditing rate limiter functionality cleanly)
router.get('/security/rate-limit-probe', rateLimiter(10000, 5), (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});
router.get('/security/rate-limit-auth-probe', authenticate, rateLimiter(10000, 5), (req: AuthRequest, res) => {
  res.json({ ok: true, userId: req.user!.id, timestamp: Date.now() });
});

export default router;
