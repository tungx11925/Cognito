"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Brain,
  Shield,
  Palette,
  Globe,
  FileText,
  Lock,
  Volume2,
  Save,
  Check,
  KeyRound,
  FileCheck,
  ChevronRight,
  Sun,
  Moon,
  Laptop
} from "lucide-react";
import { useStudy } from "@/context/StudyContext";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import RegisterModal from "@/components/auth/RegisterModal";

/* ── UI Components matching profile design ───────────────────────────────────────── */
const Card = ({ children, className = "", isDark = false }: any) => {
  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 ${
      isDark 
        ? "bg-[#1e1e1e] border-gray-800 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.08)] hover:border-gray-700" 
        : "bg-white border-2 border-[#1a2e1c]/45 shadow-[4px_4px_0px_0px_rgba(26,46,28,0.16)] hover:shadow-[6px_6px_0px_0px_rgba(26,46,28,0.24)] hover:border-[#1a2e1c]/65"
    } overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

const Button = ({ children, onClick, type = "button", disabled = false, className = "", variant = "primary", isDark = false }: any) => {
  const base = "px-5 py-2.5 font-bold text-sm rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2";
  
  let style = "";
  if (variant === "primary") {
    style = isDark ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" : "bg-[#1a2e1c] hover:bg-[#2d5a3d] text-white shadow-md";
  } else if (variant === "outline") {
    style = isDark ? "border-2 border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent" : "border-2 border-[#1a2e1c]/30 text-[#1a2e1c] hover:bg-[#1a2e1c]/5 bg-transparent";
  } else {
    style = isDark ? "text-gray-400 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100";
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${style} ${className}`}>
      {children}
    </button>
  );
};

function CustomToggle({ value, onChange, isDark = false }: { value: boolean; onChange: () => void; isDark?: boolean }) {
  return (
    <button
      onClick={onChange}
      type="button"
      className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{ background: value ? (isDark ? "#10b981" : "#2d5a3d") : (isDark ? "#3f3f46" : "#c1bfa7") }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    updateProfile,
    toggleVerification,
    changePassword,
    triggerMessage,
    globalMessage
  } = useStudy();

  const [activeTab, setActiveTab] = useState("account");

  // System options state
  const [notifsDaily, setNotifsDaily] = useState(true);
  const [notifsStreak, setNotifsStreak] = useState(true);
  const [notifsAI, setNotifsAI] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [soundVolume, setSoundVolume] = useState(80);
  const [algorithmAI, setAlgorithmAI] = useState(true);
  const [algorithmAdaptive, setAlgorithmAdaptive] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  // Theme & Language settings (Persistent locally)
  const [theme, setTheme] = useState("light"); // light, dark, system
  const [language, setLanguage] = useState("vi"); // vi, en

  // Different Account fields from Profile page
  const [displayName, setDisplayName] = useState("");
  const [website, setWebsite] = useState("");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [bio, setBio] = useState("");
  const [privacySetting, setPrivacySetting] = useState("public");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "light";
    const savedLang = localStorage.getItem("app-lang") || "vi";
    setTheme(savedTheme);
    setLanguage(savedLang);

    const savedWebsite = localStorage.getItem("pref-website") || "";
    const savedTimezone = localStorage.getItem("pref-timezone") || "Asia/Ho_Chi_Minh";
    const savedBio = localStorage.getItem("pref-bio") || "";
    setWebsite(savedWebsite);
    setTimezone(savedTimezone);
    setBio(savedBio);
  }, []);

  // Load activeUser data when mounted
  useEffect(() => {
    if (activeUser) {
      setDisplayName(activeUser.name || "");
      setTwoFA(!!activeUser.is_verified);
      setPrivacySetting(activeUser.privacy_setting || "public");
    }
  }, [activeUser]);

  // Synchronize theme state to Document Class List for real-time dark/light display!
  const [isSystemDark, setIsSystemDark] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const isDarkActive = theme === "dark" || (theme === "system" && isSystemDark);

  const handleSaveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.length < 2) {
      triggerMessage(language === "vi" ? "Tên hiển thị tối thiểu phải có 2 ký tự" : "Display name must be at least 2 characters", "error");
      return;
    }
    setSavingProfile(true);
    try {
      // Save display name to database
      const success = await updateProfile({
        name: displayName,
        privacy_setting: privacySetting,
      });

      if (success) {
        // Save other non-profile fields to local storage preferences
        localStorage.setItem("pref-website", website);
        localStorage.setItem("pref-timezone", timezone);
        localStorage.setItem("pref-bio", bio);
        triggerMessage(
          language === "vi" ? "Cập nhật cấu hình tài khoản thành công!" : "Account settings updated successfully!",
          "success"
        );
      }
    } catch (err) {
      triggerMessage(language === "vi" ? "Lỗi khi lưu thông tin" : "Error saving account settings", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      triggerMessage(language === "vi" ? "Vui lòng nhập mật khẩu hiện tại" : "Please enter current password", "error");
      return;
    }
    if (newPassword.length < 10) {
      triggerMessage(language === "vi" ? "Mật khẩu mới phải có tối thiểu 10 ký tự" : "New password must be at least 10 characters", "error");
      return;
    }
    if (!/(?=.*[a-zA-Z])/.test(newPassword)) {
      triggerMessage(language === "vi" ? "Mật khẩu phải chứa ít nhất 1 chữ cái" : "Password must contain at least 1 letter", "error");
      return;
    }
    if (!/(?=.*[\d#?!&@$%*])/.test(newPassword)) {
      triggerMessage(language === "vi" ? "Mật khẩu phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt" : "Password must contain at least 1 number or special character", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerMessage(language === "vi" ? "Mật khẩu xác nhận không trùng khớp" : "Passwords do not match", "error");
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      // errors handled inside context triggerMessage
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    const newEnableState = !twoFA;
    setTwoFA(newEnableState); // optimistic update
    
    try {
      const success = await toggleVerification(newEnableState);
      if (!success) {
        setTwoFA(twoFA); // revert if failed
      }
    } catch (err) {
      setTwoFA(twoFA); // revert on error
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    const msgMap: Record<string, string> = {
      light: language === "vi" ? "Đã chuyển sang giao diện Sáng" : "Switched to Light Theme",
      dark: language === "vi" ? "Đã chuyển sang giao diện Tối" : "Switched to Dark Theme",
      system: language === "vi" ? "Đã thiết lập giao diện Hệ thống" : "Set theme to System preference"
    };
    const msg = msgMap[newTheme] || "Theme changed";
    triggerMessage(msg, "success");
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem("app-lang", newLang);
    triggerMessage(
      newLang === "vi" ? "Đã chuyển sang Tiếng Việt" : "Language switched to English",
      "success"
    );
  };

  // Translations dictionary
  const t = {
    vi: {
      settingsTitle: "Cài đặt hệ thống",
      settingsDesc: "Cấu hình tùy chọn tài khoản, các chế độ âm thanh, giao diện màu sắc và ngôn ngữ ứng dụng",
      tabAccount: "Tài khoản",
      tabNotifications: "Thông báo & Âm thanh",
      tabAppearance: "Giao diện & Ngôn ngữ",
      tabSecurity: "Bảo mật & Thuật toán",
      tabLegal: "Điều khoản dịch vụ",
      
      // Account
      accTitle: "Tùy chọn tài khoản",
      accDesc: "Quản lý hiển thị cộng đồng và các thông số cài đặt múi giờ",
      displayName: "Tên hiển thị công khai",
      website: "Trang web cá nhân",
      timezone: "Múi giờ hệ thống",
      bio: "Tiểu sử cá nhân (Bio)",
      bioPlaceholder: "Viết vài dòng giới thiệu về bản thân bạn...",
      saveAccount: "Lưu cấu hình",

      // Notifications
      notifTitle: "Thông báo & Âm thanh",
      notifDesc: "Quản lý cách ứng dụng tương tác với bạn qua các tin nhắn nhắc lịch học",
      notifDaily: "Nhắc nhở ôn tập hàng ngày",
      notifDailyDesc: "Hệ thống tự động nhắc lịch học khi có bộ thẻ flashcard đến hạn cần ôn tập.",
      notifStreak: "Cảnh báo bảo vệ chuỗi Streak",
      notifStreakDesc: "Thông báo sớm để duy trì chuỗi học tập liên tục trước khi kết thúc ngày.",
      notifAI: "Đề xuất thông minh từ AI",
      notifAIDesc: "Tự động phân tích kết quả học tập để gợi ý tài liệu phù hợp từ thư viện.",
      soundEffects: "Hiệu ứng âm thanh",
      soundEffectsDesc: "Phát âm thanh thông báo sinh động khi bạn ôn tập đúng hoặc đạt thành tích.",
      volume: "Âm lượng hiệu ứng",
      updateConfig: "Cập nhật cấu hình",

      // Appearance
      themeTitle: "Giao diện & Ngôn ngữ",
      themeDesc: "Thay đổi giao diện màu sắc chủ đạo và ngôn ngữ chính của ứng dụng",
      themeLabel: "Chủ đề hiển thị",
      themeLight: "Chế độ Sáng",
      themeDark: "Chế độ Tối",
      themeSystem: "Mặc định hệ thống",
      langLabel: "Ngôn ngữ chính",
      langVi: "Tiếng Việt (Vietnamese)",
      langEn: "English (United States)",

      // Security & Algorithm
      secTitle: "Thay đổi mật khẩu",
      secDesc: "Nên thiết lập mật khẩu mạnh chứa ký tự viết hoa và chữ số để bảo vệ tài khoản",
      currPass: "Mật khẩu hiện tại",
      newPass: "Mật khẩu mới",
      confirmPass: "Xác nhận mật khẩu mới",
      updatePass: "Cập nhật mật khẩu",
      twoFATitle: "Bảo mật hai lớp (2FA)",
      twoFADesc: "Yêu cầu mã xác thực gửi đến email cá nhân mỗi lần đăng nhập từ trình duyệt mới",
      twoFAEnable: "Bật xác thực bảo mật 2FA",
      twoFAWarning: "Khuyên dùng để bảo vệ tài toàn thông tin và lịch sử học tập an toàn tối đa.",
      srsTitle: "Thuật toán lặp lại ngắt quãng (SRS)",
      srsDesc: "Cấu hình thuật toán lập lịch thẻ ghi nhớ thích nghi",
      srsAI: "Lập lịch tự động tăng cường bởi AI",
      srsAIDesc: "Sử dụng trí tuệ nhân tạo để tính toán chu kỳ quên thích ứng cho từng thẻ học.",
      srsAdaptive: "Tự động thay đổi độ khó thẻ",
      srsAdaptiveDesc: "Tự động co giãn thời gian lặp lại dựa trên độ nhớ bài trong quá khứ.",

      // Legal
      legalTitle: "Điều khoản sử dụng & Chính sách bảo mật",
      legalDesc: "Các cam kết pháp lý về bảo mật và quyền sử dụng tài nguyên học tập trên hệ thống",
      legalFooter: "Cập nhật gần nhất: Phiên bản v2.4 (Tháng 6, năm 2026)",
    },
    en: {
      settingsTitle: "System Settings",
      settingsDesc: "Configure account preferences, notification sounds, color theme and application language",
      tabAccount: "Account Settings",
      tabNotifications: "Notifications & Audio",
      tabAppearance: "Theme & Language",
      tabSecurity: "Security & Algorithm",
      tabLegal: "Terms of Service",
      
      // Account
      accTitle: "Account Preferences",
      accDesc: "Manage your public profile settings and timezone configurations",
      displayName: "Display Name",
      website: "Personal Website",
      timezone: "Timezone",
      bio: "Personal Biography (Bio)",
      bioPlaceholder: "Write a brief description about yourself...",
      saveAccount: "Save Settings",

      // Notifications
      notifTitle: "Notifications & Audio",
      notifDesc: "Manage how the application interacts with you through study notifications",
      notifDaily: "Daily Study Reminders",
      notifDailyDesc: "Get automated study alerts when flashcard decks are due for review.",
      notifStreak: "Streak Protection Alerts",
      notifStreakDesc: "Early notifications to preserve your active daily learning streak.",
      notifAI: "Smart AI Recommendations",
      notifAIDesc: "Automatically analyze your progress to recommend library documents.",
      soundEffects: "Sound Effects",
      soundEffectsDesc: "Play audio notifications when answer is correct or achievements are unlocked.",
      volume: "Effect Volume",
      updateConfig: "Save Configuration",

      // Appearance
      themeTitle: "Theme & Language",
      themeDesc: "Customize the application visual theme and primary system language",
      themeLabel: "Theme Mode",
      themeLight: "Light Mode",
      themeDark: "Dark Mode",
      themeSystem: "System Default",
      langLabel: "Primary Language",
      langVi: "Tiếng Việt (Vietnamese)",
      langEn: "English (United States)",

      // Security & Algorithm
      secTitle: "Change Password",
      secDesc: "Set a strong password containing letters, numbers and uppercase letters to protect your account",
      currPass: "Current Password",
      newPass: "New Password",
      confirmPass: "Confirm New Password",
      updatePass: "Update Password",
      twoFATitle: "Two-Factor Authentication (2FA)",
      twoFADesc: "Require a verification code sent to your email on new browser logins",
      twoFAEnable: "Enable 2FA Security",
      twoFAWarning: "Highly recommended to protect your user data and study progress.",
      srsTitle: "Spaced Repetition System (SRS)",
      srsDesc: "Configure variables for the flashcard scheduling algorithm",
      srsAI: "AI-Enhanced Smart Scheduling",
      srsAIDesc: "Utilize machine learning model to calculate forgetting curve for each card.",
      srsAdaptive: "Adaptive Card Difficulty",
      srsAdaptiveDesc: "Dynamically adjust intervals based on historical memory strengths.",

      // Legal
      legalTitle: "Terms of Service & Privacy Policy",
      legalDesc: "Legal agreements on privacy rights and educational resource usage",
      legalFooter: "Last Updated: Version v2.4 (June, 2026)",
    }
  }[language] || {
    settingsTitle: "Cài đặt hệ thống",
    settingsDesc: "Cấu hình tùy chọn tài khoản, các chế độ âm thanh, giao diện màu sắc và ngôn ngữ ứng dụng",
    tabAccount: "Tài khoản",
    tabNotifications: "Thông báo & Âm thanh",
    tabAppearance: "Giao diện & Ngôn ngữ",
    tabSecurity: "Bảo mật & Thuật toán",
    tabLegal: "Điều khoản dịch vụ",
    accTitle: "Tùy chọn tài khoản",
    accDesc: "Quản lý hiển thị cộng đồng và các thông số cài đặt múi giờ",
    displayName: "Tên hiển thị công khai",
    website: "Trang web cá nhân",
    timezone: "Múi giờ hệ thống",
    bio: "Tiểu sử cá nhân (Bio)",
    bioPlaceholder: "Viết vài dòng giới thiệu về bản thân bạn...",
    saveAccount: "Lưu cấu hình",
    notifTitle: "Thông báo & Âm thanh",
    notifDesc: "Quản lý cách ứng dụng tương tác với bạn qua các tin nhắn nhắc lịch học",
    notifDaily: "Nhắc nhở ôn tập hàng ngày",
    notifDailyDesc: "Hệ thống tự động nhắc lịch học khi có bộ thẻ flashcard đến hạn cần ôn tập.",
    notifStreak: "Cảnh báo bảo vệ chuỗi Streak",
    notifStreakDesc: "Thông báo sớm để duy trì chuỗi học tập liên tục trước khi kết thúc ngày.",
    notifAI: "Đề xuất thông minh từ AI",
    notifAIDesc: "Tự động phân tích kết quả học tập để gợi ý tài liệu phù hợp từ thư viện.",
    soundEffects: "Hiệu ứng âm thanh",
    soundEffectsDesc: "Phát âm thanh thông báo sinh động khi bạn ôn tập đúng hoặc đạt thành tích.",
    volume: "Âm lượng hiệu ứng",
    updateConfig: "Cập nhật cấu hình",
    themeTitle: "Giao diện & Ngôn ngữ",
    themeDesc: "Thay đổi giao diện màu sắc chủ đạo và ngôn ngữ chính của ứng dụng",
    themeLabel: "Chủ đề hiển thị",
    themeLight: "Chế độ Sáng",
    themeDark: "Chế độ Tối",
    themeSystem: "Mặc định hệ thống",
    langLabel: "Ngôn ngữ chính",
    langVi: "Tiếng Việt (Vietnamese)",
    langEn: "English (United States)",
    secTitle: "Thay đổi mật khẩu",
    secDesc: "Nên thiết lập mật khẩu mạnh chứa ký tự viết hoa và chữ số để bảo vệ tài khoản",
    currPass: "Mật khẩu hiện tại",
    newPass: "Mật khẩu mới",
    confirmPass: "Xác nhận mật khẩu mới",
    updatePass: "Cập nhật mật khẩu",
    twoFATitle: "Bảo mật hai lớp (2FA)",
    twoFADesc: "Yêu cầu mã xác thực gửi đến email cá nhân mỗi lần đăng nhập từ trình duyệt mới",
    twoFAEnable: "Bật xác thực bảo mật 2FA",
    twoFAWarning: "Khuyên dùng để bảo vệ tài toàn thông tin và lịch sử học tập an toàn tối đa.",
    srsTitle: "Thuật toán lặp lại ngắt quãng (SRS)",
    srsDesc: "Cấu hình thuật toán lập lịch thẻ ghi nhớ thích nghi",
    srsAI: "Lập lịch tự động tăng cường bởi AI",
    srsAIDesc: "Sử dụng trí tuệ nhân tạo để tính toán chu kỳ quên thích ứng cho từng thẻ học.",
    srsAdaptive: "Tự động thay đổi độ khó thẻ",
    srsAdaptiveDesc: "Tự động co giãn thời gian lặp lại dựa trên độ nhớ bài trong quá khứ.",
    legalTitle: "Điều khoản sử dụng & Chính sách bảo mật",
    legalDesc: "Các cam kết pháp lý về bảo mật và quyền sử dụng tài nguyên học tập trên hệ thống",
    legalFooter: "Cập nhật gần nhất: Phiên bản v2.4 (Tháng 6, năm 2026)",
  };

  const tabs = [
    { id: "account", label: t.tabAccount, icon: User, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "notifications", label: t.tabNotifications, icon: Bell, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "appearance", label: t.tabAppearance, icon: Palette, color: "text-purple-500", bg: "bg-purple-50" },
    { id: "security", label: t.tabSecurity, icon: Shield, color: "text-emerald-500", bg: "bg-emerald-50" },
    { id: "legal", label: t.tabLegal, icon: FileText, color: "text-gray-500", bg: "bg-gray-100" },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-10 ${
      isDarkActive ? "bg-[#121212] text-gray-100" : "bg-[#ebe8e0] text-gray-900"
    }`} style={{ fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Toast Alert */}
      {globalMessage && globalMessage.text && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border ${
          globalMessage.type === 'success' 
            ? 'bg-white text-emerald-700 border-emerald-200' 
            : 'bg-white text-rose-700 border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span className="font-semibold text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* Standalone Landing Navbar */}
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-7 space-y-6">
        
        {/* Page Title Header Card */}
        <Card isDark={isDarkActive} className={`p-6 ${isDarkActive ? "bg-[#1e1e1e]" : "bg-white"}`}>
          <h1 className={`text-2xl font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.settingsTitle}</h1>
          <p className={`text-sm mt-1 ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.settingsDesc}</p>
        </Card>

        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Navigation Sidebar Card */}
          <Card isDark={isDarkActive} className={`w-full md:w-72 shrink-0 p-3 space-y-1 ${isDarkActive ? "bg-[#1e1e1e]" : "bg-white"}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-left font-bold text-sm ${
                    isActive
                      ? (isDarkActive ? "bg-emerald-600 text-white" : "bg-[#1a2e1c] text-white shadow-xs")
                      : (isDarkActive ? "text-gray-400 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-50 active:scale-[0.98]")
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-white/15" : (isDarkActive ? "bg-gray-800" : tab.bg)
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : (isDarkActive ? "text-gray-300" : tab.color)}`} />
                  </div>
                  <span className="flex-1">{tab.label}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isActive ? "text-white translate-x-0.5" : "text-gray-400"}`} />
                </button>
              );
            })}
          </Card>

          {/* Settings Detail Pane Card */}
          <div className="flex-1 w-full animate-fadeIn">
            <Card isDark={isDarkActive} className={`p-6 md:p-8 ${isDarkActive ? "bg-[#1e1e1e]" : "bg-white"}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* ── TAB: ACCOUNT (DIFFERENT FIELDS THAN PROFILE) ── */}
                  {activeTab === "account" && (
                    <form onSubmit={handleSaveAccountSettings} className="space-y-6">
                      <div>
                        <h2 className={`text-lg font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.accTitle}</h2>
                        <p className={`text-xs mt-0.5 ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.accDesc}</p>
                      </div>

                      {/* Display Info Summary */}
                      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
                        isDarkActive 
                          ? "bg-gray-800/40 border-gray-700" 
                          : "bg-gray-50 border-[#1a2e1c]/10"
                      }`}>
                        <div className="w-14 h-14 rounded-full bg-[#2d5a3d] flex items-center justify-center text-white text-xl font-bold">
                          {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>{displayName || "User"}</h3>
                          <p className={`text-xs ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{activeUser?.email || "No email"}</p>
                        </div>
                      </div>

                      {/* Unique Account Form Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.displayName}</label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                              isDarkActive 
                                ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                            }`}
                            placeholder="Alex Johnson"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.website}</label>
                          <input
                            type="text"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                              isDarkActive 
                                ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                            }`}
                            placeholder="https://example.com"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.timezone}</label>
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none ${
                              isDarkActive 
                                ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                            }`}
                          >
                            <option value="Asia/Ho_Chi_Minh">Indochina Time (Asia/Ho_Chi_Minh - UTC+07:00)</option>
                            <option value="Asia/Tokyo">Japan Standard Time (Asia/Tokyo - UTC+09:00)</option>
                            <option value="America/New_York">Eastern Standard Time (America/New_York - UTC-05:00)</option>
                            <option value="Europe/London">Greenwich Mean Time (Europe/London - UTC+00:00)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>
                            {language === "vi" ? "Chế độ riêng tư của hồ sơ" : "Profile Privacy Mode"}
                          </label>
                          <select
                            value={privacySetting}
                            onChange={(e) => setPrivacySetting(e.target.value)}
                            className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none ${
                              isDarkActive 
                                ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                            }`}
                          >
                            <option value="public">
                              {language === "vi" ? "Công khai (Ai cũng có thể xem hồ sơ, flashcards, tài liệu)" : "Public (Anyone can view profile, flashcards, documents)"}
                            </option>
                            <option value="friends">
                              {language === "vi" ? "Chỉ bạn bè học cùng (Chỉ những người đã kết bạn mới có thể xem)" : "Friends Only (Only connected friends can view)"}
                            </option>
                            <option value="private">
                              {language === "vi" ? "Riêng tư (Chỉ mình bạn xem được)" : "Private (Only you can view)"}
                            </option>
                          </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.bio}</label>
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none ${
                              isDarkActive 
                                ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                            }`}
                            placeholder={t.bioPlaceholder}
                          />
                        </div>
                      </div>

                      <div className={`pt-4 border-t flex justify-end ${isDarkActive ? "border-gray-800" : "border-gray-100"}`}>
                        <Button type="submit" disabled={savingProfile} isDark={isDarkActive}>
                          {savingProfile ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{t.saveAccount}</span>
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* ── TAB: NOTIFICATIONS ── */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className={`text-lg font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.notifTitle}</h2>
                        <p className={`text-xs mt-0.5 ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.notifDesc}</p>
                      </div>

                      <div className="space-y-4">
                        {[
                          {
                            state: notifsDaily,
                            setter: setNotifsDaily,
                            title: t.notifDaily,
                            desc: t.notifDailyDesc,
                          },
                          {
                            state: notifsStreak,
                            setter: setNotifsStreak,
                            title: t.notifStreak,
                            desc: t.notifStreakDesc,
                          },
                          {
                            state: notifsAI,
                            setter: setNotifsAI,
                            title: t.notifAI,
                            desc: t.notifAIDesc,
                          },
                        ].map((item, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                            isDarkActive 
                              ? "bg-gray-800/40 border-gray-800 hover:border-gray-700" 
                              : "bg-gray-50 border-gray-100 hover:border-gray-200"
                          }`}>
                            <div className="space-y-0.5 pr-4">
                              <p className={`text-sm font-bold ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>{item.title}</p>
                              <p className={`text-xs leading-normal ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{item.desc}</p>
                            </div>
                            <CustomToggle value={item.state} onChange={() => item.setter(!item.state)} isDark={isDarkActive} />
                          </div>
                        ))}
                      </div>

                      <div className={`pt-4 border-t space-y-4 ${isDarkActive ? "border-gray-800" : "border-gray-100"}`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className={`text-sm font-bold ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>{t.soundEffects}</p>
                            <p className={`text-xs ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.soundEffectsDesc}</p>
                          </div>
                          <CustomToggle value={soundEffects} onChange={() => setSoundEffects(!soundEffects)} isDark={isDarkActive} />
                        </div>

                        {soundEffects && (
                          <div className={`p-4 border rounded-xl space-y-2.5 ${
                            isDarkActive 
                              ? "bg-emerald-950/20 border-emerald-900/50" 
                              : "bg-[#fcf8ec] border-amber-200/50"
                          }`}>
                            <div className={`flex justify-between text-xs font-bold ${isDarkActive ? "text-emerald-400" : "text-amber-800"}`}>
                              <span className="flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5" /> {t.volume}
                              </span>
                              <span>{soundVolume}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={soundVolume}
                              onChange={(e) => setSoundVolume(Number(e.target.value))}
                              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-gray-300 dark:bg-gray-700"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <Button onClick={() => triggerMessage(language === "vi" ? "Đã lưu thiết lập thông báo!" : "Notification settings saved!", "success")} isDark={isDarkActive}>
                          <Save className="w-4 h-4" />
                          <span>{t.updateConfig}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: APPEARANCE (DARK MODE & ENGLISH WORKPLACE) ── */}
                  {activeTab === "appearance" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className={`text-lg font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.themeTitle}</h2>
                        <p className={`text-xs mt-0.5 ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.themeDesc}</p>
                      </div>

                      {/* Theme Selector */}
                      <div className="space-y-3">
                        <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.themeLabel}</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: "light", label: t.themeLight, icon: Sun, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
                            { id: "dark", label: t.themeDark, icon: Moon, color: "text-blue-400 bg-blue-950/30" },
                            { id: "system", label: t.themeSystem, icon: Laptop, color: "text-purple-400 bg-purple-950/30" },
                          ].map((tItem) => {
                            const isSelected = theme === tItem.id;
                            const IconComponent = tItem.icon;
                            return (
                              <button
                                key={tItem.id}
                                type="button"
                                onClick={() => handleThemeChange(tItem.id)}
                                className={`relative p-3.5 border-2 rounded-xl flex flex-col justify-between h-24 text-left transition-all duration-200 active:scale-[0.97] ${
                                  isSelected 
                                    ? (isDarkActive ? "border-emerald-500 bg-gray-800" : "border-[#2d5a3d] bg-[#f4f7f4]/40 shadow-xs") 
                                    : (isDarkActive ? "border-gray-800 hover:border-gray-700 bg-[#1a1a1a]" : "border-gray-200 hover:border-gray-300 bg-white")
                                }`}
                              >
                                <div className="w-full flex justify-between items-center">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tItem.color}`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <span className={`w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center ${
                                    isSelected ? (isDarkActive ? "bg-emerald-500 border-emerald-500" : "bg-[#2d5a3d] border-[#2d5a3d]") : "bg-transparent"
                                  }`}>
                                    {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </span>
                                </div>
                                <span className={`text-xs font-bold mt-auto ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>{tItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Language Selector */}
                      <div className={`pt-4 border-t space-y-3 ${isDarkActive ? "border-gray-800" : "border-gray-100"}`}>
                        <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.langLabel}</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "vi", label: t.langVi, flag: "🇻🇳" },
                            { id: "en", label: t.langEn, flag: "🇺🇸" },
                          ].map((lang) => {
                            const isSelected = language === lang.id;
                            return (
                              <button
                                key={lang.id}
                                type="button"
                                onClick={() => handleLanguageChange(lang.id)}
                                className={`p-4 border-2 rounded-xl flex items-center gap-3 text-left transition-all duration-200 active:scale-[0.97] ${
                                  isSelected 
                                    ? (isDarkActive ? "border-emerald-500 bg-gray-800 font-bold" : "border-[#2d5a3d] bg-[#f4f7f4] font-bold") 
                                    : (isDarkActive ? "border-gray-800 hover:border-gray-700 bg-[#1a1a1a]" : "border-gray-200 hover:border-gray-300 bg-white")
                                }`}
                              >
                                <span className="text-xl">{lang.flag}</span>
                                <div className="flex-1">
                                  <p className={`text-xs font-bold ${
                                    isSelected ? (isDarkActive ? "text-emerald-400" : "text-[#1a2e1c]") : "text-gray-400"
                                  }`}>{lang.label}</p>
                                </div>
                                {isSelected && <Check className={`w-4 h-4 shrink-0 ${isDarkActive ? "text-emerald-400" : "text-[#2d5a3d]"}`} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: SECURITY & SRS ALGORITHM ── */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      {/* Password reset form */}
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                          <h2 className={`text-lg font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.secTitle}</h2>
                          <p className={`text-xs mt-0.5 ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.secDesc}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.currPass}</label>
                            <input
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                                isDarkActive 
                                  ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                  : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                              }`}
                              placeholder="••••••••••"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.newPass}</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                                isDarkActive 
                                  ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                  : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                              }`}
                              placeholder="Min. 10 chars"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={`text-xs font-bold pl-0.5 ${isDarkActive ? "text-gray-300" : "text-gray-700"}`}>{t.confirmPass}</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={`w-full text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                                isDarkActive 
                                  ? "bg-gray-800 border-gray-700 text-white focus:border-emerald-500" 
                                  : "bg-gray-50 border-gray-200 text-gray-800 focus:border-[#2d5a3d]"
                              }`}
                              placeholder="Retype password"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button type="submit" variant="outline" disabled={updatingPassword} isDark={isDarkActive}>
                            {updatingPassword ? (
                              <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                            <span>{t.updatePass}</span>
                          </Button>
                        </div>
                      </form>

                      {/* 2-Factor Authentication */}
                      <div className={`pt-5 border-t space-y-4 ${isDarkActive ? "border-gray-800" : "border-gray-100"}`}>
                        <div>
                          <h2 className={`text-sm font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.twoFATitle}</h2>
                          <p className={`text-xs ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.twoFADesc}</p>
                        </div>

                        <div className={`flex items-center justify-between p-4 border-2 rounded-2xl ${
                          isDarkActive 
                            ? "bg-emerald-950/20 border-emerald-900/40" 
                            : "bg-[#eef8f0] border-[#2d5a3d]/20"
                        }`}>
                          <div className="space-y-0.5 pr-4">
                            <p className={`text-sm font-bold ${isDarkActive ? "text-emerald-400" : "text-[#1a2e1c]"}`}>{t.twoFAEnable}</p>
                            <p className={`text-xs font-medium ${isDarkActive ? "text-emerald-500" : "text-emerald-800"}`}>{t.twoFAWarning}</p>
                          </div>
                          <CustomToggle
                            value={twoFA}
                            onChange={handleToggle2FA}
                            isDark={isDarkActive}
                          />
                        </div>
                      </div>

                      {/* SRS Algorithm settings */}
                      <div className={`pt-5 border-t space-y-4 ${isDarkActive ? "border-gray-800" : "border-gray-100"}`}>
                        <div>
                          <h2 className={`text-sm font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.srsTitle}</h2>
                          <p className={`text-xs ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.srsDesc}</p>
                        </div>

                        <div className="space-y-3">
                          {[
                            {
                              state: algorithmAI,
                              setter: setAlgorithmAI,
                              title: t.srsAI,
                              desc: t.srsAIDesc,
                            },
                            {
                              state: algorithmAdaptive,
                              setter: setAlgorithmAdaptive,
                              title: t.srsAdaptive,
                              desc: t.srsAdaptiveDesc,
                            },
                          ].map((algo, index) => (
                            <div key={index} className={`flex items-center justify-between p-4 border rounded-2xl ${
                              isDarkActive 
                                ? "bg-gray-800/40 border-gray-800 hover:border-gray-700" 
                                : "bg-gray-50 border-gray-100 hover:border-gray-200"
                            }`}>
                              <div className="space-y-0.5 pr-4">
                                <p className={`text-sm font-bold ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>{algo.title}</p>
                                <p className={`text-xs ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{algo.desc}</p>
                              </div>
                              <CustomToggle value={algo.state} onChange={() => algo.setter(!algo.state)} isDark={isDarkActive} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: TERMS & PRIVACY LEGAL ── */}
                  {activeTab === "legal" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className={`text-lg font-bold ${isDarkActive ? "text-white" : "text-gray-900"}`}>{t.legalTitle}</h2>
                        <p className={`text-xs ${isDarkActive ? "text-gray-400" : "text-gray-400"}`}>{t.legalDesc}</p>
                      </div>

                      {/* Term details */}
                      <div className={`h-64 overflow-y-auto p-4 border rounded-2xl text-xs space-y-4 scrollbar-thin scrollbar-thumb-gray-200 leading-relaxed text-justify ${
                        isDarkActive 
                          ? "bg-gray-800/40 border-gray-800 text-gray-400" 
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}>
                        {language === "vi" ? (
                          <>
                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>1. Quyền sở hữu trí tuệ</h3>
                              <p>
                                Toàn bộ nội dung ứng dụng, bao gồm nhưng không giới hạn ở: giao diện hiển thị, thiết kế, mã nguồn thuật toán ôn tập, hệ thống trợ lý AI, hình ảnh, tài nguyên giảng dạy và biểu tượng đều là tài sản hợp pháp của EduShare AI. Người dùng tuyệt đối không được tự ý thương mại hóa, giải mã hoặc can thiệp bất hợp pháp vào hệ thống dưới mọi hình thức.
                              </p>
                            </div>

                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>2. Bảo vệ thông tin và mật khẩu tài khoản</h3>
                              <p>
                                Mỗi cá nhân tự chịu trách nhiệm bảo vệ mật khẩu đăng nhập của mình. Để nâng cao tính an toàn thông tin, hệ thống khuyến cáo người dùng chủ động kích hoạt chế độ Xác thực 2 lớp (2FA) trong phần cài đặt bảo mật. Chúng tôi không giải quyết các khiếu nại mất mát tài khoản xuất phát từ sơ suất tiết lộ thông tin của người dùng.
                              </p>
                            </div>

                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>3. Lưu trữ và phân tích dữ liệu học tập</h3>
                              <p>
                                Nhằm hoàn thiện giải thuật lập lịch và đề xuất thông minh hơn, hệ thống tiến hành thu thập lịch sử học tập, phản hồi Flashcard và thời gian làm bài của bạn trên server. Các dữ liệu này được mã hóa truyền tải an toàn SSL và chỉ dùng để cải tiến các tính năng học máy tương quan.
                              </p>
                            </div>

                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>4. Điều chỉnh và cập nhật thỏa thuận sử dụng</h3>
                              <p>
                                Chúng tôi giữ quyền được sửa đổi, bổ sung hoặc chấm dứt một số dịch vụ miễn phí mà không cần gửi email thông báo trước. Các nội dung cập nhật sẽ luôn được hiển thị chính xác và chính thức tại mục này. Việc bạn tiếp tục tham gia học tập đồng nghĩa với đồng ý với các thỏa thuận mới.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>1. Intellectual Property Rights</h3>
                              <p>
                                All application content, including display layout, designs, review algorithms, AI assistant systems, images, and educational materials are the legal property of EduShare AI. Users are strictly prohibited from copying, commercializing, or decompiling the source code in any manner.
                              </p>
                            </div>

                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>2. Account Security & Protection</h3>
                              <p>
                                Every user is responsible for protecting their password credentials. We strongly advise users to enable Two-Factor Authentication (2FA) in the security tab. EduShare AI will not be held liable for any data loss resulting from user negligence in securing account credentials.
                              </p>
                            </div>

                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>3. Study Data Collection</h3>
                              <p>
                                To optimize card scheduling and recommendation models, we store card response history and active learning time on our servers. All information is securely encrypted (SSL) and used solely for the improvement of learning algorithms.
                              </p>
                            </div>

                            <div>
                              <h3 className={`font-bold text-sm mb-1 ${isDarkActive ? "text-gray-200" : "text-gray-800"}`}>4. Agreement Modifications</h3>
                              <p>
                                We reserve the right to upgrade, modify, or terminate free services without prior notice. Terms changes will be posted here. Continued use of the application signifies your agreement to the updated terms.
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 p-3.5 border rounded-xl text-xs font-bold ${
                        isDarkActive 
                          ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-400" 
                          : "bg-emerald-50 border-emerald-200/50 text-emerald-800"
                      }`}>
                        <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{t.legalFooter}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>

      {/* Login Modal for guest user */}
      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            triggerMessage={triggerMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
