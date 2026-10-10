"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  NotificationItem,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationStreamTicket,
} from '@/services/notification.service';
import { apiFetch, getValidToken } from '@/services/api';
export interface DocumentItem {
  id: number;
  user_id: number;
  owner?: number;
  title: string;
  description: string;
  doc_url: string;
  file?: string;
  solution_text?: string;
  solution_url?: string;
  category: string;
  file_type?: string;
  type?: string;
  file_size?: number;
  size?: number;
  status?: string;
  processing_status?: string;
  processing_error?: string | null;
  visibility?: 'private' | 'public';
  is_community_published?: boolean;
  page_count?: number;
  created_at: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NoteItem {
  id: number;
  user_id: number;
  document_id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface FlashcardDeck {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface FlashcardItem {
  id: number;
  deck_id: number;
  document_id?: number | null;
  front: string;
  back: string;
  ease_factor: number;
  repetitions: number;
  interval_days: number;
  next_review_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface StudyContextType {
  // Authentication & Global
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; requiresPasswordChange?: boolean; email?: string; role?: string }>;
  register: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  activeUser: { id: number; name: string; email: string; role?: string; phone?: string; education?: string; address?: string; website?: string; avatar_url?: string; is_verified?: boolean; streak?: number; last_study_date?: string; study_dates?: string[]; privacy_setting?: string; created_at?: string; bio?: string; headline?: string; is_premium?: boolean; premium_until?: string } | null;
  setActiveUser: (user: { id: number; name: string; email: string; role?: string; phone?: string; education?: string; address?: string; website?: string; avatar_url?: string; is_verified?: boolean; streak?: number; last_study_date?: string; study_dates?: string[]; privacy_setting?: string; created_at?: string; bio?: string; headline?: string; is_premium?: boolean; premium_until?: string } | null) => void;
  updateAvatar: (file: File) => Promise<boolean>;
  updateProfile: (fields: { name: string; phone?: string; education?: string; address?: string; privacy_setting?: string; bio?: string; headline?: string; website?: string }) => Promise<boolean>;
  toggleVerification: (enable: boolean) => Promise<boolean>;
  verify2FA: (email: string, code: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  upgradePremium: () => Promise<boolean>;
  searchQuery: string;

  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  globalMessage: { text: string; type: 'success' | 'error' };
  triggerMessage: (text: string, type?: 'success' | 'error') => void;

  // Documents
  documents: DocumentItem[];
  fetchDocuments: () => Promise<void>;
  activeDoc: DocumentItem | null;
  setActiveDoc: (doc: DocumentItem | null) => void;
  handleOpenWorkspace: (doc: DocumentItem) => void;
  showAddDocModal: boolean;
  setShowAddDocModal: (show: boolean) => void;
  newDocTitle: string;
  setNewDocTitle: (t: string) => void;
  newDocCat: string;
  setNewDocCat: (c: string) => void;
  newDocDesc: string;
  setNewDocDesc: (d: string) => void;
  newDocContent: string;
  setNewDocContent: (c: string) => void;
  newDocSolution: string;
  setNewDocSolution: (s: string) => void;
  handleAddDocumentSubmit: (e: React.FormEvent) => Promise<void>;
  handleDeleteDocument: (id: number) => Promise<boolean>;
  handleEditDocument: (
    id: number, 
    title: string, 
    category?: string, 
    description?: string,
    visibility?: 'private' | 'public',
    is_community_published?: boolean
  ) => Promise<boolean>;

  // Decks & Flashcards
  decks: FlashcardDeck[];
  fetchFlashcardDecks: (force?: boolean) => Promise<void>;
  invalidateCache: (type?: 'documents' | 'decks' | 'tasks' | 'friends' | 'all') => Promise<void>;
  activeDeck: FlashcardDeck | null;
  setActiveDeck: (deck: FlashcardDeck | null) => void;
  activeDeckCards: FlashcardItem[];
  setActiveDeckCards: (cards: FlashcardItem[]) => void;
  fetchCardsForDeck: (deckId: number) => Promise<void>;
  currentCardIndex: number;
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>;
  isCardFlipped: boolean;
  setIsCardFlipped: (flipped: boolean) => void;
  generatingFC: boolean;
  handleReviewCard: (difficulty: 'easy' | 'good' | 'hard') => Promise<void>;
  showAddDeckModal: boolean;
  setShowAddDeckModal: (show: boolean) => void;
  newDeckName: string;
  setNewDeckName: (name: string) => void;
  newDeckDesc: string;
  setNewDeckDesc: (desc: string) => void;
  handleAddDeckSubmit: (e: React.FormEvent) => Promise<void>;

  // Notes
  notesText: string;
  setNotesText: (t: string) => void;
  notesTitle: string;
  setNotesTitle: (t: string) => void;
  notesSaving: boolean;
  notesSavedTime: string;
  handleSaveNotes: () => Promise<void>;

  // AI Chat
  chatMessages: { sender: 'user' | 'ai'; text: string }[];
  setChatMessages: React.Dispatch<React.SetStateAction<{ sender: 'user' | 'ai'; text: string }[]>>;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatLoading: boolean;
  aiWorkspaceTab: 'chat' | 'timer' | 'notes' | 'quiz';
  setAiWorkspaceTab: (tab: 'chat' | 'timer' | 'notes' | 'quiz') => void;
  handleSendChatMessage: () => Promise<void>;

  // Timer
  timerMinutes: number;
  setTimerMinutes: (m: number) => void;
  timerSeconds: number;
  setTimerSeconds: (s: number) => void;
  timerActive: boolean;
  setTimerActive: (a: boolean) => void;
  timerMaxMinutes: number;
  setTimerMaxMinutes: (m: number) => void;
  elapsedStudyTime: number;
  setElapsedStudyTime: React.Dispatch<React.SetStateAction<number>>;

  // Quiz
  quizzes: QuizQuestion[];
  quizLoading: boolean;
  selectedAnswers: Record<number, number>;
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  quizSubmitted: boolean;
  setQuizSubmitted: (submitted: boolean) => void;
  handleGenerateQuiz: () => Promise<void>;
  handleSelectQuizAnswer: (qId: number, optionIdx: number) => void;
  getQuizScore: () => number;

  analyticsData: {
    total_study_minutes: number;
    total_sessions: number;
    total_documents: number;
    total_flashcards: number;
    streak?: number;
    total_reviews?: number;
    total_notes?: number;
    chart_data: { day: string; minutes: number }[];
    goals?: any[];
    recent_activities?: any[];
    streak_details?: any;
  };
  fetchAnalytics: () => Promise<void>;

  // Tasks & Friends
  tasks: any[];
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  friends: any[];
  fetchTasks: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  triggerTaskProgress: (taskType: string, increment?: number) => Promise<void>;
  taskCompletionToast: { type: string; title: string } | null;
  setTaskCompletionToast: (toast: { type: string; title: string } | null) => void;
  taskProgressToast: { type: string; title: string; description: string; previousValue: number; currentValue: number; targetValue: number } | null;
  setTaskProgressToast: (toast: { type: string; title: string; description: string; previousValue: number; currentValue: number; targetValue: number } | null) => void;
  showDailyRecommendModal: boolean;
  setShowDailyRecommendModal: (show: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  fetchNotificationsList: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (): Record<string, string> => {
  return {};
};

const EMPTY_ANALYTICS = {
  total_study_minutes: 0,
  total_sessions: 0,
  total_documents: 0,
  total_flashcards: 0,
  streak: 0,
  total_reviews: 0,
  total_notes: 0,
  chart_data: [] as { day: string; minutes: number }[],
  goals: [] as any[],
  recent_activities: [] as any[],
  streak_details: null as any,
};

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeUser, setActiveUser] = useState<{ id: number; name: string; email: string; role?: string; phone?: string; education?: string; address?: string; website?: string; avatar_url?: string; is_verified?: boolean; streak?: number; last_study_date?: string; study_dates?: string[]; privacy_setting?: string; created_at?: string; bio?: string; headline?: string; is_premium?: boolean; premium_until?: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [globalMessage, setGlobalMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // Documents
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCat, setNewDocCat] = useState('Trí tuệ nhân tạo');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocSolution, setNewDocSolution] = useState('');

  // Decks & Flashcards
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [activeDeckCards, setActiveDeckCards] = useState<FlashcardItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [generatingFC, setGeneratingFC] = useState(false);
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  // Notes
  const [notesText, setNotesText] = useState('');
  const [notesTitle, setNotesTitle] = useState('Ghi chú của tôi');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedTime, setNotesSavedTime] = useState<string>('');

  // AI Chat
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [aiWorkspaceTab, setAiWorkspaceTab] = useState<'chat' | 'timer' | 'notes' | 'quiz'>('chat');

  // Study Timer states
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMaxMinutes, setTimerMaxMinutes] = useState(25);
  const [elapsedStudyTime, setElapsedStudyTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTrackerLastActiveTimeRef = useRef<number>(Date.now());
  const activeTrackerUnsentSecondsRef = useRef<number>(0);
  const activeTrackerIsUserActiveRef = useRef<boolean>(false);

  // AI Quiz states
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(EMPTY_ANALYTICS);

  // Tasks & Friends states
  const [tasks, setTasks] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [taskCompletionToast, setTaskCompletionToast] = useState<{ type: string; title: string } | null>(null);
  const [taskProgressToast, setTaskProgressToast] = useState<{ type: string; title: string; description: string; previousValue: number; currentValue: number; targetValue: number } | null>(null);
  const [showDailyRecommendModal, setShowDailyRecommendModal] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  // Toast message trigger helper
  const triggerMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setGlobalMessage({ text, type });
    setTimeout(() => {
      setGlobalMessage({ text: '', type: 'success' });
    }, 4000);
  };

  // Auth API Calls
  const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; requiresPasswordChange?: boolean; email?: string; role?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires2FA) {
          triggerMessage(data.message || 'Vui lòng nhập mã xác thực từ email', 'success');
          return { success: true, requires2FA: true, email: data.email };
        }
        if (data.requiresPasswordChange) {
          triggerMessage(data.message || 'Vui lòng đổi mật khẩu để kích hoạt', 'success');
          return { success: true, requiresPasswordChange: true, email: data.email };
        }
        try { localStorage.removeItem('token'); } catch (e) {}
        setActiveUser(data.user);
        setIsAuthenticated(true);
        setShowDailyRecommendModal(true);
        triggerMessage(data.message || 'Đăng nhập thành công', 'success');
        return { success: true, role: data.user?.role };
      } else {
        triggerMessage(data.error || 'Đăng nhập thất bại', 'error');
        return { success: false };
      }
    } catch (e) {
      triggerMessage('Lỗi kết nối', 'error');
      return { success: false };
    }
  };

  const register = async (name: string, phone: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        try { localStorage.removeItem('token'); } catch (e) {}
        setActiveUser(data.user);
        setIsAuthenticated(true);
        setShowDailyRecommendModal(true);
        triggerMessage(data.message || 'Đăng ký thành công', 'success');
        return { success: true };
      } else {
        triggerMessage(data.error || 'Đăng ký thất bại', 'error');
        return { success: false, error: data.error };
      }
    } catch (e) {
      triggerMessage('Lỗi kết nối', 'error');
      return { success: false, error: 'Lỗi kết nối' };
    }
  };

  const logout = async () => {
    // 1. Flush any active time BEFORE logout
    if (activeTrackerUnsentSecondsRef.current > 0 || activeTrackerIsUserActiveRef.current) {
      let elapsed = 0;
      if (activeTrackerIsUserActiveRef.current) {
        elapsed = (Date.now() - activeTrackerLastActiveTimeRef.current) / 1000;
      }
      const totalToSend = Math.floor(activeTrackerUnsentSecondsRef.current + elapsed);
      if (totalToSend >= 1) {
        activeTrackerUnsentSecondsRef.current = 0;
        try {
          await fetch(`${API_BASE_URL}/study-sessions/active-ping`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seconds: totalToSend })
          });
        } catch (e) {
          console.error("Error flushing active time in logout:", e);
        }
      }
    }

    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    try { localStorage.removeItem('token'); } catch (e) {}

    // Spec 3.12: BroadcastChannel đồng bộ logout chủ động giữa các tab
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const authChannel = new BroadcastChannel('cognito_auth_channel');
        authChannel.postMessage({ type: 'ACTIVE_LOGOUT' });
        authChannel.close();
      }
    } catch (e) {}

    setActiveUser(null);
    setIsAuthenticated(false);
    triggerMessage('Đăng xuất thành công', 'success');
    window.location.href = '/';
  };

  const updateAvatar = async (file: File): Promise<boolean> => {
    if (!isAuthenticated) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setActiveUser(prev => prev ? { ...prev, avatar_url: data.avatarUrl } : null);
        triggerMessage(data.message || "Tải ảnh đại diện thành công", "success");
        return true;
      } else {
        triggerMessage(data.error || "Tải ảnh đại diện thất bại", "error");
        return false;
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
      return false;
    }
  };

  const updateProfile = async (fields: { name: string; phone?: string; education?: string; address?: string; privacy_setting?: string; bio?: string; headline?: string; website?: string }): Promise<boolean> => {
    if (!isAuthenticated) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields)
      });

      const data = await res.json();
      if (res.ok) {
        setActiveUser(data.user);
        triggerMessage(data.message || "Cập nhật thông tin thành công", "success");
        return true;
      } else {
        triggerMessage(data.error || "Cập nhật thông tin thất bại", "error");
        return false;
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
      return false;
    }
  };

  const toggleVerification = async (enable: boolean): Promise<boolean> => {
    if (!isAuthenticated) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/toggle-verification`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enable })
      });

      const data = await res.json();
      if (res.ok) {
        setActiveUser(data.user);
        triggerMessage(data.message || "Cập nhật xác thực thành công", "success");
        return true;
      } else {
        triggerMessage(data.error || "Cập nhật xác thực thất bại", "error");
        return false;
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAuthenticated) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        triggerMessage(data.message || "Thay đổi mật khẩu thành công!", "success");
        return { success: true };
      } else {
        triggerMessage(data.error || "Đổi mật khẩu thất bại", "error");
        return { success: false, error: data.error };
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
      return { success: false, error: "Lỗi kết nối máy chủ" };
    }
  };

  const verify2FA = async (email: string, code: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) {
        try { localStorage.removeItem('token'); } catch (e) {}
        setActiveUser(data.user);
        setIsAuthenticated(true);
        setShowDailyRecommendModal(true);
        triggerMessage(data.message || 'Đăng nhập thành công', 'success');
        return true;
      } else {
        triggerMessage(data.error || 'Mã xác thực không chính xác', 'error');
        return false;
      }
    } catch (e) {
      triggerMessage('Lỗi kết nối', 'error');
      return false;
    }
  };

  const upgradePremium = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/upgrade-premium`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      if (res.ok) {
        setActiveUser(data.user);
        triggerMessage(data.message || "Nâng cấp Premium thành công", "success");
        return true;
      } else {
        triggerMessage(data.error || "Nâng cấp thất bại", "error");
        return false;
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
      return false;
    }
  };

  useEffect(() => {
    const handleSessionExpired = (e: any) => {
      console.warn('[AUTH_FE] Session expired event received');
      setActiveUser(null);
      setIsAuthenticated(false);
      setShowLoginModal(true);
      triggerMessage(e.detail?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
    };
    window.addEventListener('cognito:session_expired', handleSessionExpired);

    // Spec 3.12: Lắng nghe đăng xuất chủ động từ tab khác qua BroadcastChannel
    let authChannel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      authChannel = new BroadcastChannel('cognito_auth_channel');
      authChannel.onmessage = (event) => {
        if (event.data?.type === 'ACTIVE_LOGOUT') {
          console.log('[AUTH_FE] BroadcastChannel: Nhận tín hiệu đăng xuất chủ động từ tab khác');
          setActiveUser(null);
          setIsAuthenticated(false);
          window.location.href = '/';
        }
      };
    }

    return () => {
      window.removeEventListener('cognito:session_expired', handleSessionExpired);
      if (authChannel) authChannel.close();
    };
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setActiveUser(data.user);
          setIsAuthenticated(true);
        } else {
          setActiveUser(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error('Error fetching /auth/me:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const lastDocsFetchRef = useRef<number>(0);
  const lastDecksFetchRef = useRef<number>(0);
  const lastTasksFetchRef = useRef<number>(0);
  const lastFriendsFetchRef = useRef<number>(0);

  // API Call: Fetch Documents
  const fetchDocuments = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && documents.length > 0 && (now - lastDocsFetchRef.current < 25000)) {
      return;
    }
    lastDocsFetchRef.current = now;
    try {
      const data = await apiFetch('/documents');
      if (Array.isArray(data)) {
        setDocuments(data);
        return;
      }
      setDocuments([]);
    } catch (e) {
      console.error("Error fetching docs:", e);
      setDocuments([]);
    }
  };

  // API Call: Fetch Decks
  const fetchFlashcardDecks = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && decks.length > 0 && (now - lastDecksFetchRef.current < 25000)) {
      return;
    }
    lastDecksFetchRef.current = now;
    try {
      const data = await apiFetch('/flashcards/decks');
      if (Array.isArray(data)) {
        setDecks(data);
        return;
      }
      setDecks([]);
    } catch (e) {
      console.error("Error fetching decks:", e);
      setDecks([]);
    }
  };

  const invalidateCache = async (type: 'documents' | 'decks' | 'tasks' | 'friends' | 'all' = 'all') => {
    if (type === 'documents' || type === 'all') {
      lastDocsFetchRef.current = 0;
      await fetchDocuments(true);
    }
    if (type === 'decks' || type === 'all') {
      lastDecksFetchRef.current = 0;
      await fetchFlashcardDecks(true);
    }
    if (type === 'tasks' || type === 'all') {
      lastTasksFetchRef.current = 0;
      await fetchTasks(true);
    }
    if (type === 'friends' || type === 'all') {
      lastFriendsFetchRef.current = 0;
      await fetchFriends(true);
    }
  };

  // API Call: Fetch cards in a deck
  const fetchCardsForDeck = async (deckId: number) => {
    try {
      const data = await apiFetch(`/flashcards/decks/${deckId}/cards`);
      if (Array.isArray(data)) {
        setActiveDeckCards(data);
        return;
      }
      setActiveDeckCards([]);
    } catch (e) {
      console.error("Error fetching cards:", e);
      setActiveDeckCards([]);
    }
  };

  // API Call: Fetch notes for active document
  const fetchNotesForDoc = async (docId: number) => {
    try {
      const data = await apiFetch(`/notes/document/${docId}`);
      if (Array.isArray(data) && data.length > 0) {
        setNotesTitle(data[0].title);
        setNotesText(data[0].content);
      } else {
        setNotesTitle('Ghi chú của tôi');
        setNotesText('');
      }
    } catch (e) {
      console.error("Error fetching notes:", e);
    }
  };

  // API Call: Fetch stats
  const fetchAnalytics = async () => {
    try {
      const summary = await apiFetch('/progress/summary');
      if (summary && !summary.error) {
        setAnalyticsData({
          total_study_minutes: summary.total_study_minutes || 0,
          total_sessions: summary.total_activities || 0,
          total_documents: summary.total_documents_read || 0,
          total_flashcards: summary.total_flashcards_reviewed || 0,
          streak: summary.streak?.currentStreak || 0,
          total_reviews: summary.total_flashcards_reviewed || 0,
          total_notes: summary.total_notes || 0,
          chart_data: (summary.weekly_chart || []).map((c: any) => ({
            day: c.day,
            minutes: c.minutes,
          })),
          goals: summary.daily_goals || [],
          recent_activities: summary.recent_activities || [],
          streak_details: summary.streak,
        });
        return;
      }
      setAnalyticsData(EMPTY_ANALYTICS);
    } catch (e) {
      console.error("Error fetching stats:", e);
      setAnalyticsData(EMPTY_ANALYTICS);
    }
  };

  const fetchTasks = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && tasks.length > 0 && (now - lastTasksFetchRef.current < 25000)) {
      return;
    }
    lastTasksFetchRef.current = now;
    try {
      const data = await apiFetch('/tasks');
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const fetchFriends = async (force: boolean = false) => {
    const now = Date.now();
    if (!force && friends.length > 0 && (now - lastFriendsFetchRef.current < 25000)) {
      return;
    }
    lastFriendsFetchRef.current = now;
    try {
      const data = await apiFetch('/friends');
      if (Array.isArray(data)) {
        setFriends(data);
      }
    } catch (e) {
      console.error("Error fetching friends:", e);
    }
  };

  const fetchNotificationsList = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications({ limit: 30 });
      if (res.notifications) {
        setNotifications(res.notifications);
        setUnreadNotificationCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadNotificationCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Real-time Unified SSE Stream for Tasks, Notifications & Live Chat (Zero query JWT, Multiplexed)
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    fetchTasks();
    fetchNotificationsList();

    let eventSource: EventSource | null = null;
    let isCancelled = false;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;

    const scheduleReconnect = () => {
      if (isCancelled || document.visibilityState === 'hidden') return;
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[SSE] Đã vượt quá số lần thử kết nối lại tối đa (${MAX_RECONNECT_ATTEMPTS}). Dừng reconnect.`);
        return;
      }
      reconnectAttempts++;
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(`[SSE] Kết nối lại sau ${backoffDelay}ms (lần ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      reconnectTimeout = setTimeout(setupSSE, backoffDelay);
    };

    const handleVisibilityChangeSSE = () => {
      if (document.visibilityState === 'visible' && !eventSource && !isCancelled) {
        console.log('[SSE] Tab hiển thị trở lại, tiếp tục kết nối SSE...');
        reconnectAttempts = 0;
        setupSSE();
      } else if (document.visibilityState === 'hidden' && eventSource) {
        console.log('[SSE] Tab bị ẩn, tạm dừng stream SSE để tiết kiệm tài nguyên...');
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        eventSource.close();
        eventSource = null;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChangeSSE);

    const setupSSE = async () => {
      if (isCancelled || document.visibilityState === 'hidden') return;
      try {
        const ticketRes = await getNotificationStreamTicket();
        if (isCancelled) return;
        if (!ticketRes || (ticketRes as any).status === 401) {
          console.warn('[SSE] Ticket 401: Đóng stream, không tự động đăng xuất.');
          return;
        }

        let streamUrl = `${API_BASE_URL}/notifications/stream`;
        if (ticketRes.ticket) {
          streamUrl += `?ticket=${encodeURIComponent(ticketRes.ticket)}`;
        }

        const es = new EventSource(streamUrl, { withCredentials: true });
        eventSource = es;

        es.onopen = () => {
          reconnectAttempts = 0; // Reset số lần thử khi kết nối thành công
        };

        // 1. Task Completed Event
        es.addEventListener('TASK_COMPLETED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data && data.task) {
              setTasks(prev => prev.map(t => t.task_type === data.task.task_type ? { ...t, ...data.task, is_completed: true, completed: true } : t));
              setTaskCompletionToast({
                type: data.taskType || data.task.task_type,
                title: data.title || data.task.title
              });
              triggerMessage(`🎉 Xuất sắc! Bạn vừa hoàn thành nhiệm vụ "${data.title || data.task.title}"!`, 'success');
            }
          } catch (err) {
            console.error('Error handling SSE TASK_COMPLETED event:', err);
          }
        });

        // 2. Task Progress Event
        es.addEventListener('TASK_PROGRESS', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data && data.task) {
              setTasks(prev => prev.map(t => t.task_type === data.task.task_type ? { ...t, ...data.task } : t));
            }
          } catch (err) {
            console.error('Error handling SSE TASK_PROGRESS event:', err);
          }
        });

        // 3. New Notification Event (Multiplexed)
        es.addEventListener('NEW_NOTIFICATION', (e: MessageEvent) => {
          try {
            const notif = JSON.parse(e.data);
            if (notif && notif.id) {
              setNotifications(prev => {
                if (prev.some(n => n.id === notif.id)) return prev;
                return [notif, ...prev];
              });
              setUnreadNotificationCount(prev => prev + 1);
              triggerMessage(`🔔 ${notif.title}: ${notif.content}`, 'success');
            }
          } catch (err) {
            console.error('Error handling SSE NEW_NOTIFICATION event:', err);
          }
        });

        // 4. New Message Event (Multiplexed for Global Badge & Chat View)
        es.addEventListener('NEW_MESSAGE', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('cognito:new_message', { detail: payload }));
          } catch (err) {
            console.error('Error handling SSE NEW_MESSAGE event:', err);
          }
        });

        // 5. Messages Read Event (Multiplexed)
        es.addEventListener('MESSAGES_READ', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            window.dispatchEvent(new CustomEvent('cognito:messages_read', { detail: payload }));
          } catch (err) {
            console.error('Error handling SSE MESSAGES_READ event:', err);
          }
        });

        es.onerror = () => {
          if (eventSource) eventSource.close();
          eventSource = null;
          scheduleReconnect();
        };
      } catch (err: any) {
        if (err?.status === 401) {
          console.warn('[SSE] Ticket failed with 401. Stream closed.');
          return;
        }
        scheduleReconnect();
      }
    };

    setupSSE();

    return () => {
      isCancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChangeSSE);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [isAuthenticated]);

  const triggerTaskProgress = async (taskType: string, increment: number = 1) => {
    try {
      const prevTask = tasks.find(t => t.task_type === taskType);
      const previousValue = prevTask ? prevTask.current_value : 0;

      const data = await apiFetch('/tasks/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_type: taskType, increment })
      });
      if (data && !data.error && data.task) {
        const updatedTask = data.task;
        setTasks(prev => prev.map(t => t.task_type === taskType ? updatedTask : t));
        
        // Only trigger progress update toast if the task was not already completed
        if (previousValue < updatedTask.target_value) {
          setTaskProgressToast({
            type: taskType,
            title: updatedTask.title,
            description: updatedTask.description,
            previousValue,
            currentValue: updatedTask.current_value,
            targetValue: updatedTask.target_value
          });

          if (data.justCompleted) {
            setTaskCompletionToast({ type: taskType, title: updatedTask.title });
            triggerMessage(`Chúc mừng! Bạn đã hoàn thành nhiệm vụ "${updatedTask.title}"! 🎉`, "success");
          }
        }
      }
    } catch (e) {
      console.error("Error updating task progress:", e);
    }
  };

  // API Call: Add Document
  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      triggerMessage("Vui lòng nhập tên và nội dung tài liệu", "error");
      return;
    }

    try {
      const data = await apiFetch('/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newDocTitle,
          description: newDocDesc,
          doc_url: '',
          solution_text: newDocSolution,
          solution_url: '',
          category: newDocCat
        })
      });

      if (data && !data.error) {
        triggerMessage("Tải lên tài liệu học tập thành công!");
        setShowAddDocModal(false);
        setNewDocTitle('');
        setNewDocDesc('');
        setNewDocContent('');
        setNewDocSolution('');
        lastDocsFetchRef.current = 0;
        await fetchDocuments(true);
        fetchAnalytics();
      } else {
        triggerMessage(data?.error || "Không thể thêm tài liệu mới", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối server", "error");
    }
  };

  const executeDeleteDocument = async (id: number): Promise<boolean> => {
    try {
      const data = await apiFetch(`/documents/${id}`, {
        method: 'DELETE'
      });
      if (data && !data.error) {
        triggerMessage("Đã xóa tài liệu thành công", "success");
        setDocuments(prev => prev.filter(d => d.id !== id));
        lastDocsFetchRef.current = 0;
        await fetchDocuments(true);
        fetchAnalytics();
        if (activeDoc?.id === id) setActiveDoc(null);
        return true;
      } else {
        triggerMessage(data?.error || "Không thể xóa tài liệu này", "error");
        return false;
      }
    } catch (e) {
      console.error("Error deleting document:", e);
      triggerMessage("Lỗi kết nối khi xóa tài liệu", "error");
      return false;
    }
  };

  const handleDeleteDocument = async (id: number): Promise<boolean> => {
    return await executeDeleteDocument(id);
  };

  // API Call: Edit Document (Rename / Edit)
  const handleEditDocument = async (
    id: number, 
    title: string, 
    category?: string, 
    description?: string,
    visibility?: 'private' | 'public',
    is_community_published?: boolean
  ): Promise<boolean> => {
    try {
      const data = await apiFetch(`/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, category, description, visibility, is_community_published })
      });
      if (data && !data.error) {
        triggerMessage("Đã chỉnh sửa thông tin tài liệu thành công");
        lastDocsFetchRef.current = 0;
        await fetchDocuments(true);
        return true;
      } else {
        triggerMessage(data?.error || "Lỗi khi chỉnh sửa tài liệu", "error");
        return false;
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
      return false;
    }
  };

  // API Call: Create Flashcard Deck
  const handleAddDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) {
      triggerMessage("Vui lòng điền tên bộ thẻ ghi nhớ", "error");
      return;
    }

    try {
      const data = await apiFetch('/flashcards/decks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newDeckName,
          description: newDeckDesc
        })
      });

      if (data && !data.error) {
        triggerMessage("Đã tạo bộ thẻ ghi nhớ mới!");
        setShowAddDeckModal(false);
        setNewDeckName('');
        setNewDeckDesc('');
        lastDecksFetchRef.current = 0;
        await fetchFlashcardDecks(true);
        fetchAnalytics();
      } else {
        triggerMessage(data?.error || "Lỗi khi tạo bộ thẻ", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối máy chủ", "error");
    }
  };

  // API Call: Save Notes in real-time
  const handleSaveNotes = async () => {
    if (!activeDoc) return;
    setNotesSaving(true);
    try {
      const data = await apiFetch('/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: activeDoc.id,
          title: notesTitle,
          content: notesText
        })
      });

      if (data && !data.error) {
        const d = new Date();
        setNotesSavedTime(`${d.getHours()}:${d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()}:${d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds()}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setNotesSaving(false), 500);
    }
  };

  // API Call: Send Chat Message to AI Assistant
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !activeDoc) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const data = await apiFetch('/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: activeDoc.id,
          message: userMsg
        })
      });

      if (data && !data.error && data.reply) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data?.error || "Tôi đang gặp khó khăn khi truy xuất thông tin này. Bạn vui lòng thử lại nhé." }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "Lỗi kết nối. Không thể liên hệ với trợ lý AI." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // API Call: Auto-Generate Quiz questions using AI
  const handleGenerateQuiz = async () => {
    if (!activeDoc) return;
    setQuizLoading(true);
    setQuizSubmitted(false);
    setSelectedAnswers({});
    try {
      const data = await apiFetch('/ai/generate-quiz', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_id: activeDoc.id })
      });
      if (data && !data.error && data.quizzes) {
        setQuizzes(data.quizzes);
        triggerMessage("Đã tạo câu hỏi ôn tập thành công!");
      } else {
        triggerMessage(data?.error || "Lỗi khi tạo Quiz", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi khi tạo Quiz", "error");
    } finally {
      setQuizLoading(false);
    }
  };


  // API Call: Spaced Repetition card review feedback
  const handleReviewCard = async (difficulty: 'easy' | 'good' | 'hard') => {
    if (activeDeckCards.length === 0) return;
    const currentCard = activeDeckCards[currentCardIndex];
    
    try {
      const data = await apiFetch(`/flashcards/review/${currentCard.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty })
      });

      if (data && !data.error) {
        triggerMessage(`Thẻ ghi nhớ được lên lịch ôn tập sau ${data.next_review_days} ngày!`);
        
        if (data.updated_streak !== undefined) {
          setActiveUser(prev => prev ? { ...prev, streak: data.updated_streak } : null);
        }

        if (data.task_update) {
          const { task, justCompleted } = data.task_update;
          if (task) {
            setTasks(prev => prev.map(t => t.task_type === task.task_type ? task : t));
            if (justCompleted) {
              setTaskCompletionToast({ type: task.task_type, title: task.title });
              triggerMessage(`Chúc mừng! Bạn đã hoàn thành nhiệm vụ "${task.title}"! 🎉`, "success");
            }
          }
        }
        
        setIsCardFlipped(false);
        setTimeout(() => {
          if (currentCardIndex < activeDeckCards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
          } else {
            triggerMessage("Bạn đã hoàn thành việc ôn tập tất cả các thẻ của ngày hôm nay! 🎉");
            setCurrentCardIndex(0);
          }
        }, 300);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open active workspace
  const handleOpenWorkspace = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setAiWorkspaceTab('chat');
    setTimerActive(false);
    setTimerMinutes(25);
    setTimerSeconds(0);
    setTimerMaxMinutes(25);
    setElapsedStudyTime(0);
    
    triggerTaskProgress('read_document', 1);
  };

  const handleTimerComplete = async () => {
    setTimerActive(false);
    triggerMessage("Tuyệt vời! Bạn đã hoàn thành phiên học tập tập trung! 🎯");
    
    if (activeDoc) {
      try {
        const data = await apiFetch('/study-sessions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_id: activeDoc.id,
            duration_seconds: elapsedStudyTime || (timerMaxMinutes * 60)
          })
        });
        if (data && !data.error) {
          if (data.updated_streak !== undefined) {
            setActiveUser(prev => prev ? { ...prev, streak: data.updated_streak } : null);
          }
        }
        fetchAnalytics();
      } catch (e) {
        console.error(e);
      }
    }
    
    setElapsedStudyTime(0);
    setTimerMinutes(timerMaxMinutes);
    setTimerSeconds(0);
  };

  const handleSelectQuizAnswer = (qId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const getQuizScore = () => {
    let score = 0;
    quizzes.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  // Single fetch on auth state — avoids double-fetching on mount
  // isAuthenticated starts false then flips to true after /auth/me resolves
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDocuments();
      fetchFlashcardDecks();
      fetchAnalytics();
      fetchTasks();
      fetchFriends();
    }
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated]);

  // Update Notes when activeDoc changes
  useEffect(() => {
    if (activeDoc) {
      fetchNotesForDoc(activeDoc.id);
      setChatMessages([
        { sender: 'ai', text: `Xin chào ${activeUser?.name || 'bạn'}! Tôi là trợ lý học tập AI. Tôi đã đọc xong tài liệu **"${activeDoc.title}"** và đã sẵn sàng thảo luận cùng bạn. Bạn có muốn tôi tóm tắt hay giải thích phần nào không?` }
      ]);
      setQuizzes([]);
      setQuizSubmitted(false);
      setSelectedAnswers({});
    }
  }, [activeDoc]);

  // Update Cards when activeDeck changes
  useEffect(() => {
    if (activeDeck) {
      fetchCardsForDeck(activeDeck.id);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
    }
  }, [activeDeck]);

  // Study Timer — use a single stable interval with refs to avoid re-renders every second
  const timerMinutesRef = useRef(timerMinutes);
  const timerSecondsRef = useRef(timerSeconds);
  timerMinutesRef.current = timerMinutes;
  timerSecondsRef.current = timerSeconds;

  useEffect(() => {
    if (!timerActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedStudyTime(prev => prev + 1);
      if (timerSecondsRef.current > 0) {
        setTimerSeconds(s => s - 1);
      } else if (timerMinutesRef.current === 0) {
        clearInterval(timerRef.current!);
        handleTimerComplete();
      } else {
        setTimerMinutes(m => m - 1);
        setTimerSeconds(59);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  // Active User precise time tracking using Page Visibility API and Idle Detection
  useEffect(() => {
    if (!isAuthenticated || !activeUser) {
      activeTrackerIsUserActiveRef.current = false;
      return;
    }

    activeTrackerLastActiveTimeRef.current = Date.now();
    activeTrackerUnsentSecondsRef.current = 0;
    activeTrackerIsUserActiveRef.current = document.visibilityState === 'visible';
    const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds
    let idleTimer: NodeJS.Timeout | null = null;

    let authFailed = false;

    // Khi token hết hạn (401): dừng toàn bộ tracker, xoá token và buộc đăng nhập lại.
    // Tránh việc spam request 401 liên tục khiến trang bị chậm/lag.
    const handleAuthExpired = () => {
      if (authFailed) return;
      authFailed = true;
      activeTrackerIsUserActiveRef.current = false;
      console.warn('[AUTH_FE_DEBUG] [HANDLE_AUTH_EXPIRED_PING] /active-ping returned 401! (Wipe bypassed for audit)');
      console.trace();
      // Bypassed for log-only audit
    };

    const sendPing = (seconds: number) => {
      if (authFailed) return;
      apiFetch('/study-sessions/active-ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seconds })
      })
      .then(data => {
        if (data && data.task_update) {
          const { task, justCompleted } = data.task_update;
          if (task) {
            setTasks(prev => prev.map(t => t.task_type === task.task_type ? task : t));
            if (justCompleted) {
              setTaskCompletionToast({ type: task.task_type, title: task.title });
              triggerMessage(`Chúc mừng! Bạn đã hoàn thành nhiệm vụ "${task.title}"! 🎉`, "success");
            }
          }
        }
      })
      .catch(err => console.error("Error pinging activity:", err));
    };

    const sendBeaconPing = (seconds: number) => {
      if (authFailed) return;
      // Modern keepalive fetch with HttpOnly cookie (no query token in URL)
      try {
        fetch(`${API_BASE_URL}/study-sessions/active-ping`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds }),
          keepalive: true
        }).catch(() => {});
      } catch (e) {
        // Fallback sendBeacon without query token
        const blob = new Blob([JSON.stringify({ seconds })], {
          type: 'application/json'
        });
        navigator.sendBeacon(`${API_BASE_URL}/study-sessions/active-ping`, blob);
      }
    };

    const flushActiveTime = (isUnloading = false) => {
      if (authFailed) return;
      if (activeTrackerIsUserActiveRef.current) {
        const elapsedMs = Date.now() - activeTrackerLastActiveTimeRef.current;
        activeTrackerUnsentSecondsRef.current += elapsedMs / 1000;
        activeTrackerLastActiveTimeRef.current = Date.now();
      }
      
      const secondsToSend = Math.floor(activeTrackerUnsentSecondsRef.current);
      if (secondsToSend >= 1) {
        activeTrackerUnsentSecondsRef.current -= secondsToSend;
        if (isUnloading) {
          sendBeaconPing(secondsToSend);
        } else {
          sendPing(secondsToSend);
        }
      }
    };

    const resetIdleTimer = () => {
      if (!activeTrackerIsUserActiveRef.current && document.visibilityState === 'visible') {
        activeTrackerIsUserActiveRef.current = true;
        activeTrackerLastActiveTimeRef.current = Date.now();
      }
      
      if (idleTimer) clearTimeout(idleTimer);
      
      idleTimer = setTimeout(() => {
        flushActiveTime();
        activeTrackerIsUserActiveRef.current = false;
      }, IDLE_TIMEOUT_MS);
    };

    // Initialize idle timer
    resetIdleTimer();

    // 1. Page Visibility API & Unload listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushActiveTime(true);
        activeTrackerIsUserActiveRef.current = false;
        if (idleTimer) clearTimeout(idleTimer);
      } else {
        activeTrackerIsUserActiveRef.current = true;
        activeTrackerLastActiveTimeRef.current = Date.now();
        resetIdleTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handlePageHide = () => {
      flushActiveTime(true);
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    // 2. Custom Activity (Idle Detection) listeners
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleUserActivity = () => {
      resetIdleTimer();
    };
    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // 3. Periodic heartbeat — check every 5s, flush at 60s to reduce network spam
    const interval = setInterval(() => {
      if (authFailed) return;
      if (activeTrackerIsUserActiveRef.current && document.visibilityState === 'visible') {
        const elapsedMs = Date.now() - activeTrackerLastActiveTimeRef.current;
        activeTrackerUnsentSecondsRef.current += elapsedMs / 1000;
        activeTrackerLastActiveTimeRef.current = Date.now();

        if (activeTrackerUnsentSecondsRef.current >= 60) {
          flushActiveTime();
        }
      }
    }, 5000);

    // Cleanup when component unmounts or user logs out
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (idleTimer) clearTimeout(idleTimer);
      clearInterval(interval);
      
      // Flush remaining active seconds using beacon
      flushActiveTime(true);
    };
  }, [isAuthenticated, activeUser?.id]);

  return (
    <StudyContext.Provider value={{
      isAuthenticated,
      setIsAuthenticated,
      loading,
      login,
      register,
      logout,
      updateAvatar,
      updateProfile,
      toggleVerification,
      verify2FA,
      changePassword,
      upgradePremium,
      showLanding,
      setShowLanding,
      showLoginModal,
      setShowLoginModal,
      activeUser,
      setActiveUser,
      searchQuery,

      setSearchQuery,
      categoryFilter,
      setCategoryFilter,
      globalMessage,
      triggerMessage,

      documents,
      fetchDocuments,
      activeDoc,
      setActiveDoc,
      handleOpenWorkspace,
      showAddDocModal,
      setShowAddDocModal,
      newDocTitle,
      setNewDocTitle,
      newDocCat,
      setNewDocCat,
      newDocDesc,
      setNewDocDesc,
      newDocContent,
      setNewDocContent,
      newDocSolution,
      setNewDocSolution,
      handleAddDocumentSubmit,
      handleDeleteDocument,
      handleEditDocument,

      decks,
      fetchFlashcardDecks,
      invalidateCache,
      activeDeck,
      setActiveDeck,
      activeDeckCards,
      setActiveDeckCards,
      fetchCardsForDeck,
      currentCardIndex,
      setCurrentCardIndex,
      isCardFlipped,
      setIsCardFlipped,
      generatingFC,
      handleReviewCard,
      showAddDeckModal,
      setShowAddDeckModal,
      newDeckName,
      setNewDeckName,
      newDeckDesc,
      setNewDeckDesc,
      handleAddDeckSubmit,

      notesText,
      setNotesText,
      notesTitle,
      setNotesTitle,
      notesSaving,
      notesSavedTime,
      handleSaveNotes,

      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatLoading,
      aiWorkspaceTab,
      setAiWorkspaceTab,
      handleSendChatMessage,

      timerMinutes,
      setTimerMinutes,
      timerSeconds,
      setTimerSeconds,
      timerActive,
      setTimerActive,
      timerMaxMinutes,
      setTimerMaxMinutes,
      elapsedStudyTime,
      setElapsedStudyTime,

      quizzes,
      quizLoading,
      selectedAnswers,
      setSelectedAnswers,
      quizSubmitted,
      setQuizSubmitted,
      handleGenerateQuiz,
      handleSelectQuizAnswer,
      getQuizScore,

      analyticsData,
      fetchAnalytics,

      tasks,
      setTasks,
      friends,
      fetchTasks,
      fetchFriends,
      triggerTaskProgress,
      taskCompletionToast,
      setTaskCompletionToast,
      taskProgressToast,
      setTaskProgressToast,
      showDailyRecommendModal,
      setShowDailyRecommendModal,
      showPremiumModal,
      setShowPremiumModal,

      // Notifications
      notifications,
      unreadNotificationCount,
      fetchNotificationsList,
      markNotificationRead,
      markAllNotificationsRead,
    }}>
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyContextProvider");
  }
  return context;
};
