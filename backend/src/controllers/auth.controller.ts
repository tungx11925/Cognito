import { Request, Response } from 'express';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { sendVerificationEmail } from '../utils/mailer';
import { updateUserStreak } from '../routes/app.routes';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(03|05|07|08|09)\d{8}$/;

async function getUserStudyDates(userId: number): Promise<string[]> {
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

export const register = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Tên người dùng phải có ít nhất 2 ký tự' });
    }

    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
    }

    const formattedEmail = email ? email.toLowerCase().trim() : '';

    if (!emailRegex.test(formattedEmail)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    // Password validation logic
    if (password.length < 10) {
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 10 ký tự' });
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ cái' });
    }
    if (!/(?=.*[\d#?!&@$%*])/.test(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt' });
    }

    const existingName = await db.query('SELECT * FROM users WHERE name = $1', [name.trim()]);
    if (existingName.rows.length > 0) {
      return res.status(400).json({ error: 'Tên người dùng đã được sử dụng' });
    }

    const existingEmail = await db.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    const existingPhone = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ error: 'Số điện thoại đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (email, phone, password, name) VALUES ($1, $2, $3, $4) RETURNING id, email, phone, name, education, address, website, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting',
      [formattedEmail, phone, hashedPassword, name]
    );
    
    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here', 
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'Đăng ký thành công', token, user: { ...user, study_dates: [] } });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
    }

    const formattedIdentifier = email.trim();
    const formattedEmail = formattedIdentifier.toLowerCase();
    
    // Check if the input is an email, otherwise treat as username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedIdentifier);
    
    let result;
    if (isEmail) {
      result = await db.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);
    } else {
      result = await db.query('SELECT * FROM users WHERE name = $1', [formattedIdentifier]);
    }
    
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }

    // Check if 2FA (Verification status) is active/enabled for this user
    if (user.is_verified) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      await db.query(
        'UPDATE users SET verification_code = $1, code_expires_at = $2 WHERE id = $3',
        [code, expires, user.id]
      );

      // Send the email code
      await sendVerificationEmail(user.email, code);

      return res.status(200).json({
        requires2FA: true,
        email: user.email,
        message: 'Mã xác thực đã được gửi về email của bạn'
      });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here', 
      { expiresIn: '24h' }
    );

    // Update login study activity streak
    const updatedStreak = await updateUserStreak(user.id);
    const userRes = await db.query('SELECT streak, last_study_date FROM users WHERE id = $1', [user.id]);
    const finalStreak = userRes.rows[0]?.streak ?? user.streak;
    const finalLastStudyDate = userRes.rows[0]?.last_study_date ?? user.last_study_date;
    const studyDates = await getUserStudyDates(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.status(200).json({ 
      message: 'Đăng nhập thành công', 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        phone: user.phone, 
        education: user.education, 
        address: user.address, 
        website: user.website, 
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        streak: finalStreak,
        last_study_date: finalLastStudyDate,
        study_dates: studyDates,
        privacy_setting: user.privacy_setting
      } 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ email và mã xác thực' });
    }

    const formattedEmail = email.trim().toLowerCase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    if (!user.verification_code || user.verification_code !== code.trim()) {
      return res.status(400).json({ error: 'Mã xác thực không chính xác' });
    }

    if (new Date() > new Date(user.code_expires_at)) {
      return res.status(400).json({ error: 'Mã xác thực đã hết hạn' });
    }

    // Reset verification details
    await db.query('UPDATE users SET verification_code = null, code_expires_at = null WHERE id = $1', [user.id]);

    // Update login study activity streak
    const updatedStreak = await updateUserStreak(user.id);
    const userRes = await db.query('SELECT streak, last_study_date FROM users WHERE id = $1', [user.id]);
    const finalStreak = userRes.rows[0]?.streak ?? user.streak;
    const finalLastStudyDate = userRes.rows[0]?.last_study_date ?? user.last_study_date;
    const studyDates = await getUserStudyDates(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here', 
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        education: user.education,
        address: user.address,
        website: user.website,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        streak: finalStreak,
        last_study_date: finalLastStudyDate,
        study_dates: studyDates,
        privacy_setting: user.privacy_setting
      }
    });
  } catch (error: any) {
    console.error('Verify2FA error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const toggleVerification = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { enable } = req.body;

    const result = await db.query(
      'UPDATE users SET is_verified = $1 WHERE id = $2 RETURNING id, email, name, phone, education, address, website, avatar_url, is_verified, streak, last_study_date',
      [enable === true, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    const studyDates = await getUserStudyDates(userId);

    res.status(200).json({
      message: enable ? 'Kích hoạt xác thực tài khoản thành công' : 'Đã tắt xác thực tài khoản',
      user: {
        ...result.rows[0],
        study_dates: studyDates
      }
    });
  } catch (error: any) {
    console.error('ToggleVerification error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Thiếu token Google' });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Token Google không hợp lệ' });
    }

    const { email, name, sub: googleId } = payload;
    let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    let user;
    if (userResult.rows.length === 0) {
      // User doesn't exist, create a new one
      const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      const insertResult = await db.query(
        'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name, phone, education, address, website, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting',
        [email, name || 'Google User', dummyPassword]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Google logins do not enforce email 2FA because email ownership is verified by Google
    const authToken = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here', 
      { expiresIn: '24h' }
    );

    // Update login study activity streak
    const updatedStreak = await updateUserStreak(user.id);
    const userRes = await db.query('SELECT streak, last_study_date FROM users WHERE id = $1', [user.id]);
    const finalStreak = userRes.rows[0]?.streak ?? user.streak;
    const finalLastStudyDate = userRes.rows[0]?.last_study_date ?? user.last_study_date;
    const studyDates = await getUserStudyDates(user.id);

    res.cookie('token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Đăng nhập Google thành công',
      token: authToken,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        phone: user.phone, 
        education: user.education, 
        address: user.address, 
        website: user.website, 
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
        streak: finalStreak,
        last_study_date: finalLastStudyDate,
        study_dates: studyDates,
        privacy_setting: user.privacy_setting
      }
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Lỗi xác thực Google' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Automatically update/calculate streak on session check
    await updateUserStreak(userId);
    
    const result = await db.query('SELECT id, email, name, phone, education, address, website, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    const studyDates = await getUserStudyDates(userId);
    
    res.status(200).json({
      user: {
        ...result.rows[0],
        study_dates: studyDates
      }
    });
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { field, value } = req.body;
    if (!field || !value) {
      return res.status(400).json({ error: 'Thiếu thông tin' });
    }
    let query = '';
    let val = value;
    if (field === 'email') {
      query = 'SELECT id FROM users WHERE email = $1';
      val = value.toLowerCase().trim();
    } else if (field === 'phone') {
      query = 'SELECT id FROM users WHERE phone = $1';
    } else if (field === 'name') {
      query = 'SELECT id FROM users WHERE name = $1';
      val = value.trim();
    } else {
      return res.status(400).json({ error: 'Trường không hợp lệ' });
    }

    const result = await db.query(query, [val]);
    if (result.rows.length > 0) {
      let errorMsg = '';
      if (field === 'email') errorMsg = 'Email đã được sử dụng';
      if (field === 'phone') errorMsg = 'Số điện thoại đã được sử dụng';
      if (field === 'name') errorMsg = 'Tên người dùng đã được sử dụng';
      return res.status(200).json({ isAvailable: false, error: errorMsg });
    }
    
    res.status(200).json({ isAvailable: true });
  } catch (error: any) {
    console.error('CheckAvailability error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const updateAvatar = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn ảnh đại diện' });
    }

    const filePath = req.file.path;
    console.log('Uploading file to Cloudinary:', filePath);
    
    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'cognito_avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }
      ]
    });

    // Remove local temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const avatarUrl = result.secure_url;
    console.log('Cloudinary upload success, URL:', avatarUrl);

    // Update user in database
    const dbResult = await db.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, name, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting',
      [avatarUrl, userId]
    );

    const user = dbResult.rows[0];
    const studyDates = await getUserStudyDates(userId);

    res.status(200).json({
      message: 'Cập nhật ảnh đại diện thành công',
      user: {
        ...user,
        study_dates: studyDates
      },
      avatarUrl
    });
  } catch (error: any) {
    console.error('Update avatar error:', error);
    // Cleanup file in case of error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Lỗi khi tải ảnh lên Cloudinary' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, phone, education, address, privacy_setting } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Tên người dùng phải có ít nhất 2 ký tự' });
    }

    let normalizedPhone = phone ? phone.replace(/[\s\-\(\)\+]/g, '') : null;
    if (normalizedPhone && normalizedPhone.startsWith('84')) {
      normalizedPhone = '0' + normalizedPhone.slice(2);
    }

    if (normalizedPhone && !phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
    }

    const validPrivacySettings = ['public', 'private', 'friends'];
    const finalPrivacySetting = validPrivacySettings.includes(privacy_setting) ? privacy_setting : 'public';

    const dbResult = await db.query(
      'UPDATE users SET name = $1, phone = $2, education = $3, address = $4, privacy_setting = $5 WHERE id = $6 RETURNING id, email, name, phone, education, address, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting',
      [name.trim(), normalizedPhone, education || '', address || '', finalPrivacySetting, userId]
    );

    const user = dbResult.rows[0];
    const studyDates = await getUserStudyDates(userId);

    res.status(200).json({
      message: 'Cập nhật thông tin cá nhân thành công',
      user: {
        ...user,
        study_dates: studyDates
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới' });
    }

    // Retrieve user and their hashed password
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    // Password validation logic matching register
    if (newPassword.length < 10) {
      return res.status(400).json({ error: 'Mật khẩu mới tối thiểu 10 ký tự' });
    }
    if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu mới phải chứa ít nhất 1 chữ cái' });
    }
    if (!/(?=.*[\d#?!&@$%*])/.test(newPassword)) {
      return res.status(400).json({ error: 'Mật khẩu mới phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt' });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

    res.status(200).json({ message: 'Thay đổi mật khẩu thành công!' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};
