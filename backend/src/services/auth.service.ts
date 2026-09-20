import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import { activityService } from './activity.service';
import { db } from '../db';

export class AuthService {
  async getUserStudyDates(userId: number): Promise<string[]> {
    try {
      const datesRes = await db.query(
        'SELECT study_date FROM user_study_dates WHERE user_id = $1 ORDER BY study_date DESC',
        [userId]
      );
      return datesRes.rows.map(row => {
        const d = new Date(row.study_date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });
    } catch (err) {
      console.error('Error in getUserStudyDates:', err);
      return [];
    }
  }

  async register(data: any) {
    const { name, phone, email, password } = data;

    const formattedEmail = email ? email.toLowerCase().trim() : '';

    const existingName = await userRepository.findByName(name.trim());
    if (existingName) throw new Error('TÃªn ngÆ°á»i dÃ¹ng Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng');

    const existingEmail = await userRepository.findByEmail(formattedEmail);
    if (existingEmail) throw new Error('Email Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng');

    const existingPhone = await userRepository.findByPhone(phone);
    if (existingPhone) throw new Error('Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userRepository.create({
      email: formattedEmail,
      phone,
      password: hashedPassword,
      name,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'student' }, 
      process.env.JWT_SECRET_KEY!, 
      { expiresIn: '24h' }
    );

    return { user, token };
  }

  async login(data: any) {
    const { email, password } = data;
    const formattedIdentifier = email.trim();
    const formattedEmail = formattedIdentifier.toLowerCase();
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedIdentifier);
    let user;
    if (isEmail) {
      user = await userRepository.findByEmail(formattedEmail);
    } else {
      user = await userRepository.findByName(formattedIdentifier);
    }
    
    if (!user) {
      throw new Error('TÃ i khoáº£n hoáº·c máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c');
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('TÃ i khoáº£n hoáº·c máº­t kháº©u khÃ´ng chÃ­nh xÃ¡c');
    }

    if (user.is_verified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);

      await userRepository.updateVerificationCode(user.id, code, expires);
      await sendVerificationEmail(user.email, code);

      return { requires2FA: true, email: user.email };
    }

    // --- CHECK FOR FIRST LOGIN ---
    const membershipCheck = await db.query(
      'SELECT status, organization_id FROM organization_members WHERE user_id = $1 AND status = $2 LIMIT 1',
      [user.id, 'PENDING_FIRST_LOGIN']
    );
    if (membershipCheck.rows.length > 0) {
      return { 
        requiresPasswordChange: true, 
        email: user.email, 
        organizationId: membershipCheck.rows[0].organization_id 
      };
    }
    // -----------------------------

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'student' }, 
      process.env.JWT_SECRET_KEY!, 
      { expiresIn: '24h' }
    );

    await activityService.updateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);
    const studyDates = await this.getUserStudyDates(user.id);

    const { password: _p, verification_code: _v, code_expires_at: _c, ...safeUser } = updatedUserRes;

    return { 
      requires2FA: false,
      token, 
      user: { ...safeUser, study_dates: studyDates }
    };
  }

  async verify2FA(data: any) {
    const { email, code } = data;
    const formattedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(formattedEmail);

    if (!user) throw new Error('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i');
    if (!user.verification_code || user.verification_code !== code.trim()) {
      throw new Error('MÃ£ xÃ¡c thá»±c khÃ´ng chÃ­nh xÃ¡c');
    }
    if (new Date() > new Date(user.code_expires_at)) {
      throw new Error('MÃ£ xÃ¡c thá»±c Ä‘Ã£ háº¿t háº¡n');
    }

    await userRepository.updateVerificationCode(user.id, null, null);

    await activityService.updateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);
    const studyDates = await this.getUserStudyDates(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'student' }, 
      process.env.JWT_SECRET_KEY!, 
      { expiresIn: '24h' }
    );

    const { password: _p, verification_code: _v, code_expires_at: _c, ...safeUser } = updatedUserRes;

    return { token, user: { ...safeUser, study_dates: studyDates } };
  }

  async toggleVerification(userId: number, enable: boolean) {
    const user = await userRepository.updateVerificationStatus(userId, enable === true);
    if (!user) throw new Error('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i');
    
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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role || 'student' }, 
      process.env.JWT_SECRET_KEY!, 
      { expiresIn: '24h' }
    );

    await activityService.updateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);
    const studyDates = await this.getUserStudyDates(user.id);

    const { password: _p, verification_code: _v, code_expires_at: _c, ...safeUser } = updatedUserRes;

    return { token, user: { ...safeUser, study_dates: studyDates } };
  }

  async getMe(userId: number) {
    await activityService.updateUserStreak(userId);
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i');

    const studyDates = await this.getUserStudyDates(userId);
    const { password: _p, verification_code: _v, code_expires_at: _c, ...safeUser } = user;
    return { ...safeUser, study_dates: studyDates };
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
    if (!user) throw new Error('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Máº­t kháº©u hiá»‡n táº¡i khÃ´ng chÃ­nh xÃ¡c');

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, hashed);
  }

  async upgradePremium(userId: number) {
    const user = await userRepository.updateRole(userId, 'premium');
    if (!user) throw new Error('NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i');

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
      throw new Error('LiÃªn káº¿t Ä‘áº·t láº¡i máº­t kháº©u khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n');
    }

    const user = result.rows[0];

    // Password validation
    if (newPassword.length < 10) {
      throw new Error('Máº­t kháº©u tá»‘i thiá»ƒu 10 kÃ½ tá»±');
    }
    if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
      throw new Error('Máº­t kháº©u pháº£i chá»©a Ã­t nháº¥t 1 chá»¯ cÃ¡i');
    }
    if (!/(?=.*[\d#?!&@$%*])/.test(newPassword)) {
      throw new Error('Máº­t kháº©u pháº£i chá»©a Ã­t nháº¥t 1 chá»¯ sá»‘ hoáº·c kÃ½ tá»± Ä‘áº·c biá»‡t');
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

