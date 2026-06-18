"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface DocumentItem {
  id: number;
  user_id: number;
  title: string;
  description: string;
  doc_url: string;
  solution_text: string;
  solution_url: string;
  category: string;
  created_at: string;
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
  document_id: number | null;
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
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; email?: string }>;
  register: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  activeUser: { id: number; name: string; email: string; phone?: string; education?: string; address?: string; website?: string; avatar_url?: string; is_verified?: boolean; streak?: number; last_study_date?: string; study_dates?: string[]; wallet_balance?: number; privacy_setting?: string; created_at?: string } | null;
  setActiveUser: (user: { id: number; name: string; email: string; phone?: string; education?: string; address?: string; website?: string; avatar_url?: string; is_verified?: boolean; streak?: number; last_study_date?: string; study_dates?: string[]; wallet_balance?: number; privacy_setting?: string; created_at?: string } | null) => void;
  updateWalletBalance: (amount: number) => void;
  updateAvatar: (file: File) => Promise<boolean>;
  updateProfile: (fields: { name: string; phone?: string; education?: string; address?: string; privacy_setting?: string }) => Promise<boolean>;
  toggleVerification: (enable: boolean) => Promise<boolean>;
  verify2FA: (email: string, code: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
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
  handleDeleteDocument: (id: number) => Promise<void>;
  handleEditDocument: (id: number, title: string, category?: string, description?: string) => Promise<boolean>;

  // Decks & Flashcards
  decks: FlashcardDeck[];
  fetchFlashcardDecks: () => Promise<void>;
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
  handleGenerateFlashcardsFromDoc: () => Promise<void>;
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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 1,
    user_id: 2,
    title: "Trí tuệ nhân tạo & Mô hình ngôn ngữ lớn (LLM)",
    description: "Tổng quan kiến thức về LLM, cơ chế Transformer và Spaced Repetition.",
    doc_url: "",
    solution_text: "Giải thích chi tiết về kiến trúc Transformer, cơ chế Self-Attention.",
    solution_url: "",
    category: "Trí tuệ nhân tạo",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 2,
    title: "Toán học nâng cao - Giải tích đại số",
    description: "Giáo trình toán cao cấp và các phương pháp giải tích phân tích nâng cao.",
    doc_url: "",
    solution_text: "Giải tích 1, Tích phân suy rộng, Chuỗi Fourier.",
    solution_url: "",
    category: "Toán học",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    user_id: 2,
    title: "Ngoại ngữ - Tiếng Anh IELTS Vocabulary",
    description: "Các chủ đề từ vựng học thuật phổ biến trong bài thi IELTS.",
    doc_url: "",
    solution_text: "IELTS vocabulary topics: Environment, Technology, Education.",
    solution_url: "",
    category: "Ngoại ngữ",
    created_at: new Date().toISOString()
  }
];

const MOCK_DECKS: FlashcardDeck[] = [
  {
    id: 1,
    user_id: 2,
    name: "Toán học nâng cao",
    description: "Spaced repetition cards for calculus, linear algebra, and formulas.",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 2,
    name: "English Vocabulary",
    description: "Academic IELTS vocab and collocation flashcards.",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    user_id: 2,
    name: "Trí tuệ nhân tạo",
    description: "Active recall cards for LLM architectures and training phases.",
    created_at: new Date().toISOString()
  }
];

const MOCK_CARDS: Record<number, FlashcardItem[]> = {
  1: [
    {
      id: 101,
      deck_id: 1,
      document_id: 2,
      front: "Đạo hàm của hàm số y = ln(x) là gì?",
      back: "y' = 1/x (với x > 0)",
      ease_factor: 2.5,
      repetitions: 0,
      interval_days: 0,
      next_review_at: new Date().toISOString()
    },
    {
      id: 102,
      deck_id: 1,
      document_id: 2,
      front: "Tích phân bất định của hàm số f(x) = e^x là gì?",
      back: "∫ e^x dx = e^x + C",
      ease_factor: 2.5,
      repetitions: 0,
      interval_days: 0,
      next_review_at: new Date().toISOString()
    }
  ],
  2: [
    {
      id: 201,
      deck_id: 2,
      document_id: 3,
      front: "Định nghĩa Collocation?",
      back: "Sự kết hợp tự nhiên của hai hoặc nhiều từ theo thói quen của người bản xứ (ví dụ: 'make a decision').",
      ease_factor: 2.5,
      repetitions: 0,
      interval_days: 0,
      next_review_at: new Date().toISOString()
    }
  ],
  3: [
    {
      id: 301,
      deck_id: 3,
      document_id: 1,
      front: "Cơ chế Transformer được giới thiệu lần đầu trong bài báo nào?",
      back: "Bài báo 'Attention Is All You Need' (năm 2017) của Google.",
      ease_factor: 2.5,
      repetitions: 0,
      interval_days: 0,
      next_review_at: new Date().toISOString()
    }
  ]
};

const MOCK_ANALYTICS = {
  total_study_minutes: 185,
  total_sessions: 12,
  total_documents: 3,
  total_flashcards: 5,
  streak: 12,
  total_reviews: 0,
  total_notes: 0,
  chart_data: [
    { day: 'Thứ 2', minutes: 30 },
    { day: 'Thứ 3', minutes: 45 },
    { day: 'Thứ 4', minutes: 20 },
    { day: 'Thứ 5', minutes: 60 },
    { day: 'Thứ 6', minutes: 15 },
    { day: 'Thứ 7', minutes: 40 },
    { day: 'Chủ Nhật', minutes: 50 },
  ]
};

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeUser, setActiveUser] = useState<{ id: number; name: string; email: string; phone?: string; education?: string; address?: string; website?: string; avatar_url?: string; is_verified?: boolean; streak?: number; last_study_date?: string; study_dates?: string[]; wallet_balance?: number; privacy_setting?: string; created_at?: string } | null>(null);

  const updateWalletBalance = (amount: number) => {
    setActiveUser(prev => prev ? { ...prev, wallet_balance: (prev.wallet_balance || 0) + amount } : null);
  };
  const [searchQuery, setSearchQuery] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [globalMessage, setGlobalMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });

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
  const [analyticsData, setAnalyticsData] = useState({
    total_study_minutes: 0,
    total_sessions: 0,
    total_documents: 0,
    total_flashcards: 0,
    streak: 0,
    total_reviews: 0,
    total_notes: 0,
    chart_data: [] as { day: string; minutes: number }[]
  });

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
  const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; email?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires2FA) {
          triggerMessage(data.message || 'Vui lòng nhập mã xác thực từ email', 'success');
          return { success: true, requires2FA: true, email: data.email };
        }
        localStorage.setItem('token', data.token);
        setActiveUser(data.user);
        setIsAuthenticated(true);
        setShowDailyRecommendModal(true);
        triggerMessage(data.message || 'Đăng nhập thành công', 'success');
        return { success: true };
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
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
    // 1. Flush any active time BEFORE removing the token!
    if (activeTrackerUnsentSecondsRef.current > 0 || activeTrackerIsUserActiveRef.current) {
      const token = localStorage.getItem('token');
      if (token) {
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
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ seconds: totalToSend })
            });
          } catch (e) {
            console.error("Error flushing active time in logout:", e);
          }
        }
      }
    }

    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('token');
    setActiveUser(null);
    setIsAuthenticated(false);
    triggerMessage('Đăng xuất thành công', 'success');
  };

  const updateAvatar = async (file: File): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
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

  const updateProfile = async (fields: { name: string; phone?: string; education?: string; address?: string; privacy_setting?: string }): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('token');
    if (!token) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return false;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/toggle-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem('token');
    if (!token) {
      triggerMessage("Bạn chưa đăng nhập", "error");
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
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

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      // Optimistically assume authenticated if token exists to prevent layout shifting
      // or kicking user out during dev server restarts
      setIsAuthenticated(true);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setActiveUser(data.user);
          setIsAuthenticated(true);
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          setActiveUser(null);
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  // API Call: Fetch Documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setDocuments(data);
          return;
        }
      }
      setDocuments(MOCK_DOCUMENTS);
    } catch (e) {
      console.error("Error fetching docs:", e);
      setDocuments(MOCK_DOCUMENTS);
    }
  };

  // API Call: Fetch Decks
  const fetchFlashcardDecks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/flashcards/decks`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setDecks(data);
          return;
        }
      }
      setDecks(MOCK_DECKS);
    } catch (e) {
      console.error("Error fetching decks:", e);
      setDecks(MOCK_DECKS);
    }
  };

  // API Call: Fetch cards in a deck
  const fetchCardsForDeck = async (deckId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/flashcards/decks/${deckId}/cards`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setActiveDeckCards(data);
          return;
        }
      }
      setActiveDeckCards(MOCK_CARDS[deckId] || []);
    } catch (e) {
      console.error("Error fetching cards:", e);
      setActiveDeckCards(MOCK_CARDS[deckId] || []);
    }
  };

  // API Call: Fetch notes for active document
  const fetchNotesForDoc = async (docId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/document/${docId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setNotesTitle(data[0].title);
          setNotesText(data[0].content);
        } else {
          setNotesTitle('Ghi chú của tôi');
          setNotesText('');
        }
      }
    } catch (e) {
      console.error("Error fetching notes:", e);
    }
  };

  // API Call: Fetch stats
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/study-sessions/stats`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
        return;
      }
      setAnalyticsData(MOCK_ANALYTICS);
    } catch (e) {
      console.error("Error fetching stats:", e);
      setAnalyticsData(MOCK_ANALYTICS);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/friends`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (e) {
      console.error("Error fetching friends:", e);
    }
  };

  const triggerTaskProgress = async (taskType: string, increment: number = 1) => {
    try {
      const prevTask = tasks.find(t => t.task_type === taskType);
      const previousValue = prevTask ? prevTask.current_value : 0;

      const res = await fetch(`${API_BASE_URL}/tasks/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ task_type: taskType, increment })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedTask = data.task;
        if (updatedTask) {
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
      const res = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
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

      if (res.ok) {
        triggerMessage("Tải lên tài liệu học tập thành công!");
        setShowAddDocModal(false);
        setNewDocTitle('');
        setNewDocDesc('');
        setNewDocContent('');
        setNewDocSolution('');
        fetchDocuments();
        fetchAnalytics();
      } else {
        triggerMessage("Không thể thêm tài liệu mới", "error");
      }
    } catch (e) {
      triggerMessage("Lỗi kết nối server", "error");
    }
  };

  // API Call: Delete Document
  const handleDeleteDocument = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này khỏi thư viện?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        triggerMessage("Đã xóa tài liệu thành công");
        fetchDocuments();
        fetchAnalytics();
        if (activeDoc?.id === id) setActiveDoc(null);
      }
    } catch (e) {
      triggerMessage("Lỗi khi xóa tài liệu", "error");
    }
  };

  // API Call: Edit Document (Rename / Edit)
  const handleEditDocument = async (id: number, title: string, category?: string, description?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ title, category, description })
      });
      if (res.ok) {
        triggerMessage("Đã chỉnh sửa thông tin tài liệu thành công");
        fetchDocuments();
        return true;
      } else {
        const err = await res.json();
        triggerMessage(err.error || "Lỗi khi chỉnh sửa tài liệu", "error");
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
      const res = await fetch(`${API_BASE_URL}/flashcards/decks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          name: newDeckName,
          description: newDeckDesc
        })
      });

      if (res.ok) {
        triggerMessage("Đã tạo bộ thẻ ghi nhớ mới!");
        setShowAddDeckModal(false);
        setNewDeckName('');
        setNewDeckDesc('');
        fetchFlashcardDecks();
        fetchAnalytics();
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
      const res = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          document_id: activeDoc.id,
          title: notesTitle,
          content: notesText
        })
      });

      if (res.ok) {
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
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          document_id: activeDoc.id,
          message: userMsg
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: "Tôi đang gặp khó khăn khi truy xuất thông tin này. Bạn vui lòng thử lại nhé." }]);
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
      const res = await fetch(`${API_BASE_URL}/ai/generate-quiz`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ document_id: activeDoc.id })
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes);
        triggerMessage("Đã tạo câu hỏi ôn tập thành công!");
      }
    } catch (e) {
      triggerMessage("Lỗi khi tạo Quiz", "error");
    } finally {
      setQuizLoading(false);
    }
  };

  // API Call: Auto-Generate Flashcards from document using AI
  const handleGenerateFlashcardsFromDoc = async () => {
    if (!activeDoc || !activeDeck) return;
    setGeneratingFC(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai/generate-flashcards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          document_id: activeDoc.id,
          deck_id: activeDeck.id
        })
      });

      if (res.ok) {
        triggerMessage("AI đã tự động phân tích và tạo flashcards thành công!");
        fetchCardsForDeck(activeDeck.id);
        fetchAnalytics();
      }
    } catch (e) {
      triggerMessage("Lỗi khi tạo flashcard bằng AI", "error");
    } finally {
      setGeneratingFC(false);
    }
  };

  // API Call: Spaced Repetition card review feedback
  const handleReviewCard = async (difficulty: 'easy' | 'good' | 'hard') => {
    if (activeDeckCards.length === 0) return;
    const currentCard = activeDeckCards[currentCardIndex];
    
    try {
      const res = await fetch(`${API_BASE_URL}/flashcards/review/${currentCard.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ difficulty })
      });

      if (res.ok) {
        const data = await res.json();
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
        const res = await fetch(`${API_BASE_URL}/study-sessions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            document_id: activeDoc.id,
            duration_seconds: elapsedStudyTime || (timerMaxMinutes * 60)
          })
        });
        if (res.ok) {
          const data = await res.json();
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

  // Initial Fetches
  useEffect(() => {
    fetchDocuments();
    fetchFlashcardDecks();
    fetchAnalytics();
    const token = localStorage.getItem('token');
    if (token) {
      fetchTasks();
      fetchFriends();
    }
  }, []);

  // Refetch data when user logs in/authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
      fetchFlashcardDecks();
      fetchAnalytics();
      fetchTasks();
      fetchFriends();
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

  // Study Timer countdown mechanism
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            handleTimerComplete();
          } else {
            setTimerMinutes(timerMinutes - 1);
            setTimerSeconds(59);
          }
        }
        setElapsedStudyTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timerMinutes, timerSeconds]);

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

    const sendPing = (seconds: number) => {
      fetch(`${API_BASE_URL}/study-sessions/active-ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ seconds })
      })
      .then(res => {
        if (res.ok) return res.json();
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
      const token = localStorage.getItem('token');
      if (!token) return;
      const url = `${API_BASE_URL}/study-sessions/active-ping?token=${encodeURIComponent(token)}`;
      const blob = new Blob([JSON.stringify({ seconds })], {
        type: 'application/json'
      });
      navigator.sendBeacon(url, blob);
    };

    const flushActiveTime = (isUnloading = false) => {
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

    // 3. Periodic heartbeat accumulator checker (every 1 second, pinging at 30 seconds)
    const interval = setInterval(() => {
      if (activeTrackerIsUserActiveRef.current && document.visibilityState === 'visible') {
        const elapsedMs = Date.now() - activeTrackerLastActiveTimeRef.current;
        activeTrackerUnsentSecondsRef.current += elapsedMs / 1000;
        activeTrackerLastActiveTimeRef.current = Date.now();

        // Send a heartbeat ping every 30 seconds of accumulated activity
        if (activeTrackerUnsentSecondsRef.current >= 30) {
          flushActiveTime();
        }
      }
    }, 1000);

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
      showLanding,
      setShowLanding,
      showLoginModal,
      setShowLoginModal,
      activeUser,
      setActiveUser,
      updateWalletBalance,
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
      handleGenerateFlashcardsFromDoc,
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
      setShowPremiumModal
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
