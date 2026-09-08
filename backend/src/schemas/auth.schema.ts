import { z } from 'zod';

const passwordSchema = z.string()
  .min(10, 'Mật khẩu tối thiểu 10 ký tự')
  .regex(/(?=.*[a-zA-Z])/, 'Mật khẩu phải chứa ít nhất 1 chữ cái')
  .regex(/(?=.*[\d#?!&@$%*])/, 'Mật khẩu phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt');

const phoneRegex = /^(03|05|07|08|09)\d{8}$/;

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Tên người dùng phải có ít nhất 2 ký tự').trim(),
    phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ').nullable().optional(),
    email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
    password: passwordSchema,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  }),
});

export const verify2FASchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ').toLowerCase().trim(),
    code: z.string().min(1, 'Mã xác thực không hợp lệ'),
  }),
});

export const toggleVerificationSchema = z.object({
  body: z.object({
    enable: z.boolean({ message: 'Trường enable là bắt buộc' }),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    token: z.string({ message: 'Thiếu token Google' }).min(1, 'Thiếu token Google'),
  }),
});

export const checkAvailabilitySchema = z.object({
  body: z.object({
    field: z.enum(['email', 'phone', 'name'], { 
      message: 'Trường không hợp lệ'
    }),
    value: z.string().min(1, 'Thiếu thông tin giá trị'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Tên người dùng phải có ít nhất 2 ký tự').trim(),
    phone: z.string()
      .transform(val => {
        if (!val) return null;
        let normalized = val.replace(/[\s\-\(\)\+]/g, '');
        if (normalized.startsWith('84')) normalized = '0' + normalized.slice(2);
        return normalized;
      })
      .refine(val => !val || phoneRegex.test(val), 'Số điện thoại không hợp lệ')
      .nullable().optional(),
    education: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    privacy_setting: z.enum(['public', 'private', 'friends']).default('public').optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
  }),
});
