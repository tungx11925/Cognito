"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Search,
  User as UserIcon,
  ShieldAlert,
  UserX,
  Flag,
  ArrowLeft,
  Check,
  CheckCheck,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ConversationItem,
  MessageItem,
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markAsRead,
} from '@/services/message.service';
import {
  safetyService,
  ReportReason,
} from '@/services/safety.service';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const { isAuthenticated, activeUser, setShowLoginModal } = useStudy();

  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile View Toggle: 'list' or 'chat'
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Modals for Safety
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'user' | 'message'; id: number; title: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('HARASSMENT');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockTargetUser, setBlockTargetUser] = useState<{ id: number; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<number | null>(null);

  // Keep activeConvIdRef in sync for SSE callback closures
  useEffect(() => {
    activeConvIdRef.current = activeConversation?.id || null;
  }, [activeConversation]);

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch Conversations
  const fetchConversationsList = useCallback(async () => {
    try {
      const res = await getConversations();
      if (res.conversations) {
        setConversations(res.conversations);
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách cuộc trò chuyện');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversationsList();
    } else {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, fetchConversationsList]);

  // 2. Deep Linking / Start with ?user=${userId}
  useEffect(() => {
    if (!isAuthenticated || !targetUserParam || loadingConversations) return;

    const targetUserId = parseInt(targetUserParam, 10);
    if (isNaN(targetUserId)) return;

    // Check if conversation already in list
    const existing = conversations.find((c) => c.other_user.id === targetUserId);
    if (existing) {
      setActiveConversation(existing);
      setMobileView('chat');
    } else {
      // Initiate conversation via API
      startConversation(targetUserId).then((res) => {
        if (res.conversation) {
          setConversations((prev) => {
            const filtered = prev.filter((c) => c.id !== res.conversation!.id);
            return [res.conversation!, ...filtered];
          });
          setActiveConversation(res.conversation);
          setMobileView('chat');
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    }
  }, [targetUserParam, isAuthenticated, loadingConversations, conversations]);

  // 3. Load Messages when Active Conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    getMessages(activeConversation.id, 50)
      .then((res) => {
        if (res.messages) {
          setMessages(res.messages);
          setTimeout(() => scrollToBottom('auto'), 100);

          // Mark as read if unread
          if (activeConversation.unread_count > 0) {
            markAsRead(activeConversation.id).then(() => {
              setConversations((prev) =>
                prev.map((c) => (c.id === activeConversation.id ? { ...c, unread_count: 0 } : c))
              );
            });
          }
        } else if (res.error) {
          toast.error(res.error);
        }
      })
      .finally(() => setLoadingMessages(false));
  }, [activeConversation?.id]);

  // 4. Real-time SSE Connection
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const streamUrl = `${API_BASE_URL}/messages/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('NEW_MESSAGE', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const { conversation_id, message, last_message_text, last_message_at } = payload;

        // Update active conversation timeline if matching
        if (activeConvIdRef.current === conversation_id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
          setTimeout(() => scrollToBottom('smooth'), 100);

          // Auto mark as read
          markAsRead(conversation_id);
        }

        // Update conversations sidebar list
        setConversations((prev) => {
          const convIndex = prev.findIndex((c) => c.id === conversation_id);
          if (convIndex !== -1) {
            const updated = [...prev];
            const targetConv = { ...updated[convIndex] };
            targetConv.last_message_text = last_message_text;
            targetConv.last_message_at = last_message_at;
            if (activeConvIdRef.current !== conversation_id && message.sender_id !== activeUser?.id) {
              targetConv.unread_count += 1;
            }
            // Move updated conversation to top
            updated.splice(convIndex, 1);
            return [targetConv, ...updated];
          } else {
            // New conversation arrived: refresh list
            fetchConversationsList();
            return prev;
          }
        });
      } catch (err) {
        console.error('Error handling SSE NEW_MESSAGE:', err);
      }
    });

    eventSource.addEventListener('MESSAGES_READ', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const { conversation_id } = payload;
        if (activeConvIdRef.current === conversation_id) {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id === activeUser?.id ? { ...m, is_read: true } : m))
          );
        }
      } catch (err) {
        console.error('Error handling SSE MESSAGES_READ:', err);
      }
    });

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated, activeUser?.id, fetchConversationsList]);

  // 5. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || !messageInput.trim() || sendingMessage) return;

    if (activeConversation.is_blocked) {
      toast.error('Không thể gửi tin nhắn do quan hệ chặn giữa hai bên');
      return;
    }

    const content = messageInput.trim();
    setSendingMessage(true);
    try {
      const res = await sendMessage(activeConversation.id, content);
      if (res.message) {
        setMessageInput('');
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message!.id)) return prev;
          return [...prev, res.message!];
        });
        setTimeout(() => scrollToBottom('smooth'), 100);

        // Update last message in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  last_message_text: content,
                  last_message_at: res.message!.created_at,
                  last_sender_id: activeUser!.id,
                }
              : c
          )
        );
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error('Không thể gửi tin nhắn');
    } finally {
      setSendingMessage(false);
    }
  };

  // 6. Handle Block / Unblock User
  const handleToggleBlock = async () => {
    if (!activeConversation) return;
    const target = activeConversation.other_user;

    if (activeConversation.is_blocked) {
      // Unblock
      try {
        const res = await safetyService.unblockUser(target.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`Đã bỏ chặn người dùng ${target.name}`);
          setActiveConversation((prev) => (prev ? { ...prev, is_blocked: false } : null));
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversation.id ? { ...c, is_blocked: false } : c))
          );
        }
      } catch {
        toast.error('Lỗi khi bỏ chặn');
      }
    } else {
      // Open Block Modal
      setBlockTargetUser({ id: target.id, name: target.name });
      setBlockReason('');
      setBlockModalOpen(true);
    }
  };

  const handleConfirmBlock = async () => {
    if (!blockTargetUser) return;
    setSubmittingBlock(true);
    try {
      const res = await safetyService.blockUser(blockTargetUser.id, blockReason.trim() || undefined);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Đã chặn người dùng ${blockTargetUser.name}`);
        setBlockModalOpen(false);
        setActiveConversation((prev) => (prev ? { ...prev, is_blocked: true } : null));
        setConversations((prev) =>
          prev.map((c) =>
            c.other_user.id === blockTargetUser.id ? { ...c, is_blocked: true } : c
          )
        );
      }
    } catch {
      toast.error('Lỗi khi thực hiện chặn');
    } finally {
      setSubmittingBlock(false);
    }
  };

  // 7. Handle Content Reporting
  const handleOpenReport = (type: 'user' | 'message', id: number, title: string) => {
    setReportTarget({ type, id, title });
    setReportReason('HARASSMENT');
    setReportDetails('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    if (reportReason === 'OTHER' && reportDetails.trim().length < 5) {
      toast.error('Vui lòng nhập mô tả vi phạm ít nhất 5 ký tự khi chọn lý do KHÁC');
      return;
    }

    setSubmittingReport(true);
    try {
      const res = await safetyService.reportContent({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || 'Báo cáo vi phạm đã được gửi thành công!');
        setReportModalOpen(false);
      }
    } catch {
      toast.error('Không thể gửi báo cáo vi phạm');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Time formatter helper
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins}p`;
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  // Auth gate check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex flex-col justify-between">
        <Navbar
          isLoggedIn={false}
          onSignInClick={() => setShowLoginModal(true)}
          onDashboardClick={() => router.push('/library')}
          activeUser={null}
        />
        <div className="max-w-md mx-auto my-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-[#1a3d28]">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng nhập để xem tin nhắn</h2>
          <p className="text-sm text-gray-600 mb-6">
            Bạn cần đăng nhập tài khoản Cognito để kết nối và trao đổi trực tiếp với cộng đồng người học.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full py-3 bg-[#1a3d28] text-white font-bold rounded-2xl hover:bg-[#122b1c] transition-all shadow-md cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">
      <Navbar
        isLoggedIn={true}
        onSignInClick={() => {}}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser}
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-20 pb-6 flex-1 flex flex-col">
        {/* Main Messenger Container */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-1 h-[calc(100vh-120px)] max-h-[850px]">
          {/* ────────────────────────────────────────────────────────── */}
          {/* LEFT SIDEBAR: Conversations List */}
          {/* ────────────────────────────────────────────────────────── */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-stone-200 flex flex-col bg-stone-50/50 ${
              mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-stone-200/80 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1a3d28] flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <h1 className="text-lg font-bold text-stone-900">Tin nhắn</h1>
                </div>
                <button
                  onClick={fetchConversationsList}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Làm mới"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm người nhắn tin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-100 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-[#1a3d28] border-none outline-none transition-all"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              {loadingConversations ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-stone-300" />
                  Đang tải cuộc trò chuyện...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-300 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare size={22} />
                  </div>
                  <p className="text-xs font-semibold text-stone-700">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Bắt đầu nhắn tin từ trang cá nhân hoặc học liệu cộng đồng.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConversation?.id === conv.id;
                  const other = conv.other_user;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv);
                        setMobileView('chat');
                      }}
                      className={`w-full p-3.5 flex items-center gap-3 text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-50/70 border-l-4 border-l-[#1a3d28]'
                          : 'hover:bg-stone-100/60'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {other.avatar_url ? (
                          <img
                            src={other.avatar_url}
                            alt={other.name}
                            className="w-11 h-11 rounded-2xl object-cover border border-stone-200"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-[#1a3d28] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                            {other.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {conv.is_blocked && (
                          <span
                            className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 border border-white"
                            title="Đã chặn"
                          >
                            <Lock size={10} />
                          </span>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-stone-900 truncate">
                            {other.name}
                          </span>
                          <span className="text-[10px] text-stone-400 shrink-0 ml-1">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs truncate ${
                              conv.unread_count > 0
                                ? 'font-bold text-stone-900'
                                : 'text-stone-500'
                            }`}
                          >
                            {conv.last_sender_id === activeUser?.id && 'Bạn: '}
                            {conv.last_message_text || 'Bắt đầu cuộc trò chuyện...'}
                          </p>

                          {conv.unread_count > 0 && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#1a3d28] text-white text-[10px] font-black min-w-[18px] text-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* RIGHT CHAT AREA */}
          {/* ────────────────────────────────────────────────────────── */}
          <div
            className={`flex-1 flex flex-col bg-white ${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Header */}
                <div className="p-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Back Button */}
                    <button
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-1.5 rounded-xl hover:bg-stone-200/70 text-stone-600"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    {/* Recipient Avatar */}
                    <div className="relative shrink-0">
                      {activeConversation.other_user.avatar_url ? (
                        <img
                          src={activeConversation.other_user.avatar_url}
                          alt={activeConversation.other_user.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-[#1a3d28] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {activeConversation.other_user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-stone-900 truncate">
                          {activeConversation.other_user.name}
                        </h2>
                        {activeConversation.is_blocked && (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">
                            Bị chặn
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {activeConversation.other_user.headline || activeConversation.other_user.email}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
                      title="Tùy chọn cuộc trò chuyện"
                    >
                      <MoreVertical size={18} />
                    </button>

                    <AnimatePresence>
                      {actionsMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl py-1.5 z-50 text-xs text-stone-700"
                        >
                          <button
                            onClick={() => {
                              setActionsMenuOpen(false);
                              router.push(`/profile/${activeConversation.other_user.id}`);
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-stone-100 flex items-center gap-2"
                          >
                            <ExternalLink size={14} className="text-stone-400" />
                            Xem hồ sơ công khai
                          </button>

                          <button
                            onClick={() => {
                              setActionsMenuOpen(false);
                              handleOpenReport(
                                'user',
                                activeConversation.other_user.id,
                                activeConversation.other_user.name
                              );
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-stone-100 flex items-center gap-2 text-amber-700 font-semibold"
                          >
                            <Flag size={14} />
                            Báo cáo người dùng
                          </button>

                          <button
                            onClick={() => {
                              setActionsMenuOpen(false);
                              handleToggleBlock();
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-stone-100 flex items-center gap-2 text-red-600 font-semibold"
                          >
                            {activeConversation.is_blocked ? (
                              <>
                                <Unlock size={14} /> Bỏ chặn người này
                              </>
                            ) : (
                              <>
                                <UserX size={14} /> Chặn người này
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Block Warning Notice */}
                {activeConversation.is_blocked && (
                  <div className="bg-red-50 border-b border-red-200 p-3 flex items-center justify-between text-xs text-red-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-600 shrink-0" />
                      <span>Cuộc trò chuyện này đang bị khóa do thiết lập chặn hai chiều.</span>
                    </div>
                    <button
                      onClick={handleToggleBlock}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors text-[11px]"
                    >
                      Bỏ chặn
                    </button>
                  </div>
                )}

                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f6]">
                  {loadingMessages ? (
                    <div className="py-12 text-center text-xs text-stone-400">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-stone-300" />
                      Đang tải tin nhắn...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1a3d28] flex items-center justify-center mx-auto mb-3">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-stone-800">Bắt đầu trò chuyện</h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                        Gửi lời chào để bắt đầu kết nối học tập với {activeConversation.other_user.name}.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === activeUser?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Other User Avatar */}
                          {!isMe && (
                            <div className="shrink-0 mb-1">
                              {msg.sender.avatar_url ? (
                                <img
                                  src={msg.sender.avatar_url}
                                  alt={msg.sender.name}
                                  className="w-7 h-7 rounded-xl object-cover border border-stone-200"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-xl bg-stone-300 text-stone-700 font-bold flex items-center justify-center text-[11px]">
                                  {msg.sender.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`relative px-4 py-2.5 rounded-2xl text-xs shadow-xs break-words whitespace-pre-wrap leading-relaxed ${
                                isMe
                                  ? 'bg-[#1a3d28] text-white rounded-br-xs'
                                  : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs'
                              }`}
                            >
                              {msg.content}

                              {/* Message Context Action: Report button on hover */}
                              {!isMe && (
                                <button
                                  onClick={() =>
                                    handleOpenReport('message', msg.id, msg.content.substring(0, 40))
                                  }
                                  className="opacity-0 group-hover:opacity-100 absolute -right-6 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-amber-600 transition-opacity"
                                  title="Tố cáo tin nhắn này"
                                >
                                  <Flag size={12} />
                                </button>
                              )}
                            </div>

                            {/* Timestamp & Read Receipt */}
                            <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-stone-400">
                              <span>{formatTime(msg.created_at)}</span>
                              {isMe && (
                                <span title={msg.is_read ? 'Đã xem' : 'Đã gửi'}>
                                  {msg.is_read ? (
                                    <CheckCheck size={12} className="text-emerald-700" />
                                  ) : (
                                    <Check size={12} className="text-stone-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-stone-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        activeConversation.is_blocked
                          ? 'Cuộc trò chuyện này đang bị khóa do chặn...'
                          : 'Nhập tin nhắn (Enter để gửi)...'
                      }
                      disabled={activeConversation.is_blocked || sendingMessage}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs bg-stone-100 rounded-2xl border border-stone-200/80 focus:bg-white focus:ring-2 focus:ring-[#1a3d28] outline-none disabled:bg-stone-50 disabled:cursor-not-allowed transition-all"
                    />

                    <button
                      type="submit"
                      disabled={
                        activeConversation.is_blocked ||
                        !messageInput.trim() ||
                        sendingMessage
                      }
                      className="p-2.5 bg-[#1a3d28] text-white rounded-2xl hover:bg-[#122b1c] disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                      title="Gửi tin nhắn"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#faf9f6]">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#1a3d28] flex items-center justify-center mb-4">
                  <MessageSquare size={30} />
                </div>
                <h3 className="text-base font-bold text-stone-900">Hộp thoại tin nhắn</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm">
                  Chọn một cuộc trò chuyện từ danh sách bên trái hoặc nhắn tin trực tiếp cho bạn bè từ hồ sơ cá nhân của họ.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: Report User or Message */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200"
            >
              <div className="flex items-center gap-3 mb-4 text-amber-600">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Báo cáo {reportTarget?.type === 'user' ? 'người dùng' : 'tin nhắn vi phạm'}
                  </h3>
                  <p className="text-xs text-stone-500">Mục tiêu: {reportTarget?.title}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Lý do báo cáo
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#1a3d28] outline-none"
                  >
                    <option value="HARASSMENT">Quấy rối / Lăng mạ (HARASSMENT)</option>
                    <option value="SPAM">Tin nhắn rác / Spam (SPAM)</option>
                    <option value="INAPPROPRIATE">Nội dung không phù hợp (INAPPROPRIATE)</option>
                    <option value="FALSE_INFORMATION">Lừa đảo / Sai lệch thông tin (FALSE_INFORMATION)</option>
                    <option value="OTHER">Lý do khác (OTHER)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                    Chi tiết vi phạm {reportReason === 'OTHER' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả cụ thể hành vi vi phạm..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#1a3d28] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: Block User Confirmation */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {blockModalOpen && (
          <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200"
            >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                  <UserX size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Chặn người dùng {blockTargetUser?.name}
                  </h3>
                  <p className="text-xs text-stone-500">Chặn hai chiều toàn diện</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Khi chặn người dùng này, cả hai sẽ không thể gửi tin nhắn cho nhau, không thấy tương tác hoặc bài đăng cộng đồng của nhau. Bạn có thể bỏ chặn bất kỳ lúc nào.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Lý do chặn (không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Spam tin nhắn, không muốn liên lạc..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#1a3d28] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={submittingBlock}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submittingBlock ? 'Đang chặn...' : 'Xác nhận chặn'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#1a3d28] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
