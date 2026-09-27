import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { authService } from '../services/auth.service';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(03|05|07|08|09)\d{8}$/;

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

    if (password.length < 10) {
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 10 ký tự' });
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ cái' });
    }
    if (!/(?=.*[\d#?!&@$%*])/.test(password)) {
      return res.status(400).json({ error: 'Mật khẩu phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt' });
    }

    const { user, token } = await authService.register({ name, phone, email, password });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: 'Đăng ký thành công', token, user: { ...user, study_dates: [] } });
  } catch (error: any) {
    if (error.message.includes('đã được sử dụng')) {
      return res.status(400).json({ error: error.message });
    }
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

    const result = await authService.login({ email, password });

    if (result.requires2FA) {
      return res.status(200).json({
        requires2FA: true,
        email: result.email,
        message: 'Mã xác thực đã được gửi về email của bạn'
      });
    }

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    res.status(200).json({ 
      message: 'Đăng nhập thành công', 
      token: result.token, 
      user: result.user
    });
  } catch (error: any) {
    if (error.message === 'Tài khoản hoặc mật khẩu không chính xác') {
      return res.status(401).json({ error: error.message });
    }
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

    const result = await authService.verify2FA({ email, code });

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại' || error.message.includes('Mã xác thực')) {
      const status = error.message === 'Người dùng không tồn tại' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
    console.error('Verify2FA error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const toggleVerification = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { enable } = req.body;

    const user = await authService.toggleVerification(userId, enable);

    res.status(200).json({
      message: enable ? 'Kích hoạt xác thực tài khoản thành công' : 'Đã tắt xác thực tài khoản',
      user
    });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      return res.status(404).json({ error: error.message });
    }
    console.error('ToggleVerification error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Token Google không hợp lệ' });
    }

    const { email, name, sub: googleId } = payload;
    
    const result = await authService.googleLogin({ email, name, googleId });

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Đăng nhập Google thành công',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Lỗi xác thực Google' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await authService.getMe(userId);
    
    res.status(200).json({ user });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      return res.status(404).json({ error: error.message });
    }
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

    const exists = await authService.checkAvailability(field, value);

    if (exists) {
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
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'cognito_avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }
      ]
    });

    try {
      if (filePath) await fs.promises.unlink(filePath);
    } catch (err) {
      console.warn('Failed to remove temp file:', err);
    }

    const avatarUrl = result.secure_url;
    console.log('Cloudinary upload success, URL:', avatarUrl);

    const user = await authService.updateAvatar(userId, avatarUrl);

    res.status(200).json({
      message: 'Cập nhật ảnh đại diện thành công',
      user,
      avatarUrl
    });
  } catch (error: any) {
    console.error('Update avatar error:', error);
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (err) {
        console.warn('Failed to remove temp file on error:', err);
      }
    }
    res.status(500).json({ error: 'Lỗi khi tải ảnh lên Cloudinary hoặc cập nhật DB' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, phone, education, address, privacy_setting } = req.body;

    const user = await authService.updateProfile(userId, {
      name: name,
      phone: phone,
      education: education || '',
      address: address || '',
      privacy_setting: privacy_setting
    });

    res.status(200).json({
      message: 'Cập nhật thông tin cá nhân thành công',
      user
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

    await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({ message: 'Thay đổi mật khẩu thành công!' });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại' || error.message === 'Mật khẩu hiện tại không chính xác') {
      const status = error.message === 'Người dùng không tồn tại' ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const upgradePremium = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await authService.upgradePremium(userId);

    res.status(200).json({
      message: 'Nâng cấp Premium thành công! Chào mừng bạn đến với thế giới không giới hạn.',
      user
    });
  } catch (error: any) {
    if (error.message === 'Người dùng không tồn tại') {
      return res.status(404).json({ error: error.message });
    }
    console.error('UpgradePremium error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email' });
    }

    await authService.forgotPassword(email);

    return res.status(200).json({ message: 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.' });
  } catch (error: any) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Thiếu token hoặc mật khẩu mới' });
    }

    await authService.resetPassword(token, newPassword);

    return res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay.' });
  } catch (error: any) {
    if (error.message.includes('hết hạn') || error.message.includes('không hợp lệ')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('tối thiểu') || error.message.includes('phải chứa')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('ResetPassword error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
};
