import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { sendVerificationEmail } from '../utils/mailer';
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

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
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

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
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

    if (!user) throw new Error('Người dùng không tồn tại');
    if (!user.verification_code || user.verification_code !== code.trim()) {
      throw new Error('Mã xác thực không chính xác');
    }
    if (new Date() > new Date(user.code_expires_at)) {
      throw new Error('Mã xác thực đã hết hạn');
    }

    await userRepository.updateVerificationCode(user.id, null, null);

    await activityService.updateUserStreak(user.id);
    const updatedUserRes = await userRepository.findById(user.id);
    const studyDates = await this.getUserStudyDates(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET_KEY!, 
      { expiresIn: '24h' }
    );

    const { password: _p, verification_code: _v, code_expires_at: _c, ...safeUser } = updatedUserRes;

    return { token, user: { ...safeUser, study_dates: studyDates } };
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

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
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
    if (!user) throw new Error('Người dùng không tồn tại');

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
    if (!user) throw new Error('Người dùng không tồn tại');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Mật khẩu hiện tại không chính xác');

    const hashed = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, hashed);
  }

  async upgradePremium(userId: number) {
    const user = await userRepository.updateRole(userId, 'premium');
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
}

export const authService = new AuthService();
