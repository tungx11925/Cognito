'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Liên kết không hợp lệ. Vui lòng yêu cầu lại.');
    }
  }, [token]);

  const passwordRules = [
    { label: 'Ít nhất 10 ký tự', valid: newPassword.length >= 10 },
    { label: 'Có ít nhất 1 chữ cái', valid: /[a-zA-Z]/.test(newPassword) },
    { label: 'Có ít nhất 1 chữ số hoặc ký tự đặc biệt', valid: /[\d#?!&@$%*]/.test(newPassword) },
  ];

  const isPasswordValid = passwordRules.every(r => r.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Mật khẩu đã được đặt lại thành công!');
        setTimeout(() => router.push('/'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      setStatus('error');
      setMessage('Không thể kết nối đến máy chủ.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1a14] via-[#1a2e1e] to-[#0f1a14] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-900/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-green-900/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-[#1a2820]/80 backdrop-blur-xl border border-emerald-900/40 rounded-2xl shadow-2xl p-8">
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-900/50 border border-emerald-700/50 mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
            <p className="text-gray-400 text-sm mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-300 font-semibold text-lg">{message}</p>
                <p className="text-gray-400 text-sm mt-2">Đang chuyển về trang đăng nhập...</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Error state for invalid token */}
                {status === 'error' && !token && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
                    {message}
                  </div>
                )}

                {/* New password field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      required
                      disabled={!token || status === 'loading'}
                      className="w-full bg-[#0f1a14] border border-emerald-900/50 text-white rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 placeholder-gray-600 disabled:opacity-50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password rules */}
                  {newPassword.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1"
                    >
                      {passwordRules.map(rule => (
                        <li key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${rule.valid ? 'text-emerald-400' : 'text-gray-500'}`}>
                          <span>{rule.valid ? '✓' : '○'}</span>
                          {rule.label}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>

                {/* Confirm password field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    disabled={!token || status === 'loading'}
                    className={`w-full bg-[#0f1a14] border text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 placeholder-gray-600 disabled:opacity-50 transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-700/60 focus:ring-red-500/30'
                        : 'border-emerald-900/50 focus:ring-emerald-500/50 focus:border-emerald-500'
                    }`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-400 text-xs mt-1">Mật khẩu không khớp</p>
                  )}
                </div>

                {/* API Error */}
                <AnimatePresence>
                  {status === 'error' && token && message && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm"
                    >
                      {message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <button
                  id="reset-password-submit"
                  type="submit"
                  disabled={!token || !isPasswordValid || newPassword !== confirmPassword || status === 'loading'}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    'Đặt lại mật khẩu'
                  )}
                </button>

                <p className="text-center text-gray-500 text-xs">
                  <button type="button" onClick={() => router.push('/')} className="text-emerald-400 hover:underline">
                    ← Quay về trang chủ
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f1a14] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
