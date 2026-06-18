'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Circle, X, GraduationCap, Hourglass } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { useRouter } from 'next/navigation';
import { googleLogin } from '../../services/auth.service';
import Lottie from 'lottie-react';
import loginAnimation from './login-animation.json';
import registerAnimation from './register-animation.json';

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
  isValid?: boolean;
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
  isValid,
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
          style={{ fontFamily: "'Outfit', sans-serif" }}
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
          className={`w-full pl-11 pr-12 py-3 bg-transparent border ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : isValid
              ? 'border-[#00c495] ring-1 ring-[#00c495]'
              : isFocused
              ? 'border-[#00c495] ring-1 ring-[#00c495]'
              : 'border-gray-200 hover:border-gray-300'
          } rounded-xl text-sm text-gray-800 focus:outline-none transition-all placeholder:text-transparent`}
          style={{ fontFamily: "'Outfit', sans-serif" }}
        />

        {/* Right Element & Validation Icons */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2">
          {rightElement}
          {error && <XCircle className="w-5 h-5 text-red-500" />}
          {isValid && !error && <CheckCircle2 className="w-5 h-5 text-[#00c495]" />}
        </div>
      </div>
      {error && <p className="text-[12px] text-red-500 pl-1 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default function RegisterModal({ isOpen, onClose, triggerMessage }: RegisterModalProps) {
  const router = useRouter();
  const { login: contextLogin, register: contextRegister, setActiveUser, setIsAuthenticated, verify2FA } = useStudy();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
  const [touched, setTouched] = useState({ name: false, phone: false, email: false, password: false, confirmPassword: false });

  // Custom states for styling compliance
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [isTwoFAMode, setIsTwoFAMode] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

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
  const handleGoogleCredentialResponse = useCallback(async (response: any) => {
    try {
      const googleToken = response.credential;
      const res = await googleLogin(googleToken);
      if (res && res.user) {
        localStorage.setItem('token', res.token);
        setActiveUser(res.user);
        setIsAuthenticated(true);
        onClose();
        triggerMessage("Đăng nhập bằng Google thành công!", "success");
        router.push('/home');
      } else {
        triggerMessage(res.error || "Không thể đăng nhập bằng Google", "error");
      }
    } catch (err: any) {
      triggerMessage("Lỗi kết nối khi đăng nhập Google", "error");
    }
  }, [setActiveUser, setIsAuthenticated, onClose, triggerMessage, router]);

  // Google Sign-In Callback Ref
  const googleButtonRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    
    const initGoogleButton = () => {
      if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
        (window as any).google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        
        (window as any).google.accounts.id.renderButton(
          node,
          { theme: "outline", size: "large", width: "100%", shape: "rectangular" }
        );
      } else {
        setTimeout(initGoogleButton, 100);
      }
    };
    
    initGoogleButton();
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (!isOpen) {
      setIsTwoFAMode(false);
      setTwoFACode('');
      setTwoFAError('');
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

  const validateField = async (field: string, val: string, currentData: any) => {
    let errorMsg = '';
    
    switch (field) {
      case 'name':
        if (!val.trim()) {
          errorMsg = 'Họ và tên không được để trống';
        } else if (/[0-9!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]/.test(val)) {
          errorMsg = 'Họ và tên không được chứa số hoặc ký tự đặc biệt';
        }
        break;
      case 'email':
        if (!emailRegex.test(val)) {
          errorMsg = 'Email không hợp lệ';
        } else {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/check-availability`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ field, value: val })
            });
            if (res.ok) {
              const data = await res.json();
              if (!data.isAvailable) errorMsg = 'Email này đã được sử dụng';
            }
          } catch (e) {}
        }
        break;
      case 'phone':
        if (!phoneRegex.test(val)) {
          errorMsg = 'Số điện thoại phải đủ 10 số và bắt đầu bằng số 0';
        } else {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/check-availability`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ field, value: val })
            });
            if (res.ok) {
              const data = await res.json();
              if (!data.isAvailable) errorMsg = 'Số điện thoại đã tồn tại';
            }
          } catch (e) {}
        }
        break;
      case 'password':
        if (!passwordRegex.test(val)) {
          errorMsg = 'Mật khẩu tối thiểu 8 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 số';
        }
        break;
      case 'confirmPassword':
        if (!val) {
          errorMsg = 'Vui lòng xác nhận mật khẩu';
        } else if (val !== currentData.password) {
          errorMsg = 'Mật khẩu xác nhận không trùng khớp';
        }
        break;
    }
    return errorMsg;
  };

  const handleRealtimeChange = async (field: string, val: string) => {
    if (field === 'name') setName(val);
    else if (field === 'phone') setPhone(val);
    else if (field === 'email') setEmail(val);
    else if (field === 'password') setPassword(val);
    else if (field === 'confirmPassword') setConfirmPassword(val);

    const currentData = {
      name: field === 'name' ? val : name,
      phone: field === 'phone' ? val : phone,
      email: field === 'email' ? val : email,
      password: field === 'password' ? val : password,
      confirmPassword: field === 'confirmPassword' ? val : confirmPassword,
    };

    if (isRegisterMode && touched[field as keyof typeof touched]) {
      const errorMsg = await validateField(field, val, currentData);
      setErrors(prev => ({ ...prev, [field]: errorMsg }));
      
      if (field === 'password' && touched.confirmPassword) {
         const confirmError = await validateField('confirmPassword', currentData.confirmPassword, currentData);
         setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    } else if (!isRegisterMode) {
      if (errors[field as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const handleBlurValidation = async (field: string, val: string) => {
    if (!isRegisterMode) return;
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const currentData = { name, phone, email, password, confirmPassword };
    const errorMsg = await validateField(field, val, currentData);
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
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
        setTouched({name:false, phone:false, email:false, password:false, confirmPassword:false});
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
      const result = await contextLogin(email, password);
      if (result.success) {
        if (result.requires2FA) {
          setTwoFAEmail(result.email || email);
          setIsTwoFAMode(true);
        } else {
          onClose();
          router.push('/home');
        }
      }
    }
  };

  const handleTwoFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFACode.trim().length !== 6) {
      setTwoFAError("Mã xác thực phải gồm 6 chữ số");
      return;
    }
    const success = await verify2FA(twoFAEmail, twoFACode);
    if (success) {
      onClose();
      router.push('/home');
    } else {
      setTwoFAError("Mã xác thực không chính xác hoặc đã hết hạn");
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

          {/* Lottie Animation replacing Layered Paper Elements */}
          <div className="absolute inset-x-0 bottom-0 top-[200px] flex items-center justify-center pointer-events-none overflow-hidden p-6 z-10">
            <AnimatePresence mode="wait">
              {isMounted && (
                <motion.div
                  key={isRegisterMode ? 'register' : 'login'}
                  initial={{ opacity: 0, scale: 0.9, x: isRegisterMode ? 15 : -15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: isRegisterMode ? -15 : 15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <Lottie 
                    animationData={isRegisterMode ? registerAnimation : loginAnimation} 
                    loop={true} 
                    className="w-full h-full max-w-[320px] max-h-[320px] object-contain"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Branding Content */}
          <div className="relative z-30 flex flex-col pt-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-5">
              <GraduationCap className="w-6 h-6 text-[#00c495]" />
            </div>
            <h2 
              className="text-3xl font-extrabold text-white mb-3 leading-none tracking-tight"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
            >
              EduShare <span className="text-[#00c495] font-sans font-black tracking-widest text-2xl relative -top-0.5 ml-1">AI</span>
            </h2>
            <div className="h-[48px] relative w-full">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={isRegisterMode ? 'register-desc' : 'login-desc'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 text-xs text-gray-300/95 leading-relaxed max-w-[85%] font-light" 
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {isRegisterMode 
                    ? "Đăng ký để mở khóa các bài ôn tập thông minh bằng Flashcards và chat cùng trợ lý tài liệu AI."
                    : "Chào mừng quay trở lại. Hãy tiếp tục tiến trình nghiên cứu học thuật của bạn cùng Trợ lý."}
                </motion.p>
              </AnimatePresence>
            </div>
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

          {/* Navigation Tabs (Only visible when not resetting password and not in 2FA mode) */}
          {!isForgotPasswordMode && !isTwoFAMode && (
            <div className="flex gap-6 border-b border-gray-100 mb-6 flex-shrink-0">
              <button 
                type="button"
                onClick={() => { setIsRegisterMode(false); setIsForgotPasswordMode(false); setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''}); setTouched({name:false, phone:false, email:false, password:false, confirmPassword:false}); }}
                className={`pb-3 text-sm font-bold transition-all relative focus:outline-none ${!isRegisterMode ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Đăng Nhập
                {!isRegisterMode && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00c495] rounded-full" />
                )}
              </button>
              <button 
                type="button"
                onClick={() => { setIsRegisterMode(true); setIsForgotPasswordMode(false); setErrors({name:'', phone:'', email:'', password:'', confirmPassword:''}); setTouched({name:false, phone:false, email:false, password:false, confirmPassword:false}); }}
                className={`pb-3 text-sm font-bold transition-all relative focus:outline-none ${isRegisterMode ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
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
            <h1 
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {isForgotPasswordMode 
                ? "Khôi phục mật khẩu" 
                : isTwoFAMode
                  ? "Xác thực hai lớp (2FA)"
                  : isRegisterMode 
                    ? "Đăng ký tài khoản" 
                    : "Chào mừng quay trở lại"}
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {isForgotPasswordMode 
                ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu" 
                : isTwoFAMode
                  ? "Nhập mã xác thực để đăng nhập tài khoản của bạn"
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
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Gửi yêu cầu khôi phục
                  </button>
                  
                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPasswordMode(false)} 
                      className="text-xs font-bold text-[#00c495] hover:underline transition-colors focus:outline-none"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                </motion.form>
              ) : isTwoFAMode ? (
                <motion.form 
                  key="2fa-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleTwoFASubmit} 
                  className="space-y-4"
                >
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 mb-2">
                    <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">Mã xác thực đã được gửi</h4>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                        Chúng tôi đã gửi một mã xác thực 6 chữ số đến địa chỉ email <span className="font-bold">{twoFAEmail}</span>. Vui lòng kiểm tra hộp thư của bạn.
                      </p>
                    </div>
                  </div>

                  <FloatingInput
                    id="twofa-code"
                    type="text"
                    value={twoFACode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTwoFACode(val);
                      if (twoFAError) setTwoFAError('');
                    }}
                    placeholder="Mã xác thực (6 chữ số)"
                    icon={<Lock className="w-4 h-4" />}
                    error={twoFAError}
                  />
                  
                  <button 
                    type="submit" 
                    disabled={twoFACode.length !== 6}
                    className={`w-full py-3.5 mt-2 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md ${twoFACode.length !== 6 ? 'bg-[#0D2B24]/40 cursor-not-allowed' : 'bg-[#00c495] hover:bg-[#00b085] active:scale-[0.98]'}`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Xác thực & Đăng nhập
                  </button>
                  
                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsTwoFAMode(false);
                        setTwoFACode('');
                        setTwoFAError('');
                      }} 
                      className="text-xs font-bold text-[#00c495] hover:underline transition-colors focus:outline-none"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key={isRegisterMode ? "register-container" : "login-container"} 
                  initial={{ opacity: 0, x: isRegisterMode ? 15 : -15 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: isRegisterMode ? -15 : 15 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {isRegisterMode && (
                      <div className="space-y-4">
                        {/* Name Input */}
                        <FloatingInput
                          id="register-name"
                          type="text"
                          value={name}
                          onChange={(e) => handleRealtimeChange('name', e.target.value)}
                          onBlur={(e) => handleBlurValidation('name', e.target.value)}
                          placeholder="Tên người dùng"
                          icon={<User className="w-4 h-4" />}
                          error={errors.name}
                          isValid={isRegisterMode && touched.name && !errors.name && name.length > 0}
                        />

                        {/* Phone Input */}
                        <FloatingInput
                          id="register-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => handleRealtimeChange('phone', e.target.value)}
                          onBlur={(e) => handleBlurValidation('phone', e.target.value)}
                          placeholder="Số điện thoại"
                          icon={<Phone className="w-4 h-4" />}
                          error={errors.phone}
                          isValid={isRegisterMode && touched.phone && !errors.phone && phone.length > 0}
                        />
                      </div>
                    )}

                    {/* Email Input */}
                    <FloatingInput
                      id="login-email"
                      type={isRegisterMode ? "email" : "text"}
                      value={email}
                      onChange={(e) => handleRealtimeChange('email', e.target.value)}
                      onBlur={(e) => handleBlurValidation('email', e.target.value)}
                      placeholder={isRegisterMode ? "Địa chỉ Email" : "Email hoặc Tên đăng nhập"}
                      icon={<Mail className="w-4 h-4" />}
                      error={errors.email}
                      isValid={isRegisterMode && touched.email && !errors.email && email.length > 0}
                    />

                    {/* Password Input */}
                    <FloatingInput
                      id="login-password"
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleRealtimeChange('password', e.target.value)}
                      onBlur={(e) => handleBlurValidation('password', e.target.value)}
                      placeholder="Mật khẩu"
                      icon={<Lock className="w-4 h-4" />}
                      error={errors.password}
                      isValid={isRegisterMode && touched.password && !errors.password && password.length > 0}
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
                          style={{ fontFamily: "'Outfit', sans-serif" }}
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                    )}

                    {/* Password requirements block (Sign Up only) */}
                    {isRegisterMode && (
                      <div className="space-y-4 pt-1">
                        {/* Password Requirements Indicator */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 pl-1 mt-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
                          onChange={(e) => handleRealtimeChange('confirmPassword', e.target.value)}
                          onBlur={(e) => handleBlurValidation('confirmPassword', e.target.value)}
                          placeholder="Xác nhận mật khẩu"
                          icon={<Lock className="w-4 h-4" />}
                          error={errors.confirmPassword}
                          isValid={isRegisterMode && touched.confirmPassword && !errors.confirmPassword && confirmPassword.length > 0}
                          rightElement={
                            <div className="flex items-center gap-2">
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
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl mt-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
                          <label htmlFor="terms-checkbox" className="text-[11px] text-gray-500 leading-tight select-none cursor-pointer" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            Tôi đồng ý với <span className="text-[#00c495] hover:underline font-medium cursor-pointer">Điều khoản dịch vụ</span> & <span className="text-[#00c495] hover:underline font-medium cursor-pointer">Chính sách bảo mật</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      className="w-full py-3.5 mt-2 text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md bg-[#00c495] hover:bg-[#00b085] active:scale-[0.98] focus:outline-none"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
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
                    <div className="flex gap-3 w-full justify-between">
                      {/* Google Sign-In Container */}
                      <div className="w-1/2 flex justify-center [&>div]:w-full overflow-hidden rounded-xl">
                        <div ref={googleButtonRef} className="w-full"></div>
                      </div>
                      
                      {/* Roblox Decorative Button */}
                      <button
                        type="button"
                        onClick={() => triggerMessage("Đăng nhập bằng Roblox thành công (chỉ mang tính trang trí)!", "success")}
                        className="w-1/2 h-[40px] flex items-center justify-center gap-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 active:scale-[0.98] transition-all duration-300 font-bold text-xs text-gray-700 shadow-sm"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#E1251B]" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4.865 2.115L21.885 5.135L19.135 21.885L2.115 18.865L4.865 2.115ZM10.59 9.175L9.175 14.865L14.865 16.28L16.28 10.59L10.59 9.175Z" />
                        </svg>
                        <span>Roblox</span>
                      </button>
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
