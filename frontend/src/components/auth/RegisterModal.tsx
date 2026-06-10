'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Circle, X, GraduationCap, Hourglass } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { useRouter } from 'next/navigation';
import { googleLogin } from '../../services/auth.service';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerMessage: (msg: string, type: 'success' | 'error') => void;
}

interface FloatingInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  rightElement?: React.ReactNode;
}

function FloatingInput({
  id,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  icon,
  error,
  rightElement,
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1 w-full">
      <div className="relative group">
        {/* Floating Label */}
        <span
          className={`absolute left-10 transition-all duration-200 pointer-events-none ${
            isFocused || value
              ? 'top-0 -translate-y-1/2 bg-white px-1.5 text-xs text-[#00c495] font-semibold z-10'
              : 'top-1/2 -translate-y-1/2 text-gray-400 text-sm'
          }`}
        >
          {placeholder}
        </span>

        {/* Icon */}
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 ${
          isFocused ? 'text-[#00c495]' : 'text-gray-400 group-hover:text-gray-600'
        }`}>
          {icon}
        </div>

        {/* Input */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          placeholder={placeholder}
          className={`w-full pl-11 ${rightElement ? 'pr-12' : 'pr-4'} py-3 bg-transparent border ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : isFocused
              ? 'border-[#00c495] ring-1 ring-[#00c495]'
              : 'border-gray-200 hover:border-gray-300'
          } rounded-xl text-sm text-gray-800 focus:outline-none transition-all placeholder:text-transparent`}
        />

        {/* Right Element */}
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 pl-1">{error}</p>}
    </div>
  );
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

  // Custom states for styling compliance
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);

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
      if (!agreeToTerms) {
        triggerMessage("Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách bảo mật", "error");
        return;
      }
      if (!isRobotChecked) {
        triggerMessage("Vui lòng xác thực bạn không phải là robot", "error");
        return;
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

  const handleCloseAttempt = () => {
    if (hasData) {
      if (window.confirm("Bạn có chắc chắn muốn thoát? Các thông tin bạn vừa nhập sẽ bị mất.")) {
        onClose();
      }
    } else {
      onClose();
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
        className="w-full max-w-md md:max-w-4xl bg-white border border-gray-100 rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative min-h-[500px] max-h-[90vh] md:h-[680px]"
      >
        {/* Left Side: Brand Visual Section (hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 bg-[#1a3d28] p-8 relative flex-col justify-between overflow-hidden">
          {/* Grid pattern background (craft aesthetic on dark green) */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          {/* Layered Paper Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Yellow Lined Paper tilted in the bottom-right corner */}
            <div 
              className="absolute right-6 bottom-6 w-60 h-64 transform rotate-[8deg] shadow-lg z-0" 
              style={{
                background: "#fef9c3",
                backgroundImage: "repeating-linear-gradient(transparent, transparent 24px, rgba(26,61,40,0.08) 24px, rgba(26,61,40,0.08) 25px)",
                borderRadius: "16px",
                borderLeft: "2px solid rgba(239, 68, 68, 0.15)"
              }}
            />
            {/* Secondary dark background shape to add depth */}
            <div 
              className="absolute left-6 bottom-6 w-64 h-56 transform -rotate-[4deg] shadow-xl z-10"
              style={{ background: "#112a1c", borderRadius: "24px" }}
            />
            {/* White notebook sheet on top - bottom-left */}
            <div 
              className="absolute left-6 bottom-6 w-[85%] h-52 transform -rotate-[2deg] bg-white border border-gray-100 shadow-md rounded-xl z-20 p-4 flex flex-col justify-between"
            >
              {/* Binder holes at the top of the paper */}
              <div className="absolute top-2 left-0 right-0 flex justify-around px-4 opacity-40">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />
                ))}
              </div>
              
              {/* Content inside the mock paper */}
              <div className="pt-4 flex-grow flex flex-col justify-between">
                <div>
                  <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
                    <Hourglass className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-xs mb-1 font-serif">Kế hoạch học tập</h4>
                  <p className="text-[9px] text-gray-400 leading-normal">
                    {isRegisterMode 
                      ? "Đăng ký tài khoản để bắt đầu theo dõi thời gian học tập."
                      : "Tiếp tục tích lũy thời gian học tập cùng Trợ lý."}
                  </p>
                </div>
                
                <div className="pt-2 border-t border-dashed border-gray-100">
                  <div className="flex justify-between text-[8px] text-[#1a3d28] font-bold mb-1">
                    <span>Tiến trình</span>
                    <span>100%</span>
                  </div>
                  <div className="h-1 w-full bg-emerald-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full text-[8px] text-emerald-700 font-bold uppercase tracking-wider">
                    <span className="text-yellow-500">★</span> Workspace
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Content */}
          <div className="relative z-30 flex flex-col pt-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-5">
              <GraduationCap className="w-6 h-6 text-[#00c495]" />
            </div>
            <h2 
              className="text-2xl font-black text-white mb-3 leading-none"
              style={{ fontFamily: "'Playfair Display', 'Merriweather', serif" }}
            >
              EduShare AI
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed max-w-[85%]">
              {isRegisterMode 
                ? "Đăng ký để mở khóa các bài ôn tập thông minh bằng Flashcards và chat cùng trợ lý tài liệu AI."
                : "Chào mừng quay trở lại. Hãy tiếp tục tiến trình nghiên cứu học thuật của bạn cùng Trợ lý."}
            </p>
          </div>

          {/* Empty div for bottom space layout */}
          <div className="relative z-30 mt-auto" />
        </div>

        {/* Right Side: Form and Navigation */}
        <div className="w-full md:w-7/12 flex flex-col p-6 md:p-10 overflow-y-auto relative bg-[#FAF8F5] md:bg-white">
          {/* Close button top right */}
          <button 
            onClick={handleCloseAttempt}
            className="absolute right-6 top-6 p-2 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors rounded-full z-20 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Navigation Tabs (Only visible when not resetting password) */}
          {!isForgotPasswordMode && (
            <div className="flex gap-6 border-b border-gray-100 mb-6 flex-shrink-0">
              <button 
                type="button"
                onClick={() => { setIsRegisterMode(false); setIsForgotPasswordMode(false); setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''}); }}
                className={`pb-3 text-sm font-bold transition-all relative focus:outline-none ${!isRegisterMode ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Đăng Nhập
                {!isRegisterMode && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00c495] rounded-full" />
                )}
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegisterMode(true); setIsForgotPasswordMode(false); setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''}); }}
                className={`pb-3 text-sm font-bold transition-all relative focus:outline-none ${isRegisterMode ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Đăng Ký
                {isRegisterMode && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00c495] rounded-full" />
                )}
              </button>
            </div>
          )}

          {/* Form Header */}
          <div className="mb-6 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isForgotPasswordMode 
                ? "Khôi phục mật khẩu" 
                : isRegisterMode 
                  ? "Đăng Ký Tài Khoản" 
                  : "Chào Mừng Quay Trở Lại"}
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {isForgotPasswordMode 
                ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu" 
                : isRegisterMode 
                  ? "Bắt đầu đăng ký tài khoản để học tập cùng trợ lý AI" 
                  : "Vui lòng đăng nhập để tiếp tục học tập"}
            </p>
          </div>

          {/* Form Body */}
          <div className="flex-grow">
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
                  <FloatingInput
                    id="forgot-email"
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
                    placeholder="Địa chỉ Email"
                    icon={<Mail className="w-4 h-4" />}
                    error={errors.email}
                  />
                  
                  <button 
                    type="submit" 
                    disabled={!emailRegex.test(email)}
                    className={`w-full py-3.5 mt-2 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md ${!emailRegex.test(email) ? 'bg-[#0D2B24]/40 cursor-not-allowed' : 'bg-[#00c495] hover:bg-[#00b085] active:scale-[0.98]'}`}
                  >
                    Gửi yêu cầu khôi phục
                  </button>
                  
                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setIsForgotPasswordMode(false)} className="text-xs font-bold text-[#00c495] hover:underline transition-colors focus:outline-none">
                      Quay lại Đăng nhập
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="auth-container" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {isRegisterMode && (
                      <div className="space-y-4">
                        {/* Name Input */}
                        <FloatingInput
                          id="register-name"
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if(errors.name) setErrors({...errors, name: ''});
                          }}
                          onBlur={(e) => handleBlur('name', e.target.value)}
                          placeholder="Tên người dùng"
                          icon={<User className="w-4 h-4" />}
                          error={errors.name}
                        />

                        {/* Phone Input */}
                        <FloatingInput
                          id="register-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if(errors.phone) setErrors({...errors, phone: ''});
                          }}
                          onBlur={(e) => handleBlur('phone', e.target.value)}
                          placeholder="Số điện thoại"
                          icon={<Phone className="w-4 h-4" />}
                          error={errors.phone}
                        />
                      </div>
                    )}

                    {/* Email Input */}
                    <FloatingInput
                      id="login-email"
                      type={isRegisterMode ? "email" : "text"}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if(errors.email) setErrors({...errors, email: ''});
                      }}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      placeholder={isRegisterMode ? "Địa chỉ Email" : "Email hoặc Tên đăng nhập"}
                      icon={<Mail className="w-4 h-4" />}
                      error={errors.email}
                    />

                    {/* Password Input */}
                    <FloatingInput
                      id="login-password"
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if(errors.password) setErrors({...errors, password: ''});
                      }}
                      placeholder="Mật khẩu"
                      icon={<Lock className="w-4 h-4" />}
                      error={errors.password}
                      rightElement={
                        <button 
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        >
                          {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    {/* Forgot password placement */}
                    {!isRegisterMode && (
                      <div className="flex justify-end pt-1">
                        <button 
                          type="button" 
                          onClick={() => setIsForgotPasswordMode(true)} 
                          className="text-xs font-semibold text-[#00c495] hover:underline transition-colors focus:outline-none"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    )}

                    {/* Password requirements block (Sign Up only) */}
                    {isRegisterMode && (
                      <div className="space-y-4 pt-1">
                        {/* Password Requirements Indicator */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pl-1 mt-1">
                          <div className="flex items-center gap-1.5 w-[45%]">
                            {password ? (
                              hasLetter ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            ) : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                            <span className={`text-[10px] leading-tight ${password && hasLetter ? 'text-emerald-600 font-semibold' : password && !hasLetter ? 'text-rose-600' : 'text-gray-400'}`}>Có chữ cái</span>
                          </div>
                          <div className="flex items-center gap-1.5 w-[45%]">
                            {password ? (
                              isLongEnough ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            ) : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                            <span className={`text-[10px] leading-tight ${password && isLongEnough ? 'text-emerald-600 font-semibold' : password && !isLongEnough ? 'text-rose-600' : 'text-gray-400'}`}>Tối thiểu 10 ký tự</span>
                          </div>
                          <div className="flex items-center gap-1.5 w-full">
                            {password ? (
                              hasNumberOrSymbol ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            ) : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                            <span className={`text-[10px] leading-tight ${password && hasNumberOrSymbol ? 'text-emerald-600 font-semibold' : password && !hasNumberOrSymbol ? 'text-rose-600' : 'text-gray-400'}`}>Có chữ số hoặc ký tự đặc biệt</span>
                          </div>
                        </div>

                        {/* Confirm Password Input */}
                        <FloatingInput
                          id="register-confirm-password"
                          type={confirmPasswordVisible ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if(errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                          }}
                          placeholder="Xác nhận mật khẩu"
                          icon={<Lock className="w-4 h-4" />}
                          error={errors.confirmPassword}
                          rightElement={
                            <div className="flex items-center gap-2">
                              {confirmPassword && confirmPassword === password && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              )}
                              <button 
                                type="button"
                                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                              >
                                {confirmPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          }
                        />

                        {/* Recaptcha Mock Widget */}
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl mt-4">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              id="recaptcha-mock"
                              className="w-5 h-5 text-[#00c495] border-gray-300 rounded focus:ring-[#00c495] cursor-pointer"
                              checked={isRobotChecked}
                              onChange={(e) => setIsRobotChecked(e.target.checked)}
                            />
                            <label htmlFor="recaptcha-mock" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">
                              Tôi không phải là robot
                            </label>
                          </div>
                          <div className="flex flex-col items-center select-none">
                            <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" alt="recaptcha" className="w-5 h-5 opacity-60" />
                            <span className="text-[8px] text-gray-400 mt-0.5">Bảo mật</span>
                          </div>
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-2.5 pl-0.5">
                          <input 
                            type="checkbox" 
                            id="terms-checkbox"
                            className="w-4 h-4 mt-0.5 text-[#00c495] border-gray-300 rounded focus:ring-[#00c495] cursor-pointer"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                          />
                          <label htmlFor="terms-checkbox" className="text-[11px] text-gray-500 leading-tight select-none cursor-pointer">
                            Tôi đồng ý với <span className="text-[#00c495] hover:underline font-medium cursor-pointer">Điều khoản dịch vụ</span> & <span className="text-[#00c495] hover:underline font-medium cursor-pointer">Chính sách bảo mật</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      className="w-full py-3.5 mt-2 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md bg-[#00c495] hover:bg-[#00b085] active:scale-[0.98] focus:outline-none"
                    >
                      {isRegisterMode ? "Tạo Tài Khoản" : "Đăng Nhập"}
                    </button>
                  </form>

                  {/* Social Login Divider & Official Button */}
                  <div className="mt-6 flex-shrink-0">
                    <div className="relative flex items-center mb-4">
                      <div className="flex-grow border-t border-gray-100"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hoặc tiếp tục với</span>
                      <div className="flex-grow border-t border-gray-100"></div>
                    </div>
                    <div className="flex justify-center w-full">
                      <div id="googleSignInButton" className="w-full flex justify-center [&>div]:w-full overflow-hidden rounded-xl"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
