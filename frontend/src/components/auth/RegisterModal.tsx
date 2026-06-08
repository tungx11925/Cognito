'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Circle, X } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { useRouter } from 'next/navigation';
import { googleLogin } from '../../services/auth.service';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerMessage: (msg: string, type: 'success' | 'error') => void;
}

export default function RegisterModal({ isOpen, onClose, triggerMessage }: RegisterModalProps) {
  const router = useRouter();
  const { login: contextLogin, register: contextRegister, setActiveUser, setIsAuthenticated } = useStudy();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(03|05|07|08|09)\d{8}$/;

  const hasLetter = /(?=.*[a-zA-Z])/.test(password);
  const hasNumberOrSymbol = /(?=.*[\d#?!&@$%*])/.test(password);
  const isLongEnough = password.length >= 10;
  const isPasswordValid = hasLetter && hasNumberOrSymbol && isLongEnough;

  const hasData = name.trim() !== '' || email.trim() !== '' || phone.trim() !== '' || password.trim() !== '' || confirmPassword.trim() !== '';

  // Handle ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasData) {
          triggerMessage("Dữ liệu của bạn chưa được lưu. Vui lòng bấm dấu X nếu muốn thoát.", "error");
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, hasData, triggerMessage]);

  // Google Sign-In Initialization
  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      const googleToken = response.credential;
      const res = await googleLogin(googleToken);
      if (res && res.user) {
        localStorage.setItem('token', res.token);
        setActiveUser(res.user);
        setIsAuthenticated(true);
        onClose();
        triggerMessage("Đăng nhập bằng Google thành công!", "success");
        router.push('/dashboard');
      } else {
        triggerMessage(res.error || "Không thể đăng nhập bằng Google", "error");
      }
    } catch (err: any) {
      triggerMessage("Lỗi kết nối khi đăng nhập Google", "error");
    }
  };

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const initGoogle = () => {
        if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
          (window as any).google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse,
          });
          
          const btnContainer = document.getElementById("googleSignInButton");
          if (btnContainer) {
            (window as any).google.accounts.id.renderButton(
              btnContainer,
              { theme: "outline", size: "large", width: "100%", shape: "rectangular" }
            );
          }
        } else {
          setTimeout(initGoogle, 100);
        }
      };
      initGoogle();
    }
  }, [isOpen]);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email)) {
      setErrors({...errors, email: 'Vui lòng nhập đúng định dạng email'});
      return;
    }
    triggerMessage("Đã gửi liên kết khôi phục. Vui lòng kiểm tra email!", "success");
    setIsForgotPasswordMode(false);
  };

  const handleBlur = async (field: string, value: string) => {
    if (!isRegisterMode || !value.trim()) return;
    
    if (field === 'email' && !emailRegex.test(value)) return;
    if (field === 'phone' && !phoneRegex.test(value)) return;
    if (field === 'name' && value.trim().length < 2) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.isAvailable) {
          setErrors(prev => ({ ...prev, [field]: data.error }));
        } else {
          setErrors(prev => {
            if (prev[field as keyof typeof prev] === 'Email đã được sử dụng' || 
                prev[field as keyof typeof prev] === 'Số điện thoại đã được sử dụng' ||
                prev[field as keyof typeof prev] === 'Tên người dùng đã được sử dụng') {
              return { ...prev, [field]: '' };
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error('Check availability error', e);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let isValid = true;
    const newErrors = { name: '', phone: '', email: '', password: '', confirmPassword: '' };

    if (isRegisterMode) {
      if (!name.trim() || name.length < 2) {
        newErrors.name = 'Tên người dùng tối thiểu 2 ký tự';
        isValid = false;
      }
      if (!phoneRegex.test(phone)) {
        newErrors.phone = 'SĐT không hợp lệ (Bắt đầu bằng 03, 05, 07, 08, 09 và đủ 10 số)';
        isValid = false;
      }
      if (!isPasswordValid) {
        newErrors.password = 'Vui lòng thỏa mãn các điều kiện mật khẩu';
        isValid = false;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
        isValid = false;
      }
    } else {
      if (!password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
        isValid = false;
      }
    }
    
    if (isRegisterMode) {
      if (!emailRegex.test(email)) {
        newErrors.email = 'Email không hợp lệ';
        isValid = false;
      }
    } else {
      if (!email.trim()) {
        newErrors.email = 'Vui lòng nhập tài khoản';
        isValid = false;
      }
    }

    setErrors(newErrors);
    if (!isValid) {
      triggerMessage("Vui lòng nhập đúng các thông tin yêu cầu", "error");
      return;
    }

    if (isRegisterMode) {
      if (!isPasswordValid) return; 
      const result = await contextRegister(name, phone, email, password);
      if (result.success) {
        setIsRegisterMode(false);
        setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''});
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        triggerMessage("Đăng ký thành công! Vui lòng đăng nhập.", "success");
      } else {
        const errorMsg = result.error || '';
        if (errorMsg.toLowerCase().includes('email')) {
           setErrors(prev => ({ ...prev, email: errorMsg }));
        } else if (errorMsg.toLowerCase().includes('tên người dùng') || errorMsg.toLowerCase().includes('name') || errorMsg.toLowerCase().includes('tên')) {
           setErrors(prev => ({ ...prev, name: errorMsg }));
        } else if (errorMsg.toLowerCase().includes('điện thoại') || errorMsg.toLowerCase().includes('phone')) {
           setErrors(prev => ({ ...prev, phone: errorMsg }));
        }
      }
    } else {
      const success = await contextLogin(email, password);
      if (success) {
        onClose();
        router.push('/dashboard');
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (hasData) {
        triggerMessage("Bạn đang nhập dở dữ liệu. Vui lòng bấm dấu X để đóng popup.", "error");
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] bg-[#0D2B24]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Sticky Header */}
        <div className="flex-shrink-0 bg-[#FAF8F5] border-b border-[#0D2B24]/10 z-10 relative">
          <div className="flex relative">
            <button 
              onClick={() => { setIsRegisterMode(false); setIsForgotPasswordMode(false); setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''}); }}
              className={`flex-1 py-3 text-[13px] font-bold transition-colors ${!isRegisterMode && !isForgotPasswordMode ? 'text-[#0D2B24] border-b-2 border-[#0D2B24]' : 'text-[#0D2B24]/40 hover:text-[#0D2B24]/60'}`}
            >
              Đăng Nhập
            </button>
            <button 
              onClick={() => { setIsRegisterMode(true); setIsForgotPasswordMode(false); setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''}); }}
              className={`flex-1 py-3 text-[13px] font-bold transition-colors ${isRegisterMode && !isForgotPasswordMode ? 'text-[#0D2B24] border-b-2 border-[#0D2B24]' : 'text-[#0D2B24]/40 hover:text-[#0D2B24]/60'}`}
            >
              Đăng Ký
            </button>
            
            <button 
              onClick={() => {
                if (hasData) {
                  if (window.confirm("Bạn có chắc chắn muốn thoát? Các thông tin bạn vừa nhập sẽ bị mất.")) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#0D2B24]/40 hover:text-[#0D2B24] transition-colors rounded-full hover:bg-[#0D2B24]/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="mb-4">
            <h1 className="text-[20px] font-black tracking-widest font-serif text-[#0D2B24] uppercase">
              {isForgotPasswordMode ? "Khôi phục mật khẩu" : "EduShare AI"}
            </h1>
            <p className="text-[11px] text-[#0D2B24]/60 font-semibold mt-0.5">
              {isForgotPasswordMode 
                ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu" 
                : isRegisterMode ? "Bắt đầu hành trình học tập của bạn" : "Chào mừng quay trở lại"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isForgotPasswordMode ? (
              <motion.form 
                key="forgot-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleForgotSubmit} 
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">ĐỊA CHỈ EMAIL</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-[#0D2B24]/40" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if(errors.email) setErrors({...errors, email: ''});
                      }}
                      onBlur={() => {
                        if (email && !emailRegex.test(email)) {
                          setErrors({...errors, email: 'Vui lòng nhập đúng định dạng email'});
                        }
                      }}
                      className={`w-full pl-9 pr-10 py-2.5 bg-white border ${errors.email ? 'border-red-500' : 'border-[#0D2B24]/10'} focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-[13px] text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30`}
                      placeholder="Nhập email đã đăng ký của bạn..."
                    />
                    <div className="absolute right-4 flex items-center">
                      <AnimatePresence>
                        {emailRegex.test(email) && (
                          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 pl-1">{errors.email}</p>}
                </div>
                
                <button 
                  type="submit" 
                  disabled={!emailRegex.test(email)}
                  className={`w-full py-2.5 text-white font-extrabold text-[13px] rounded-xl transition-all duration-300 shadow-md ${!emailRegex.test(email) ? 'bg-[#0D2B24]/40 cursor-not-allowed' : 'bg-[#0D2B24] hover:bg-[#0D2B24]/90 active:scale-[0.98]'}`}
                >
                  Gửi yêu cầu
                </button>
                
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setIsForgotPasswordMode(false)} className="text-[11px] font-bold text-[#0D2B24]/60 hover:text-[#0D2B24] transition-colors underline-offset-2 hover:underline">
                    Quay lại Đăng nhập
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div key="auth-container" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <form onSubmit={handleAuthSubmit} className="space-y-2.5">
            <AnimatePresence mode="wait">
              {isRegisterMode && (
                <motion.div 
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">Tên người dùng</label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3 w-4 h-4 text-[#0D2B24]/40" />
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if(errors.name) setErrors({...errors, name: ''});
                          }}
                          onBlur={(e) => handleBlur('name', e.target.value)}
                          className={`w-full pl-9 pr-8 py-2 bg-white border ${errors.name ? 'border-red-500' : 'border-[#0D2B24]/10'} focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-[13px] text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30`}
                          placeholder="Nguyễn Văn A"
                        />
                        <div className="absolute right-2 flex items-center">
                          <AnimatePresence>
                            {name.trim().length >= 2 && !errors.name && (
                              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </motion.div>
                            )}
                            {errors.name && (
                              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <XCircle className="w-4 h-4 text-rose-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      {errors.name && <p className="text-[10px] text-red-500 pl-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">SĐT</label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-3 w-4 h-4 text-[#0D2B24]/40" />
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if(errors.phone) setErrors({...errors, phone: ''});
                          }}
                          onBlur={(e) => handleBlur('phone', e.target.value)}
                          className={`w-full pl-9 pr-8 py-2 bg-white border ${errors.phone ? 'border-red-500' : 'border-[#0D2B24]/10'} focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-[13px] text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30`}
                          placeholder="091234..."
                        />
                        <div className="absolute right-2 flex items-center">
                          <AnimatePresence>
                            {phoneRegex.test(phone) && !errors.phone && (
                              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </motion.div>
                            )}
                            {errors.phone && (
                              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                <XCircle className="w-4 h-4 text-rose-500" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      {errors.phone && <p className="text-[10px] text-red-500 pl-1">{errors.phone}</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">{isRegisterMode ? "ĐỊA CHỈ EMAIL" : "TÀI KHOẢN"}</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-[#0D2B24]/40" />
                <input 
                  type={isRegisterMode ? "email" : "text"} 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if(errors.email) setErrors({...errors, email: ''});
                  }}
                  onBlur={(e) => handleBlur('email', e.target.value)}
                  className={`w-full pl-9 pr-10 py-2 bg-white border ${errors.email ? 'border-red-500' : 'border-[#0D2B24]/10'} focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-[13px] text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30`}
                  placeholder={isRegisterMode ? "Địa chỉ email..." : "Email hoặc Tên đăng nhập"}
                />
                <div className="absolute right-4 flex items-center">
                  <AnimatePresence>
                    {(isRegisterMode ? emailRegex.test(email) : email.trim().length > 0) && !errors.email && (
                      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </motion.div>
                    )}
                    {errors.email && (
                      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                        <XCircle className="w-4 h-4 text-rose-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {errors.email && <p className="text-[10px] text-red-500 pl-1">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0D2B24]/40" />
                <input 
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if(errors.password) setErrors({...errors, password: ''});
                  }}
                  className={`w-full pl-9 pr-10 py-2 bg-white border ${errors.password ? 'border-red-500' : 'border-[#0D2B24]/10'} focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-[13px] text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30`}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D2B24]/40 hover:text-[#0D2B24] transition-colors"
                >
                  {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-between items-start mt-1">
                <div className="flex-1">
                  {errors.password && <p className="text-[10px] text-red-500 pl-1">{errors.password}</p>}
                </div>
                {!isRegisterMode && (
                  <button 
                    type="button" 
                    onClick={() => setIsForgotPasswordMode(true)} 
                    className="text-[10px] font-bold text-[#0D2B24]/60 hover:text-[#0D2B24] transition-colors underline-offset-2 hover:underline ml-2"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isRegisterMode && (
                <motion.div 
                  key="password-requirements"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5"
                >
                  <div className="flex flex-wrap gap-x-3 gap-y-1 pl-1 mt-1">
                    <div className="flex items-center gap-1.5 w-[45%]">
                      {password ? (
                        hasLetter ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : <Circle className="w-3.5 h-3.5 text-[#0D2B24]/30" />}
                      <span className={`text-[10px] leading-tight ${password && hasLetter ? 'text-emerald-600 font-semibold' : password && !hasLetter ? 'text-rose-600' : 'text-[#0D2B24]/50'}`}>Có chữ cái</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-[45%]">
                      {password ? (
                        isLongEnough ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : <Circle className="w-3.5 h-3.5 text-[#0D2B24]/30" />}
                      <span className={`text-[10px] leading-tight ${password && isLongEnough ? 'text-emerald-600 font-semibold' : password && !isLongEnough ? 'text-rose-600' : 'text-[#0D2B24]/50'}`}>Tối thiểu 10 ký tự</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-full">
                      {password ? (
                        hasNumberOrSymbol ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      ) : <Circle className="w-3.5 h-3.5 text-[#0D2B24]/30" />}
                      <span className={`text-[10px] leading-tight ${password && hasNumberOrSymbol ? 'text-emerald-600 font-semibold' : password && !hasNumberOrSymbol ? 'text-rose-600' : 'text-[#0D2B24]/50'}`}>Có chữ số hoặc ký tự đặc biệt</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-[#0D2B24]/60 uppercase tracking-wider pl-1">Xác nhận mật khẩu</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-[#0D2B24]/40" />
                      <input 
                        type={confirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if(errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                        }}
                        className={`w-full pl-9 pr-14 py-2 bg-white border ${errors.confirmPassword ? 'border-red-500' : 'border-[#0D2B24]/10'} focus:border-[#0D2B24] focus:ring-1 focus:ring-[#0D2B24] text-[13px] text-[#0D2B24] rounded-xl focus:outline-none transition-all placeholder:text-[#0D2B24]/30`}
                        placeholder="••••••••"
                      />
                      <div className="absolute right-3 flex items-center gap-2">
                        <AnimatePresence>
                          {confirmPassword && confirmPassword === password && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.5 }} 
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <button 
                          type="button"
                          onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                          className="text-[#0D2B24]/40 hover:text-[#0D2B24] transition-colors flex items-center justify-center"
                        >
                          {confirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && <p className="text-[10px] text-red-500 pl-1">{errors.confirmPassword}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              className="w-full py-2.5 mt-2 text-white font-extrabold text-[13px] rounded-xl transition-all duration-300 shadow-md bg-[#0D2B24] hover:bg-[#0D2B24]/90 active:scale-[0.98]"
            >
              {isRegisterMode ? "Tạo Tài Khoản" : "Đăng Nhập"}
            </button>
          </form>

          <div className="mt-4">
            <div className="relative flex items-center mb-4">
              <div className="flex-grow border-t border-[#0D2B24]/10"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-[#0D2B24]/30 uppercase tracking-wider">Hoặc tiếp tục với</span>
              <div className="flex-grow border-t border-[#0D2B24]/10"></div>
            </div>
            <div className="flex justify-center w-full">
              <div id="googleSignInButton" className="w-full flex justify-center [&>div]:w-full overflow-hidden rounded-xl"></div>
            </div>
          </div>
          </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
