import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { signToken, verifyToken } from '../utils/jwt';
import { userRepository } from '../repositories/user.repository';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import { streakService } from './streak.service';
import { db } from '../db';

export class AuthService {
  async getUserStudyDates(userId: number): Promise<string[]> {
    try {
      const streakInfo = await streakService.calculateUserStreak(userId);
      return streakInfo.studyDates;
    } catch (err) {
      console.error('Error in getUserStudyDates:', err);
      return [];
    }
  }

  async register(data: any) {
    const { name, phone, email, password } = data;

    const formattedEmail = email ? email.toLowerCase().trim() : '';

    const existingName = await userRepository.findByName(name.trim());
    if (existingName) throw new Error('Tên người dùng đã được sử dụng');

    const existingEmail = await userRepository.findByEmail(formattedEmail);
    if (existingEmail) throw new Error('Email đã được sử dụng');

    const existingPhone = await userRepository.findByPhone(phone);
    if (existingPhone) throw new Error('Số điện thoại đã được sử dụng');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      email: formattedEmail,
      phone,
      password: hashedPassword,
      name,
    });

    const token = signToken(
      { id: user.id, email: user.email, role: user.role || 'user', jti: randomUUID() },
      { expiresIn: '24h' }
    );

    return { user, token };
  }

  async login(data: any) {
    const { email, password } = data;
    const formattedIdentifier = email.trim();
    const formattedEmail = formattedIdentifier.toLowerCase();
    
    let user = await userRepository.findByEmail(formattedEmail);
    if (!user) {
      user = await userRepository.findByName(formattedIdentifier);
    }
    
    if (!user) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.is_verified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await userRepository.updateVerificationCode(user.id, code, expires);
      await sendVerificationEmail(user.email, code);

      return { requires2FA: true, email: user.email };
    }

    const token = signToken(
      { id: user.id, email: user.email, role: user.role || 'user', jti: randomUUID() },
      { expiresIn: '24h' }
    );

    const streakInfo = await streakService.calculateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);

    const { password: _p, verification_code: _v, code_expires_at: _c, reset_password_token: _r, reset_password_expires: _re, ...safeUser } = updatedUserRes;

    return { 
      requires2FA: false,
      token, 
      user: { 
        ...safeUser, 
        streak: streakInfo.currentStreak,
        longest_streak: streakInfo.longestStreak,
        studied_today: streakInfo.studiedToday,
        study_dates: streakInfo.studyDates,
      }
    };
  }

  async verify2FA(data: any) {
    const { email, code } = data;
    const formattedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(formattedEmail);

    if (!user) throw new Error('Người dùng không tồn tại');
    if (!user.verification_code || user.verification_code !== code.trim()) {
      throw new Error('Mã xác thực không chính xác');
    }
    if (new Date() > new Date(user.code_expires_at)) {
      throw new Error('Mã xác thực đã hết hạn');
    }

    await userRepository.updateVerificationCode(user.id, null, null);

    const streakInfo = await streakService.calculateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);

    const token = signToken(
      { id: user.id, email: user.email, role: user.role || 'user', jti: randomUUID() },
      { expiresIn: '24h' }
    );

    const { password: _p, verification_code: _v, code_expires_at: _c, reset_password_token: _r, reset_password_expires: _re, ...safeUser } = updatedUserRes;

    return { 
      token, 
      user: { 
        ...safeUser, 
        streak: streakInfo.currentStreak,
        longest_streak: streakInfo.longestStreak,
        studied_today: streakInfo.studiedToday,
        study_dates: streakInfo.studyDates,
      } 
    };
  }

  async toggleVerification(userId: number, enable: boolean) {
    const user = await userRepository.updateVerificationStatus(userId, enable === true);
    if (!user) throw new Error('Người dùng không tồn tại');
    
    const studyDates = await this.getUserStudyDates(userId);
    return { ...user, study_dates: studyDates };
  }

  async googleLogin(payload: any) {
    const { email, name, googleId } = payload;
    let user = await userRepository.findByEmail(email);
    
    if (!user) {
      const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      user = await userRepository.create({
        email,
        name: name || 'Google User',
        password: dummyPassword,
        phone: null
      });
    }

    const token = signToken(
      { id: user.id, email: user.email, role: user.role || 'user', jti: randomUUID() },
      { expiresIn: '24h' }
    );

    const streakInfo = await streakService.calculateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);

    const { password: _p, verification_code: _v, code_expires_at: _c, reset_password_token: _r, reset_password_expires: _re, ...safeUser } = updatedUserRes;

    return { 
      token, 
      user: { 
        ...safeUser, 
        streak: streakInfo.currentStreak,
        longest_streak: streakInfo.longestStreak,
        studied_today: streakInfo.studiedToday,
        study_dates: streakInfo.studyDates,
      } 
    };
  }

  async getMe(userId: number) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');

    const streakInfo = await streakService.calculateUserStreak(userId);
    const { password: _p, verification_code: _v, code_expires_at: _c, reset_password_token: _r, reset_password_expires: _re, ...safeUser } = user;
    return { 
      ...safeUser, 
      streak: streakInfo.currentStreak,
      longest_streak: streakInfo.longestStreak,
      studied_today: streakInfo.studiedToday,
      study_dates: streakInfo.studyDates,
    };
  }

  async refreshToken(oldToken: string) {
    if (!oldToken) {
      throw new Error('Thiếu token xác thực');
    }
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error('Missing JWT_SECRET_KEY in environment variables');
    }

    let decoded: any;
    try {
      decoded = verifyToken(oldToken);
    } catch (err: any) {
      throw new Error('Token không hợp lệ hoặc đã hết hạn');
    }

    if (!decoded || !decoded.id) {
      throw new Error('Token không hợp lệ');
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const newToken = signToken(
      { id: user.id, email: user.email, role: user.role || 'user', jti: randomUUID() },
      { expiresIn: '24h' }
    );

    const studyDates = await this.getUserStudyDates(user.id);
    const { password: _p, verification_code: _v, code_expires_at: _c, reset_password_token: _r, reset_password_expires: _re, ...safeUser } = user;
    return { token: newToken, user: { ...safeUser, study_dates: studyDates } };
  }

  async updateAvatar(userId: number, avatarUrl: string) {
    const user = await userRepository.updateAvatar(userId, avatarUrl);
    const studyDates = await this.getUserStudyDates(userId);
    return { ...user, study_dates: studyDates };
  }

  async updateProfile(userId: number, data: any) {
    const user = await userRepository.updateProfile(userId, data);
    const studyDates = await this.getUserStudyDates(userId);
    return { ...user, study_dates: studyDates };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Mật khẩu hiện tại không chính xác');

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, hashed);
  }

  async upgradePremium(userId: number) {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const user = await userRepository.updatePremiumStatus(userId, true, nextMonth);
    if (!user) throw new Error('Người dùng không tồn tại');

    const studyDates = await this.getUserStudyDates(userId);
    return { ...user, study_dates: studyDates };
  }

  async checkAvailability(field: string, value: string) {
    let val = value;
    if (field === 'email') val = value.toLowerCase().trim();
    if (field === 'name') val = value.trim();

    return await userRepository.checkAvailability(field, val);
  }

  async forgotPassword(email: string) {
    const formattedEmail = email.trim().toLowerCase();

    // Always return success to avoid email enumeration
    const user = await userRepository.findByEmail(formattedEmail);
    if (!user) {
      return;
    }

    // Generate a secure random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailResult = await sendPasswordResetEmail(user.email, resetLink);

    if (mailResult.devMode) {
      console.log(`[FORGOT-PWD] Dev mode - no SMTP configured.`);
    } else if (!mailResult.success) {
      console.error(`[FORGOT-PWD] Email send FAILED to ${user.email}:`, (mailResult as any).error?.message);
    } else {
      console.log(`[FORGOT-PWD] Email sent successfully to ${user.email} (MessageID: ${(mailResult as any).messageId})`);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    // Find user by token and check expiry
    const result = await db.query(
      'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      throw new Error('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }

    const user = result.rows[0];

    // Password validation
    if (newPassword.length < 10) {
      throw new Error('Mật khẩu tối thiểu 10 ký tự');
    }
    if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
      throw new Error('Mật khẩu phải chứa ít nhất 1 chữ cái');
    }
    if (!/(?=.*[\d#?!&@$%*])/.test(newPassword)) {
      throw new Error('Mật khẩu phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await db.query(
      'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashed, user.id]
    );
  }
}

export const authService = new AuthService();

