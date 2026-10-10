"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  LogOut,
  Layout,
  Trophy,
  Sparkles,
  Shield,
  FileQuestion,
  Crown,
  CheckCheck,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  Heart,
  AlertTriangle,
  ShieldAlert,
  BookOpen,
  FileText,
  Network,
  Layers,
  Clock,
  Home,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useStudy } from "@/context/StudyContext";
import { getUnreadCount } from "@/services/message.service";
import { NotificationItem } from "@/services/notification.service";
import { getValidToken } from "@/services/api";
import { siteConfig } from "@/config/site.config";

function formatRelativeTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Vừa xong";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  } catch {
    return "Gần đây";
  }
}

const getNavItemClass = (isActive: boolean) =>
  `group transition-all duration-150 text-xs xl:text-sm font-semibold flex items-center gap-1.5 shrink-0 whitespace-nowrap px-2.5 xl:px-3 py-1.5 rounded-xl ${
    isActive
      ? "font-bold text-[#1a3d28] dark:text-emerald-300 bg-[#1a3d28]/10 dark:bg-emerald-950/50 border border-[#1a3d28]/15 dark:border-emerald-700/30 shadow-xs"
      : "text-stone-600 dark:text-zinc-400 hover:text-[#1a3d28] dark:hover:text-emerald-300 hover:bg-[#1a3d28]/6 dark:hover:bg-emerald-950/30 border border-transparent"
  }`;

const getNavIconClass = (isActive: boolean) =>
  `shrink-0 transition-colors duration-150 ${
    isActive
      ? "text-[#1a3d28] dark:text-emerald-300"
      : "text-stone-400 dark:text-zinc-500 group-hover:text-[#1a3d28] dark:group-hover:text-emerald-300"
  }`;

interface NavbarProps {
  isLoggedIn: boolean;
  onSignInClick: () => void;
  onDashboardClick: () => void;
  activeUser: any;
}

export function Navbar({ isLoggedIn, onSignInClick, onDashboardClick, activeUser }: NavbarProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [mobileLearningOpen, setMobileLearningOpen] = useState(true);
  
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const {
    logout,
    taskCompletionToast,
    setTaskCompletionToast,
    setShowPremiumModal,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStudy();
  const [toastProgress, setToastProgress] = useState(60);
  const [showToast, setShowToast] = useState(false);

  const unreadCount = unreadNotificationCount;
  const [messageUnreadCount, setMessageUnreadCount] = useState<number>(0);

  const isMyLearningActive = 
    pathname === '/library' ||
    pathname?.startsWith('/quiz') ||
    pathname === '/ai-test' ||
    pathname === '/notes' ||
    pathname === '/mindmap' ||
    pathname?.startsWith('/flashcards') ||
    pathname === '/study-sessions';

  const myLearningItems = [
    {
      title: "Tài liệu",
      enTitle: "Documents",
      desc: "Kho tài liệu, sách giáo trình & tài liệu tải lên",
      href: "/library",
      icon: BookOpen,
      iconColor: "text-emerald-700 bg-emerald-50 border-emerald-200/60",
    },
    {
      title: "Đề thi & Trắc nghiệm",
      enTitle: "Quizzes",
      desc: "Luyện đề trắc nghiệm, bài tập tự động chấm điểm",
      href: "/ai-test",
      icon: FileQuestion,
      iconColor: "text-purple-700 bg-purple-50 border-purple-200/60",
    },
    {
      title: "Ghi chú",
      enTitle: "Notes",
      desc: "Sổ tay ghi chú kiến thức và tra cứu bài học",
      href: "/notes",
      icon: FileText,
      iconColor: "text-blue-700 bg-blue-50 border-blue-200/60",
    },
    {
      title: "Sơ đồ tư duy",
      enTitle: "Mindmaps",
      desc: "Phác thảo và trực quan hóa kiến thức tư duy",
      href: "/mindmap",
      icon: Network,
      iconColor: "text-indigo-700 bg-indigo-50 border-indigo-200/60",
    },
    {
      title: "Flashcards",
      enTitle: "Flashcards",
      desc: "Học ghi nhớ ngắt quãng theo thuật toán SM-2",
      href: "/flashcards",
      icon: Layers,
      iconColor: "text-amber-700 bg-amber-50 border-amber-200/60",
    },
    {
      title: "Lịch sử học",
      enTitle: "History",
      desc: "Tổng hợp không gian học và phiên học tập",
      href: "/study-sessions",
      icon: Clock,
      iconColor: "text-teal-700 bg-teal-50 border-teal-200/60",
    },
  ];

  // Poll & listen to real-time events for unread messages (multiplexed from SSE)
  useEffect(() => {
    if (!isLoggedIn || !activeUser) {
      setMessageUnreadCount(0);
      return;
    }
    const fetchUnread = () => {
      const token = getValidToken();
      if (!token) {
        setMessageUnreadCount(0);
        return;
      }
      getUnreadCount()
        .then((res) => {
          if (typeof res?.total_unread === 'number') {
            setMessageUnreadCount(res.total_unread);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const onMessageEvent = () => fetchUnread();
    window.addEventListener('cognito:new_message', onMessageEvent);
    window.addEventListener('cognito:messages_read', onMessageEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cognito:new_message', onMessageEvent);
      window.removeEventListener('cognito:messages_read', onMessageEvent);
    };
  }, [isLoggedIn, activeUser]);

  const markAllAsRead = async () => {
    await markAllNotificationsRead();
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markNotificationRead(item.id);
    }
    if (item.link) {
      setNotificationsOpen(false);
      router.push(item.link);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (notifTab === 'unread') return !n.is_read;
    return true;
  });

  useEffect(() => {
    if (taskCompletionToast) {
      setToastProgress(50);
      setShowToast(true);

      const timer1 = setTimeout(() => {
        setToastProgress(100);
      }, 400);

      const timer2 = setTimeout(() => {
        setShowToast(false);
        setTimeout(() => {
          setTaskCompletionToast(null);
        }, 400);
      }, 5500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [taskCompletionToast, setTaskCompletionToast]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest(".profile-dropdown-container")) {
        setDropdownOpen(false);
      }
      if (notificationsOpen && !target.closest(".notifications-dropdown-container")) {
        setNotificationsOpen(false);
      }
      if (learningDropdownOpen && !target.closest(".learning-dropdown-container")) {
        setLearningDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, notificationsOpen, learningDropdownOpen]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-200"
      suppressHydrationWarning
      style={{
        background: scrolled ? "rgba(245,243,238,0.97)" : "rgba(245,243,238,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(26,61,40,0.1)",
        boxShadow: scrolled ? "0 2px 20px rgba(26,61,40,0.08)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer shrink-0 group">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a3d28] to-[#2d5a3d] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4.5 h-4.5 text-[#f5f3ee]"
              >
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 12 19 5" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </span>
            <span className="text-[#0d1a14] dark:text-zinc-100 font-bold text-base tracking-tight group-hover:text-[#1a3d28] transition-colors">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 xl:gap-2 min-w-0 px-2">
            {/* Home */}
            <Link
              href="/"
              prefetch={true}
              className={getNavItemClass(pathname === '/' || pathname === '/home')}
            >
              <Home size={14} className={getNavIconClass(pathname === '/' || pathname === '/home')} />
              <span>Trang chủ</span>
            </Link>

            {/* My Learning Hub Dropdown */}
            <div className="relative learning-dropdown-container">
              <button
                onClick={() => {
                  setLearningDropdownOpen(!learningDropdownOpen);
                  if (dropdownOpen) setDropdownOpen(false);
                  if (notificationsOpen) setNotificationsOpen(false);
                }}
                className={`${getNavItemClass(isMyLearningActive || learningDropdownOpen)} cursor-pointer`}
              >
                <BookOpen size={14} className={getNavIconClass(isMyLearningActive || learningDropdownOpen)} />
                <span>Góc học tập</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    learningDropdownOpen ? 'rotate-180' : ''
                  } ${
                    isMyLearningActive || learningDropdownOpen
                      ? 'text-[#1a3d28] dark:text-emerald-300'
                      : 'text-stone-400 dark:text-zinc-500 group-hover:text-[#1a3d28]'
                  }`}
                />
              </button>

              <AnimatePresence>
                {learningDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-96 rounded-2xl bg-white border border-gray-200/80 shadow-2xl z-[115] text-gray-800 p-2 overflow-hidden"
                    style={{ boxShadow: "0 14px 35px -5px rgba(26,61,40,0.18)" }}
                  >
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                        Không gian học tập (My Learning)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                        6 công cụ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 py-1.5">
                      {myLearningItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href === '/ai-test' && pathname?.startsWith('/quiz'));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            onClick={() => setLearningDropdownOpen(false)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                              isActive
                                ? 'bg-emerald-50/70 border border-emerald-200/70'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${item.iconColor}`}>
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${isActive ? 'text-[#1a3d28]' : 'text-gray-800'}`}>
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {item.enTitle}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Community */}
            <Link
              href="/community"
              prefetch={true}
              className={getNavItemClass(Boolean(pathname?.startsWith('/community')))}
            >
              <Users size={14} className={getNavIconClass(Boolean(pathname?.startsWith('/community')))} />
              <span>Cộng đồng</span>
            </Link>

            {/* Focus */}
            <Link
              href="/focus"
              prefetch={true}
              className={getNavItemClass(pathname === '/focus')}
            >
              <Zap size={14} className={getNavIconClass(pathname === '/focus')} />
              <span>Tập trung</span>
            </Link>

            {/* Progress */}
            <Link
              href="/progress"
              prefetch={true}
              className={getNavItemClass(pathname === '/progress')}
            >
              <TrendingUp size={14} className={getNavIconClass(pathname === '/progress')} />
              <span>Tiến độ</span>
            </Link>

            {/* Search */}
            <Link
              href="/search"
              prefetch={true}
              className={getNavItemClass(pathname === '/search')}
            >
              <Search size={14} className={getNavIconClass(pathname === '/search')} />
              <span>Tìm kiếm</span>
            </Link>

            {/* Admin (Only if role === 'admin') */}
            {isMounted && activeUser?.role === 'admin' && (
              <Link
                href="/admin"
                prefetch={true}
                className={getNavItemClass(Boolean(pathname?.startsWith('/admin')))}
              >
                <Shield size={14} className={getNavIconClass(Boolean(pathname?.startsWith('/admin')))} />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isMounted && isLoggedIn ? (
              <>
                {activeUser?.role === 'admin' ? (
                  <Link
                    href="/admin"
                    prefetch={true}
                    className="px-3.5 py-1.5 rounded-xl text-xs xl:text-sm font-bold transition-all flex items-center gap-1.5 text-white bg-[#1a3d28] hover:bg-[#153422] shadow-sm hover:shadow active:scale-95"
                  >
                    <Shield size={14} className="text-emerald-300" />
                    <span>Bảng điều khiển Admin</span>
                  </Link>
                ) : activeUser?.role === 'premium' ? (
                  <button
                    onClick={() => router.push('/premium')}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 border border-amber-500/30 animate-pulse"
                    style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fbbf24", cursor: "pointer", boxShadow: "0 2px 10px rgba(251, 191, 36, 0.1)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(251, 191, 36, 0.1)"; }}
                  >
                    <Crown size={14} className="fill-amber-400 text-amber-400" />
                    Premium
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/premium')}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", border: "none", cursor: "pointer", boxShadow: "0 2px 10px rgba(245, 158, 11, 0.2)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.3)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 10px rgba(245, 158, 11, 0.2)"; }}
                  >
                    <Sparkles size={14} />
                    Nâng cấp Premium
                  </button>
                )}
                
                {/* Direct Messages Link Container */}
                <Link
                  href="/messages"
                  prefetch={true}
                  className="relative p-2 rounded-xl text-gray-700 hover:bg-[#1a3d28]/10 transition-colors flex items-center justify-center cursor-pointer"
                  title="Tin nhắn"
                >
                  <MessageSquare size={18} className={messageUnreadCount > 0 ? "text-[#1a3d28]" : "text-gray-600"} />
                  {messageUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse border-2 border-[#f5f3ee]">
                      {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
                    </span>
                  )}
                </Link>

                {/* Notification Dropdown Container */}
                <div className="relative notifications-dropdown-container">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      if (dropdownOpen) setDropdownOpen(false);
                      if (learningDropdownOpen) setLearningDropdownOpen(false);
                    }}
                    className="relative p-2 rounded-xl text-gray-700 hover:bg-[#1a3d28]/10 transition-colors flex items-center justify-center cursor-pointer"
                    title="Thông báo"
                  >
                    <Bell size={18} className={unreadCount > 0 ? "text-[#1a3d28]" : "text-gray-600"} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse border-2 border-[#f5f3ee]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white border border-gray-200/80 shadow-2xl z-[115] text-gray-800 overflow-hidden"
                        style={{ boxShadow: "0 12px 30px -5px rgba(26,61,40,0.18)" }}
                      >
                        {/* Header */}
                        <div className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Thông báo</h3>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {unreadCount} mới
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllAsRead}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1"
                              >
                                <CheckCheck size={13} />
                                Đọc tất cả
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex border-b border-gray-100 bg-white px-3 pt-2">
                          <button
                            onClick={() => setNotifTab('all')}
                            className={`pb-2 px-3 text-xs font-bold transition-all relative ${
                              notifTab === 'all' ? 'text-[#1a3d28]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            Tất cả ({notifications.length})
                            {notifTab === 'all' && (
                              <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a3d28] rounded-full" />
                            )}
                          </button>
                          <button
                            onClick={() => setNotifTab('unread')}
                            className={`pb-2 px-3 text-xs font-bold transition-all relative ${
                              notifTab === 'unread' ? 'text-[#1a3d28]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            Chưa đọc ({unreadCount})
                            {notifTab === 'unread' && (
                              <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a3d28] rounded-full" />
                            )}
                          </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                          {filteredNotifications.length === 0 ? (
                            <div className="py-8 text-center px-4 flex flex-col items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                <Bell size={18} />
                              </div>
                              <p className="text-xs font-bold text-gray-700">Không có thông báo nào</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Bạn đã xem hết các cập nhật quan trọng!</p>
                            </div>
                          ) : (
                            filteredNotifications.map((n) => {
                              const renderIcon = () => {
                                switch (n.type) {
                                  case 'like':
                                    return <Heart size={14} className="text-rose-500 fill-rose-500/20" />;
                                  case 'comment':
                                  case 'comment_reply':
                                    return <MessageSquare size={14} className="text-emerald-500" />;
                                  case 'reshare':
                                    return <Zap size={14} className="text-amber-500" />;
                                  case 'message':
                                    return <MessageSquare size={14} className="text-blue-500" />;
                                  case 'account_warned':
                                  case 'account_suspended':
                                  case 'resource_removed':
                                    return <AlertTriangle size={14} className="text-red-500" />;
                                  case 'report_resolved':
                                    return <Shield size={14} className="text-indigo-500" />;
                                  case 'task':
                                    return <Trophy size={14} className="text-amber-500" />;
                                  default:
                                    return <Bell size={14} className="text-emerald-600" />;
                                }
                              };

                              const renderBg = () => {
                                switch (n.type) {
                                  case 'like':
                                    return 'bg-rose-50 border-rose-200';
                                  case 'comment':
                                  case 'comment_reply':
                                    return 'bg-emerald-50 border-emerald-200';
                                  case 'reshare':
                                    return 'bg-amber-50 border-amber-200';
                                  case 'message':
                                    return 'bg-blue-50 border-blue-200';
                                  case 'account_warned':
                                  case 'account_suspended':
                                  case 'resource_removed':
                                    return 'bg-red-50 border-red-200';
                                  case 'report_resolved':
                                    return 'bg-indigo-50 border-indigo-200';
                                  case 'task':
                                    return 'bg-amber-50 border-amber-200';
                                  default:
                                    return 'bg-emerald-50 border-emerald-200';
                                }
                              };

                              return (
                                <div
                                  key={n.id}
                                  onClick={() => handleNotificationClick(n)}
                                  className={`p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                                    !n.is_read ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${renderBg()}`}>
                                    {renderIcon()}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <h4 className={`text-xs font-bold truncate ${!n.is_read ? 'text-gray-900 font-extrabold' : 'text-gray-700'}`}>
                                        {n.title}
                                      </h4>
                                      <span className="text-[10px] text-gray-400 shrink-0 font-medium">{formatRelativeTime(n.created_at)}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                                      {n.content}
                                    </p>
                                  </div>

                                  {!n.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              router.push('/profile');
                            }}
                            className="text-[11px] font-bold text-gray-600 hover:text-[#1a3d28] transition-colors"
                          >
                            Xem nhật ký hoạt động
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown Container */}
                <div className="relative profile-dropdown-container">
                  <div 
                    className="w-7 h-7 rounded-full overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors duration-150" 
                    style={{ border: "2px solid rgba(26,61,40,0.2)" }}
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      if (notificationsOpen) setNotificationsOpen(false);
                      if (learningDropdownOpen) setLearningDropdownOpen(false);
                    }}
                  >
                    {activeUser?.avatar_url ? (
                      <img 
                        src={activeUser.avatar_url} 
                        alt={activeUser.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      activeUser?.name?.charAt(0) || 'U'
                    )}
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-100 shadow-xl py-1 z-[110] text-gray-700"
                        style={{ boxShadow: "0 10px 25px -5px rgba(26,61,40,0.15)" }}
                      >
                        {/* User Header */}
                        <div className="px-4 py-2.5 border-b border-gray-50 flex flex-col">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {activeUser?.name || 'Người dùng'}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate mt-0.5">
                            {activeUser?.email || ''}
                          </span>
                        </div>

                        {/* Menu Options */}
                        <div className="p-1">
                          {activeUser?.role === 'admin' && (
                            <button
                              onClick={() => {
                                setDropdownOpen(false);
                                router.push('/admin');
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-left"
                            >
                              <Shield size={14} className="text-emerald-600" />
                              Quản trị hệ thống
                            </button>
                          )}


                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/library');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Layout size={14} className="text-gray-400" />
                            Góc học tập (My Learning)
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/study-sessions');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Clock size={14} className="text-gray-400" />
                            Lịch sử học tập
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/progress');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <TrendingUp size={14} className="text-gray-400" />
                            Tiến độ & Mục tiêu
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/focus');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Zap size={14} className="text-emerald-600" />
                            Chế độ tập trung (Focus)
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <User size={14} className="text-gray-400" />
                            Hồ sơ cá nhân
                          </button>

                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/settings');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors text-left"
                          >
                            <Settings size={14} className="text-gray-400" />
                            Cài đặt hệ thống
                          </button>
                        </div>

                        {/* Logout Divider */}
                        <div className="border-t border-gray-50 my-1"></div>

                        {/* Logout Option */}
                        <div className="p-1">
                          <button
                            onClick={async () => {
                              setDropdownOpen(false);
                              await logout();
                              router.push('/');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                          >
                            <LogOut size={14} />
                            Đăng xuất
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Task completed toast bubble underneath avatar */}
                  <AnimatePresence>
                    {isMounted && showToast && taskCompletionToast && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="absolute right-0 mt-3 w-80 bg-white border-2 border-[#1a2e1c] rounded-2xl shadow-[4px_4px_0px_0px_rgba(26,46,28,1)] overflow-hidden z-[120] text-gray-800"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 animate-bounce">
                              <Trophy className="w-5 h-5 text-amber-500 fill-amber-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[10px] font-black text-amber-600 tracking-wide uppercase flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                Nhiệm vụ hoàn thành!
                              </h4>
                              <p className="text-xs font-bold text-gray-800 truncate mt-0.5">
                                {taskCompletionToast.title}
                              </p>
                            </div>
                            <button 
                              onClick={() => setShowToast(false)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3.5 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-gray-700">
                              <span>Tiến độ</span>
                              <span className={`transition-all duration-300 ${toastProgress === 100 ? "text-emerald-600 scale-105 font-black" : ""}`}>
                                {toastProgress === 100 ? "100% Hoàn thành! 🎉" : `${toastProgress}%`}
                              </span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full border border-gray-200 overflow-hidden relative">
                              <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400"
                                style={{ width: `${toastProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <button
                onClick={onSignInClick}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "#1a3d28", color: "#f5f3ee", border: "none", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#143020"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#1a3d28"; }}
              >
                Sign In
              </button>
            )}
          </div>

          <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0d1a14" }}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: "#f5f3ee", borderTop: "1px solid rgba(26,61,40,0.1)" }}
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-2.5">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold transition-colors ${
                  pathname === '/' || pathname === '/home'
                    ? 'bg-[#1a3d28]/10 text-[#1a3d28] font-bold'
                    : 'text-stone-700 hover:text-[#1a3d28] hover:bg-[#1a3d28]/5'
                }`}
              >
                <Home size={18} className={pathname === '/' || pathname === '/home' ? 'text-[#1a3d28]' : 'text-stone-500'} />
                <span>Trang chủ</span>
              </Link>

              {/* My Learning Group */}
              <div className="bg-white/70 rounded-xl p-3 border border-emerald-900/10">
                <div 
                  onClick={() => setMobileLearningOpen(!mobileLearningOpen)} 
                  className="flex items-center justify-between text-[#1a3d28] font-bold text-base cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen size={18} className="text-[#1a3d28]" />
                    <span>Góc học tập (My Learning)</span>
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${mobileLearningOpen ? 'rotate-180' : ''}`} />
                </div>

                {mobileLearningOpen && (
                  <div className="flex flex-col gap-2 pl-3 pt-2 mt-2 border-l-2 border-emerald-800/20">
                    {myLearningItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = pathname === item.href || (item.href === '/ai-test' && pathname?.startsWith('/quiz'));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`text-sm font-semibold flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                            isItemActive
                              ? 'text-[#1a3d28] font-bold bg-emerald-50'
                              : 'text-gray-700 hover:text-[#1a3d28]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={14} className={isItemActive ? 'text-[#1a3d28]' : 'text-gray-500'} />
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{item.enTitle}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <Link
                href="/community"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold transition-colors ${
                  pathname?.startsWith('/community')
                    ? 'bg-[#1a3d28]/10 text-[#1a3d28] font-bold'
                    : 'text-stone-700 hover:text-[#1a3d28] hover:bg-[#1a3d28]/5'
                }`}
              >
                <Users size={18} className={pathname?.startsWith('/community') ? 'text-[#1a3d28]' : 'text-stone-500'} />
                <span>Cộng đồng</span>
              </Link>

              <Link
                href="/focus"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold transition-colors ${
                  pathname === '/focus'
                    ? 'bg-[#1a3d28]/10 text-[#1a3d28] font-bold'
                    : 'text-stone-700 hover:text-[#1a3d28] hover:bg-[#1a3d28]/5'
                }`}
              >
                <Zap size={18} className={pathname === '/focus' ? 'text-[#1a3d28]' : 'text-stone-500'} />
                <span>Chế độ tập trung (Focus)</span>
              </Link>

              <Link
                href="/progress"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold transition-colors ${
                  pathname === '/progress'
                    ? 'bg-[#1a3d28]/10 text-[#1a3d28] font-bold'
                    : 'text-stone-700 hover:text-[#1a3d28] hover:bg-[#1a3d28]/5'
                }`}
              >
                <TrendingUp size={18} className={pathname === '/progress' ? 'text-[#1a3d28]' : 'text-stone-500'} />
                <span>Tiến độ & Mục tiêu</span>
              </Link>

              <Link
                href="/search"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-semibold transition-colors ${
                  pathname === '/search'
                    ? 'bg-[#1a3d28]/10 text-[#1a3d28] font-bold'
                    : 'text-stone-700 hover:text-[#1a3d28] hover:bg-[#1a3d28]/5'
                }`}
              >
                <Search size={18} className={pathname === '/search' ? 'text-[#1a3d28]' : 'text-stone-500'} />
                <span>Tìm kiếm</span>
              </Link>

              {isMounted && isLoggedIn && (
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="text-[#1a3d28] font-bold text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare size={16} /> Tin nhắn trực tiếp
                  </span>
                  {messageUnreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-black">
                      {messageUnreadCount}
                    </span>
                  )}
                </Link>
              )}
              
              {isMounted && isLoggedIn && activeUser?.role === 'admin' && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-[#1a3d28] font-bold text-base flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <Shield size={16} /> Bảng điều khiển Admin
                </Link>
              )}

              {isMounted && isLoggedIn ? (
                activeUser?.role === 'admin' ? null : activeUser?.role === 'premium' ? (
                  <button 
                    onClick={() => { setMobileOpen(false); router.push('/premium'); }}
                    className="w-full py-2.5 rounded-lg mt-1 flex items-center justify-center gap-2 border border-amber-500/30 animate-pulse" 
                    style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fbbf24", fontWeight: 600, border: "none", cursor: "pointer" }}
                  >
                    <Crown size={16} className="fill-amber-400 text-amber-400" />
                    Premium
                  </button>
                ) : (
                  <button 
                    onClick={() => { setMobileOpen(false); router.push('/premium'); }}
                    className="w-full py-2.5 rounded-lg mt-1 flex items-center justify-center gap-2" 
                    style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", fontWeight: 600, border: "none", cursor: "pointer" }}
                  >
                    <Sparkles size={16} />
                    Nâng cấp Premium
                  </button>
                )
              ) : (
                <button 
                  onClick={() => { setMobileOpen(false); onSignInClick(); }}
                  className="w-full py-2.5 rounded-lg mt-1" 
                  style={{ background: "#1a3d28", color: "#f5f3ee", fontWeight: 600, border: "none", cursor: "pointer" }}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
