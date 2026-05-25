"use client";

import { useState, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================
interface DocumentItem {
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

interface NoteItem {
  id: number;
  user_id: number;
  document_id: number;
  title: string;
  content: string;
  created_at: string;
}

interface FlashcardDeck {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
}

interface FlashcardItem {
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

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AppDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'documents' | 'workspace' | 'flashcards' | 'analytics'>('documents');
  
  // Active learning entities
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  
  // Data lists
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [activeDeckCards, setActiveDeckCards] = useState<FlashcardItem[]>([]);
  
  // Workspace specific states
  const [notesText, setNotesText] = useState('');
  const [notesTitle, setNotesTitle] = useState('Ghi chú của tôi');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedTime, setNotesSavedTime] = useState<string>('');
  
  // AI Chat states
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

  // AI Quiz states
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);
  const [generatingFC, setGeneratingFC] = useState(false);

  // Document Upload state
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCat, setNewDocCat] = useState('Trí tuệ nhân tạo');
  const [newDocDesc, setNewDocDesc] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newDocSolution, setNewDocSolution] = useState('');

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    total_study_minutes: 0,
    total_sessions: 0,
    total_documents: 0,
    total_flashcards: 0,
    chart_data: [] as { day: string; minutes: number }[]
  });

  // Global system UI states
  const [activeUser] = useState({ id: 2, name: 'Nguyễn Văn Học', email: 'hocvien@edushare.com' });
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [globalMessage, setGlobalMessage] = useState({ text: '', type: 'success' });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ============================================================================
  // EFFECTS & FETCHES
  // ============================================================================
  useEffect(() => {
    fetchDocuments();
    fetchFlashcardDecks();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeDoc) {
      // Fetch notes for the active document
      fetchNotesForDoc(activeDoc.id);
      
      // Seed default AI greetings
      setChatMessages([
        { sender: 'ai', text: `Xin chào ${activeUser.name}! Tôi là trợ lý học tập AI. Tôi đã đọc xong tài liệu **"${activeDoc.title}"** và đã sẵn sàng thảo luận cùng bạn. Bạn có muốn tôi tóm tắt hay giải thích phần nào không?` }
      ]);

      // Reset quiz
      setQuizzes([]);
      setQuizSubmitted(false);
      setSelectedAnswers({});
    }
  }, [activeDoc]);

  useEffect(() => {
    if (activeDeck) {
      fetchCardsForDeck(activeDeck.id);
      setCurrentCardIndex(0);
      setIsCardFlipped(false);
    }
  }, [activeDeck]);

  // Scroll AI chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Study Timer countdown mechanism
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            // Timer Finished!
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

  // Toast message trigger helper
  const triggerMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setGlobalMessage({ text, type });
    setTimeout(() => {
      setGlobalMessage({ text: '', type: 'success' });
    }, 4000);
  };

  // API Call: Fetch Documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Error fetching docs:", e);
    }
  };

  // API Call: Fetch Decks
  const fetchFlashcardDecks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/flashcards/decks`);
      if (res.ok) {
        const data = await res.json();
        setDecks(data);
      }
    } catch (e) {
      console.error("Error fetching decks:", e);
    }
  };

  // API Call: Fetch cards in a deck
  const fetchCardsForDeck = async (deckId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/flashcards/decks/${deckId}/cards`);
      if (res.ok) {
        const data = await res.json();
        setActiveDeckCards(data);
      }
    } catch (e) {
      console.error("Error fetching cards:", e);
    }
  };

  // API Call: Fetch notes for active document
  const fetchNotesForDoc = async (docId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notes/document/${docId}`);
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
      const res = await fetch(`${API_BASE_URL}/study-sessions/stats`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser.id,
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
        // Clear inputs
        setNewDocTitle('');
        setNewDocDesc('');
        setNewDocContent('');
        setNewDocSolution('');
        // Refresh list
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
        method: 'DELETE'
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser.id,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser.id,
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
      });

      if (res.ok) {
        const data = await res.json();
        triggerMessage(`Thẻ ghi nhớ được lên lịch ôn tập sau ${data.next_review_days} ngày!`);
        
        // Go to next card
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

  // ============================================================================
  // WORKSPACE ACTION HANDLERS
  // ============================================================================
  const handleOpenWorkspace = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setActiveTab('workspace');
    setAiWorkspaceTab('chat');
    // Reset timer
    setTimerActive(false);
    setTimerMinutes(25);
    setTimerSeconds(0);
    setTimerMaxMinutes(25);
    setElapsedStudyTime(0);
  };

  const handleTimerComplete = async () => {
    setTimerActive(false);
    triggerMessage("Tuyệt vời! Bạn đã hoàn thành phiên học tập tập trung! 🎯");
    
    if (activeDoc) {
      // Save study session to DB
      try {
        await fetch(`${API_BASE_URL}/study-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: activeUser.id,
            document_id: activeDoc.id,
            duration_seconds: elapsedStudyTime || (timerMaxMinutes * 60)
          })
        });
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

  // Filtered documents search helper
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-cyan-500 selection:text-slate-900 relative overflow-hidden">
        {/* 🔮 Background glows for premium look */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Floating background grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 -z-20"></div>

        {/* 🔔 Toast notifications */}
        {globalMessage.text && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border transition-all duration-300 transform translate-y-0 ${
            globalMessage.type === 'success' 
              ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-900/90 text-rose-400 border-rose-500/30'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
            <span className="font-medium text-sm">{globalMessage.text}</span>
          </div>
        )}

        {/* Login Card */}
        <div className="w-full max-w-md p-8 bg-slate-900/40 border border-slate-900 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10 space-y-8 animate-fade-in">
          
          <div className="text-center space-y-2">
            <div className="inline-flex bg-gradient-to-tr from-cyan-500 to-purple-600 p-4 rounded-2xl shadow-xl shadow-cyan-500/15 mb-2.5">
              <svg className="w-8 h-8 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">EDUSHARE AI</h1>
            <p className="text-xs text-slate-400 font-medium">Đăng nhập tài khoản học viên để bắt đầu học tập</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            setIsLoggedIn(true);
            triggerMessage("Chào mừng bạn quay lại hệ thống học tập AI!", "success");
          }} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email Học viên</label>
              <input 
                type="email" 
                required
                defaultValue="hocvien@edushare.com"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-200 rounded-xl focus:outline-none transition-all placeholder:text-slate-700"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Mật khẩu</label>
              <input 
                type="password" 
                required
                defaultValue="password123"
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm text-slate-200 rounded-xl focus:outline-none transition-all placeholder:text-slate-700"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 pl-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="rounded border-slate-800 text-cyan-500 focus:ring-0 bg-slate-950" />
                Ghi nhớ đăng nhập
              </label>
              <a href="#" className="hover:text-cyan-400 transition">Quên mật khẩu?</a>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-slate-950 font-extrabold text-sm rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/15"
            >
              Đăng Nhập Hệ Thống
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-500 font-medium">Hệ thống học tập thông minh đồng bộ dữ liệu PostgreSQL & Docker</p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* 🔮 Background glows for premium look */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* 🔔 Toast notifications */}
      {globalMessage.text && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 border transition-all duration-300 transform translate-y-0 ${
          globalMessage.type === 'success' 
            ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/30' 
            : 'bg-slate-900/90 text-rose-400 border-rose-500/30'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full animate-ping ${globalMessage.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
          <span className="font-medium text-sm">{globalMessage.text}</span>
        </div>
      )}

      {/* 📡 HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-cyan-500/15">
            {/* SVG custom smart graduation cap logo */}
            <svg className="w-6 h-6 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent">EDUSHARE AI</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Nền tảng học tập thông minh</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2.5 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Kết nối Docker DB thành công
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-300">
              {activeUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold leading-none text-slate-200">{activeUser.name}</p>
              <p className="text-[10px] font-medium text-slate-400 leading-tight mt-1">{activeUser.email}</p>
            </div>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                triggerMessage("Đăng xuất thành công! Hẹn gặp lại bạn.", "success");
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-xl transition-all ml-1 flex items-center justify-center"
              title="Đăng xuất khỏi hệ thống"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 🚪 MAIN APP BODY */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* 🧭 SIDE NAVIGATION */}
        <aside className="w-72 border-r border-slate-900 bg-slate-950/80 p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-7">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Học tập & Tài liệu</p>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('documents')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'documents' 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Thư viện Tài liệu
                </button>

                <button 
                  onClick={() => {
                    if (activeDoc) handleOpenWorkspace(activeDoc);
                    else triggerMessage("Vui lòng chọn một tài liệu ở Thư viện trước", "error");
                  }} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'workspace' 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Phòng tự học AI
                  {activeDoc && <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>}
                </button>

                <button 
                  onClick={() => setActiveTab('flashcards')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'flashcards' 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                  </svg>
                  Thẻ ghi nhớ Flashcards
                </button>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Hiệu suất</p>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('analytics')} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === 'analytics' 
                      ? 'bg-gradient-to-r from-cyan-500/10 to-transparent text-cyan-400 border-l-2 border-cyan-500' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Thống kê học tập
                </button>
              </nav>
            </div>
          </div>

          {/* User profile card inside sidebar footer */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-300">Dự án Cognito v1.0</h4>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Hỗ trợ bởi trí tuệ nhân tạo Gemini NLP</p>
          </div>
        </aside>

        {/* 🖥️ MAIN CONTENT PANEL */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 md:p-8">
          
          {/* ====================================================================
              VIEW 1: DOCUMENTS LIST & MANAGEMENT
              ==================================================================== */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-900 rounded-2xl p-4 backdrop-blur-md">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm tài liệu..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters & Actions */}
                <div className="flex items-center gap-3">
                  <select 
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                  >
                    <option value="all">Tất cả danh mục</option>
                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                    <option value="Toán học">Toán học</option>
                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                  </select>

                  <button 
                    onClick={() => setShowAddDocModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Tải lên tài liệu
                  </button>
                </div>

              </div>

              {/* Document Library List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-200 tracking-tight">Thư viện học tập của tôi ({filteredDocs.length})</h2>
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 bg-slate-900/10">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div className="max-w-sm mx-auto space-y-2">
                      <h3 className="text-slate-300 font-bold text-md">Không tìm thấy tài liệu nào</h3>
                      <p className="text-slate-500 text-xs">Hãy thử đổi bộ lọc tìm kiếm hoặc nhấn nút Tải lên tài liệu ở góc trên để tạo mới.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDocs.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 group hover:shadow-xl hover:shadow-cyan-950/20"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              doc.category === 'Trí tuệ nhân tạo' 
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                : doc.category === 'Toán học' 
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {doc.category}
                            </span>
                            <p className="text-[10px] text-slate-500 font-semibold">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>

                          <h3 className="text-md font-bold text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">{doc.title}</h3>
                          <p className="text-slate-400 text-xs mt-2.5 line-clamp-3 leading-relaxed font-normal">{doc.description || 'Không có mô tả cho tài liệu này.'}</p>
                        </div>

                        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-900">
                          <button 
                            onClick={() => handleOpenWorkspace(doc)}
                            className="bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 text-xs font-bold px-4.5 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-950 hover:border-cyan-500 transition-all flex items-center gap-1.5 flex-1 justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Học với AI
                          </button>

                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all"
                            title="Xóa tài liệu"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ====================================================================
              VIEW 2: DYNAMIC STUDY WORKSPACE (HEART OF APP)
              ==================================================================== */}
          {activeTab === 'workspace' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
              
              {/* Header inside workspace */}
              {activeDoc ? (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 border border-slate-900 p-4.5 rounded-2xl">
                  <div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('documents')}
                        className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-md font-bold text-slate-100 line-clamp-1">{activeDoc.title}</h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium ml-8.5 mt-0.5">Danh mục: <span className="text-cyan-400 font-semibold">{activeDoc.category}</span></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-3 py-1 rounded-full uppercase tracking-wider">Trình tự học đang chạy</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-3xl space-y-4">
                  <p className="text-slate-400 text-sm">Chưa có tài liệu nào được chọn để đưa vào phòng học tự học.</p>
                  <button onClick={() => setActiveTab('documents')} className="bg-cyan-500 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-cyan-600 transition">Quay lại Thư viện chọn tài liệu</button>
                </div>
              )}

              {activeDoc && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                  
                  {/* Left Column: Smart Document Viewer Mockup */}
                  <div className="lg:col-span-7 bg-slate-900/25 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between overflow-y-auto min-h-[400px]">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nội dung Tài liệu đọc</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                          <span className="text-[10px] text-slate-400 font-semibold">TẬP TIN MÔ PHỎNG PDF</span>
                        </div>
                      </div>

                      {/* Mock Reading Sheet */}
                      <div className="prose prose-invert max-w-none text-slate-300 font-normal leading-relaxed text-sm space-y-4 bg-slate-950/40 border border-slate-900 p-5 rounded-2xl select-text">
                        <h2 className="text-slate-100 text-lg font-bold border-b border-slate-900 pb-2">{activeDoc.title}</h2>
                        
                        <p>{activeDoc.description || 'Đây là bản xem trước nội dung tài liệu. Trợ lý AI đã ghi nhớ đầy đủ ngữ cảnh để hỗ trợ bạn.'}</p>
                        
                        <div className="bg-slate-900/40 p-4 border border-slate-900 rounded-xl mt-4">
                          <h4 className="font-bold text-cyan-400 text-xs mb-1 uppercase tracking-wide">💡 GIỚI THIỆU PHƯƠNG PHÁP HỌC VỚI DOCKER & AI</h4>
                          <p className="text-[12px] text-slate-400 leading-normal">Hệ thống monorepo Cognito được đóng gói bằng Docker cho phép các service Backend và Frontend giao tiếp thời gian thực một cách tối ưu. Bạn có thể sử dụng chatbot bên cạnh để hỏi đáp chi tiết bất kỳ kiến thức nào thuộc tài liệu này.</p>
                        </div>

                        {activeDoc.solution_text && (
                          <div className="border border-cyan-900/30 bg-cyan-950/10 p-5 rounded-2xl mt-6">
                            <h4 className="font-extrabold text-sm text-cyan-400 flex items-center gap-1.5 mb-2.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Lời giải chi tiết đính kèm:
                            </h4>
                            <div className="text-slate-300 text-xs font-mono bg-slate-950 p-4 rounded-xl whitespace-pre-wrap border border-slate-900">
                              {activeDoc.solution_text}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-6">
                      <span className="text-[10px] text-slate-500 font-bold tracking-wide">EDUSHARE DOCUMENT READER v1.0</span>
                      {activeDoc.solution_url && (
                        <a 
                          href={activeDoc.solution_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          Tải lời giải đính kèm (PDF)
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Tabbed Workspace Widgets */}
                  <div className="lg:col-span-5 bg-slate-900/20 border border-slate-900 rounded-3xl flex flex-col overflow-hidden h-[600px] lg:h-auto">
                    
                    {/* Widget Menu Tabs */}
                    <div className="flex border-b border-slate-900 bg-slate-950 p-2 gap-1">
                      <button 
                        onClick={() => setAiWorkspaceTab('chat')} 
                        className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-xl transition ${
                          aiWorkspaceTab === 'chat' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Trợ lý AI
                      </button>
                      <button 
                        onClick={() => setAiWorkspaceTab('notes')} 
                        className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-xl transition ${
                          aiWorkspaceTab === 'notes' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ghi chú
                      </button>
                      <button 
                        onClick={() => setAiWorkspaceTab('timer')} 
                        className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-xl transition ${
                          aiWorkspaceTab === 'timer' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Bấm giờ
                      </button>
                      <button 
                        onClick={() => {
                          setAiWorkspaceTab('quiz');
                          if (quizzes.length === 0) handleGenerateQuiz();
                        }} 
                        className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-xl transition ${
                          aiWorkspaceTab === 'quiz' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        AI Quiz
                      </button>
                    </div>

                    {/* Tab Content Box */}
                    <div className="flex-1 flex flex-col p-5 overflow-hidden">
                      
                      {/* SUBTAB 1: AI CHAT ASSISTANT */}
                      {aiWorkspaceTab === 'chat' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                          {/* Messages panel */}
                          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text">
                            {chatMessages.map((msg, idx) => (
                              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                  msg.sender === 'user' 
                                    ? 'bg-gradient-to-tr from-cyan-600 to-sky-500 text-slate-950 font-semibold rounded-tr-none' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none font-normal'
                                }`}>
                                  {/* Render markdown lines slightly */}
                                  {msg.text.split('\n').map((line, lIdx) => {
                                    if (line.startsWith('###')) {
                                      return <h4 key={lIdx} className="font-extrabold text-sm my-1 text-cyan-300">{line.replace('###', '').trim()}</h4>;
                                    }
                                    if (line.startsWith('*')) {
                                      return <li key={lIdx} className="ml-3 my-0.5">{line.replace('*', '').trim()}</li>;
                                    }
                                    return <p key={lIdx} className="my-0.5">{line}</p>;
                                  })}
                                </div>
                              </div>
                            ))}
                            {chatLoading && (
                              <div className="flex justify-start">
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Quick Prompts list */}
                          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
                            <button 
                              onClick={() => { setChatInput("Hãy tóm tắt các nội dung cốt lõi của tài liệu này."); }}
                              className="text-[10px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              📝 Tóm tắt tài liệu
                            </button>
                            <button 
                              onClick={() => { setChatInput("Giải thích phần lời giải và đáp án chi tiết."); }}
                              className="text-[10px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              🔑 Giải đáp lời giải
                            </button>
                            <button 
                              onClick={() => { setChatInput("Làm thế nào để học tốt chủ đề này?"); }}
                              className="text-[10px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              🚀 Lộ trình ôn tập
                            </button>
                          </div>

                          {/* Input text send panel */}
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="Hỏi trợ lý AI học tập..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition placeholder:text-slate-600"
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                            />
                            <button 
                              onClick={handleSendChatMessage}
                              className="absolute right-2.5 top-2.5 p-1 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUBTAB 2: STUDY TIMER */}
                      {aiWorkspaceTab === 'timer' && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                          
                          {/* Circle widget timer view */}
                          <div className="relative w-44 h-44 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-2xl bg-slate-950/60">
                            {timerActive && (
                              <div className="absolute inset-0 rounded-full border-4 border-cyan-500 animate-pulse opacity-20"></div>
                            )}
                            <div className="text-center">
                              <p className="text-3xl font-black font-mono tracking-widest text-slate-100">
                                {timerMinutes < 10 ? '0' + timerMinutes : timerMinutes}:{timerSeconds < 10 ? '0' + timerSeconds : timerSeconds}
                              </p>
                              <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-1">Pomodoro đếm giờ</p>
                            </div>
                          </div>

                          {/* Predefined custom timer minutes sliders */}
                          <div className="w-full max-w-xs space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">Chọn thời lượng phiên học</p>
                            <div className="flex gap-2">
                              {[10, 25, 45, 60].map((m) => (
                                <button 
                                  key={m}
                                  disabled={timerActive}
                                  onClick={() => {
                                    setTimerMinutes(m);
                                    setTimerSeconds(0);
                                    setTimerMaxMinutes(m);
                                  }}
                                  className={`flex-1 py-1.5 rounded-lg border text-xs font-extrabold transition ${
                                    timerMaxMinutes === m 
                                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                                      : 'bg-slate-950/40 text-slate-500 border-slate-900 hover:text-slate-300'
                                  }`}
                                >
                                  {m}m
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Control timer trigger buttons */}
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setTimerActive(!timerActive)}
                              className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${
                                timerActive 
                                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-600' 
                                  : 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 hover:shadow-lg hover:shadow-cyan-500/20'
                              }`}
                            >
                              {timerActive ? 'Tạm dừng học' : 'Bắt đầu đếm giờ'}
                            </button>
                            <button 
                              onClick={() => {
                                setTimerActive(false);
                                setTimerMinutes(timerMaxMinutes);
                                setTimerSeconds(0);
                                setElapsedStudyTime(0);
                              }}
                              className="px-5 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-extrabold text-xs rounded-xl transition"
                            >
                              Đặt lại
                            </button>
                          </div>

                          {timerActive && (
                            <p className="text-[11px] text-slate-400 italic text-center animate-pulse">Bạn đang tập trung học tập. Giữ vững phong độ nhé! 🚀</p>
                          )}

                        </div>
                      )}

                      {/* SUBTAB 3: INTERACTIVE NOTES */}
                      {aiWorkspaceTab === 'notes' && (
                        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                          
                          {/* Notes title header */}
                          <div className="flex items-center justify-between">
                            <input 
                              type="text" 
                              value={notesTitle}
                              onChange={e => setNotesTitle(e.target.value)}
                              className="bg-transparent border-b border-transparent hover:border-slate-800 focus:border-cyan-500 font-bold text-sm text-slate-200 outline-none transition py-0.5 w-2/3"
                              placeholder="Nhập tiêu đề ghi chú..."
                            />
                            
                            <div className="flex items-center gap-2">
                              {notesSavedTime && (
                                <span className="text-[10px] text-slate-500 font-medium">Đã lưu: {notesSavedTime}</span>
                              )}
                              <button 
                                onClick={handleSaveNotes}
                                disabled={notesSaving}
                                className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                              >
                                {notesSaving ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full border border-slate-950 border-t-transparent animate-spin"></span>
                                    Đang lưu...
                                  </>
                                ) : 'Lưu ghi chú'}
                              </button>
                            </div>
                          </div>

                          {/* Notes textarea editor content */}
                          <textarea 
                            value={notesText}
                            onChange={e => setNotesText(e.target.value)}
                            placeholder="Ghi chú nhanh kiến thức quan trọng của bạn ở đây... (Gõ nội dung Markdown)"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-xs font-mono leading-relaxed outline-none focus:border-cyan-500 transition-all resize-none placeholder:text-slate-700"
                          />

                        </div>
                      )}

                      {/* SUBTAB 4: AI GENERATED QUIZ */}
                      {aiWorkspaceTab === 'quiz' && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                          
                          {/* Generate quiz loader block */}
                          {quizLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-xs text-slate-400 font-medium animate-pulse">Trợ lý AI đang đọc tài liệu để biên soạn câu hỏi...</p>
                            </div>
                          ) : quizzes.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
                              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="space-y-1.5">
                                <h4 className="text-slate-300 font-bold text-xs">Biên soạn bài ôn luyện với AI</h4>
                                <p className="text-slate-500 text-[11px] max-w-[250px] leading-relaxed">Nhấp vào nút dưới để trợ lý AI quét tài liệu này và sinh nhanh đề trắc nghiệm ôn tập.</p>
                              </div>
                              <button 
                                onClick={handleGenerateQuiz}
                                className="bg-cyan-500 text-slate-950 text-xs font-bold px-4.5 py-2.5 rounded-xl hover:bg-cyan-600 transition"
                              >
                                Bắt đầu biên soạn Quiz
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col overflow-hidden select-text">
                              
                              {/* Quizzes list wrapper container */}
                              <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
                                {quizzes.map((q, idx) => (
                                  <div key={q.id} className="bg-slate-900/35 border border-slate-900 rounded-2xl p-4.5 space-y-3.5">
                                    <p className="text-xs font-extrabold text-slate-200 leading-snug">Câu {idx + 1}: {q.question}</p>
                                    
                                    {/* Options list */}
                                    <div className="space-y-2">
                                      {q.options.map((opt, oIdx) => {
                                        const isSelected = selectedAnswers[q.id] === oIdx;
                                        const isCorrect = q.correctAnswer === oIdx;
                                        
                                        let btnClass = "bg-slate-950 hover:bg-slate-900 text-slate-400 border-slate-900";
                                        if (isSelected) {
                                          btnClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/35 font-semibold";
                                        }
                                        if (quizSubmitted) {
                                          if (isCorrect) {
                                            btnClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 font-bold";
                                          } else if (isSelected) {
                                            btnClass = "bg-rose-500/10 text-rose-400 border-rose-500/40";
                                          } else {
                                            btnClass = "bg-slate-950/30 text-slate-600 border-slate-950 opacity-60";
                                          }
                                        }

                                        return (
                                          <button 
                                            key={oIdx}
                                            disabled={quizSubmitted}
                                            onClick={() => handleSelectQuizAnswer(q.id, oIdx)}
                                            className={`w-full text-left p-3 text-[11px] rounded-xl border transition-all flex items-start gap-2.5 ${btnClass}`}
                                          >
                                            <span className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[9px] shrink-0 font-bold mt-0.5">
                                              {String.fromCharCode(65 + oIdx)}
                                            </span>
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Explanation feedback block */}
                                    {quizSubmitted && (
                                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-[10px] text-slate-400 leading-relaxed font-normal">
                                        <span className="font-extrabold text-cyan-400 uppercase tracking-wider block mb-1">Giải thích từ AI:</span>
                                        {q.explanation}
                                      </div>
                                    )}

                                  </div>
                                ))}
                              </div>

                              {/* Quiz grading bottom trigger actions */}
                              <div className="pt-3.5 border-t border-slate-900 flex items-center justify-between">
                                {quizSubmitted ? (
                                  <div className="flex items-center gap-3">
                                    <p className="text-xs font-extrabold text-slate-200">Kết quả: <span className="text-cyan-400 text-sm font-black">{getQuizScore()}/{quizzes.length}</span> đúng</p>
                                    <button 
                                      onClick={handleGenerateQuiz}
                                      className="text-xs text-cyan-400 hover:underline font-bold"
                                    >
                                      Làm đề khác
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setQuizSubmitted(true)}
                                    disabled={Object.keys(selectedAnswers).length < quizzes.length}
                                    className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-xs font-black py-2.5 rounded-xl transition"
                                  >
                                    Nộp bài chấm điểm
                                  </button>
                                )}
                              </div>

                            </div>
                          )}

                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* ====================================================================
              VIEW 3: FLASHCARDS HUB (SPACED REPETITION)
              ==================================================================== */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              
              {activeDeck ? (
                // DECK BOARD / SESSION PLAYING
                <div className="space-y-6 max-w-2xl mx-auto">
                  
                  {/* Deck session header control */}
                  <div className="flex items-center justify-between bg-slate-900/40 border border-slate-900 p-4.5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setActiveDeck(null);
                          fetchFlashcardDecks();
                        }}
                        className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div>
                        <h2 className="text-md font-bold text-slate-200">{activeDeck.name}</h2>
                        <p className="text-[10px] text-slate-500 font-medium">Số lượng: <span className="text-slate-300 font-semibold">{activeDeckCards.length} thẻ ghi nhớ</span></p>
                      </div>
                    </div>

                    {/* AI Generator Flashcard trigger */}
                    {activeDoc && (
                      <button 
                        onClick={handleGenerateFlashcardsFromDoc}
                        disabled={generatingFC}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 text-slate-100 text-[11px] font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-purple-600/10 border border-purple-500/20"
                      >
                        {generatingFC ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-100 border-t-transparent animate-spin"></span>
                            AI đang tạo...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI sinh Flashcards
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {activeDeckCards.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 bg-slate-900/10">
                      <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="max-w-sm mx-auto space-y-2">
                        <h4 className="text-slate-300 font-bold text-xs">Bộ thẻ trống</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          {activeDoc 
                            ? 'Vui lòng nhấn nút "AI sinh Flashcards" ở góc trên để AI tự động trích xuất thẻ ghi nhớ từ tài liệu hiện tại của bạn!'
                            : 'Không có thẻ ghi nhớ nào trong bộ này. Hãy vào mục tự học AI để tạo thẻ từ tài liệu.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* CARD BOARD VIEW (SMOOTH FLIP TRANSITION MOCKUP) */}
                      <div 
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="relative h-64 w-full bg-slate-900/40 border border-slate-900 hover:border-slate-800 rounded-3xl p-6 flex flex-col justify-between items-center text-center cursor-pointer select-none transition-all duration-300 shadow-2xl hover:shadow-cyan-950/10"
                      >
                        <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                          Thẻ {currentCardIndex + 1} / {activeDeckCards.length} — {isCardFlipped ? 'MẶT SAU' : 'MẶT TRƯỚC'}
                        </div>

                        <div className="max-w-md select-text">
                          <h3 className="text-md sm:text-lg font-bold text-slate-200 leading-snug">
                            {isCardFlipped 
                              ? activeDeckCards[currentCardIndex].back 
                              : activeDeckCards[currentCardIndex].front}
                          </h3>
                        </div>

                        <div className="text-[10px] text-cyan-400/70 font-semibold animate-pulse tracking-wide">
                          (Nhấn vào thẻ bất kỳ đâu để lật xem đáp án)
                        </div>
                      </div>

                      {/* SPACED REPETITION SRS FEEDBACK CONTROLS */}
                      {isCardFlipped && (
                        <div className="space-y-3 bg-slate-900/20 border border-slate-900 p-5 rounded-2xl animate-fadeIn">
                          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Bạn nhớ kiến thức này ở mức độ nào?</p>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleReviewCard('hard')}
                              className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 border border-rose-500/20 hover:border-rose-500 font-extrabold text-xs rounded-xl transition-all"
                            >
                              Khó (Lặp lại ngay)
                            </button>
                            <button 
                              onClick={() => handleReviewCard('good')}
                              className="flex-1 py-3 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/20 hover:border-cyan-500 font-extrabold text-xs rounded-xl transition-all"
                            >
                              Tốt (Hẹn 6 ngày)
                            </button>
                            <button 
                              onClick={() => handleReviewCard('easy')}
                              className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 hover:border-emerald-500 font-extrabold text-xs rounded-xl transition-all"
                            >
                              Dễ (Hẹn 14 ngày)
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ) : (
                // DECKS LIST
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-200 tracking-tight">Bộ thẻ ghi nhớ của bạn ({decks.length})</h2>
                    <button 
                      onClick={() => setShowAddDeckModal(true)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 hover:text-slate-200 transition"
                    >
                      + Tạo bộ thẻ mới
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {decks.map(deck => (
                      <div 
                        key={deck.id} 
                        onClick={() => setActiveDeck(deck)}
                        className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-5 cursor-pointer transition duration-200 flex flex-col justify-between h-44 hover:shadow-lg hover:shadow-purple-950/15 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-md shadow-purple-500/40"></span>
                            <span className="text-[10px] text-slate-500 font-semibold">{new Date(deck.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <h3 className="text-md font-bold text-slate-200 group-hover:text-purple-400 transition-colors leading-tight line-clamp-1">{deck.name}</h3>
                          <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">{deck.description || 'Ghi nhớ từ vựng và lý thuyết quan trọng.'}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-t border-slate-900 pt-3 mt-4">
                          <span>Ôn tập ngay</span>
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ====================================================================
              VIEW 4: STUDY STATS & PERFORMANCE ANALYTICS
              ==================================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 select-text">
              
              {/* Aggregate widgets grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thời gian học tập</p>
                  <h3 className="text-2xl font-black text-slate-100 mt-2 bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">{analyticsData.total_study_minutes} <span className="text-xs font-medium text-slate-400">phút</span></h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-none font-semibold">Tích lũy từ tất cả các phiên</p>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số phiên đếm giờ</p>
                  <h3 className="text-2xl font-black text-slate-100 mt-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{analyticsData.total_sessions} <span className="text-xs font-medium text-slate-400">phiên</span></h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-none font-semibold">Hoàn thành tập trung</p>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tài liệu học tập</p>
                  <h3 className="text-2xl font-black text-slate-100 mt-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{analyticsData.total_documents} <span className="text-xs font-medium text-slate-400">tài liệu</span></h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-none font-semibold">Lưu trong thư viện</p>
                </div>

                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bộ thẻ Flashcards</p>
                  <h3 className="text-2xl font-black text-slate-100 mt-2 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{analyticsData.total_flashcards} <span className="text-xs font-medium text-slate-400">thẻ ghi nhớ</span></h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-none font-semibold">Tự động hóa bằng AI</p>
                </div>

              </div>

              {/* Progress chart weekly study hours mockup */}
              <div className="bg-slate-900/25 border border-slate-900 rounded-3xl p-6">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-200">Biểu đồ tiến trình tuần này</h3>
                  <p className="text-xs text-slate-500 font-medium">Thời gian học tập trung (phút) được ghi nhận tự động theo ngày.</p>
                </div>

                <div className="space-y-4">
                  {(analyticsData.chart_data.length > 0 ? analyticsData.chart_data : [
                    { day: 'Thứ 2', minutes: 30 },
                    { day: 'Thứ 3', minutes: 45 },
                    { day: 'Thứ 4', minutes: 20 },
                    { day: 'Thứ 5', minutes: 60 },
                    { day: 'Thứ 6', minutes: 15 },
                    { day: 'Thứ 7', minutes: 40 },
                    { day: 'Chủ Nhật', minutes: 50 },
                  ]).map((bar, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-16 text-slate-400 text-left">{bar.day}</span>
                      <div className="flex-1 bg-slate-950 h-5.5 rounded-full overflow-hidden border border-slate-900/50">
                        <div 
                          style={{ width: `${Math.min(100, (bar.minutes / 80) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-600 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        >
                          <span className="text-[8px] font-black text-slate-950 font-sans">{bar.minutes}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-900 pt-5 mt-6 flex justify-between text-[10px] text-slate-500 font-bold tracking-wide uppercase">
                  <span>MỤC TIÊU HÀNG TUẦN: 350 PHÚT HỌC TẬP</span>
                  <span className="text-cyan-400">Đã hoàn thành 75% chỉ tiêu</span>
                </div>
              </div>

            </div>
          )}

        </main>

      </div>

      {/* ====================================================================
          DIALOG MODALS
          ==================================================================== */}
      
      {/* MODAL 1: ADD DOCUMENT */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-text">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6.5 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-md font-bold text-slate-200">Tải lên Tài liệu học tập & Lời giải mới</h3>
              <button 
                onClick={() => setShowAddDocModal(false)}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDocumentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên tài liệu *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Công thức tính nhanh Hóa học..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition"
                    value={newDocTitle}
                    onChange={e => setNewDocTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Danh mục học tập</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition"
                    value={newDocCat}
                    onChange={e => setNewDocCat(e.target.value)}
                  >
                    <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                    <option value="Toán học">Toán học</option>
                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mô tả ngắn</label>
                <input 
                  type="text" 
                  placeholder="Mô tả nội dung chính..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition"
                  value={newDocDesc}
                  onChange={e => setNewDocDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nội dung văn bản tài liệu *</label>
                <textarea 
                  required
                  placeholder="Gõ hoặc dán nội dung chính của tài liệu học tập vào đây..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition resize-none font-sans"
                  value={newDocContent}
                  onChange={e => setNewDocContent(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lời giải chi tiết đính kèm (Bản Text/Markdown)</label>
                <textarea 
                  placeholder="Nhập phần giải đáp, lời giải chi tiết cho các câu hỏi hoặc bài tập trong tài liệu..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition resize-none font-mono"
                  value={newDocSolution}
                  onChange={e => setNewDocSolution(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 text-xs font-black py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/10 transition"
                >
                  Xác nhận tải lên
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddDocModal(false)}
                  className="px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD FLASHCARD DECK */}
      {showAddDeckModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6.5 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-md font-bold text-slate-200">Tạo bộ Flashcard mới</h3>
              <button 
                onClick={() => setShowAddDeckModal(false)}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDeckSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tên bộ thẻ *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Công thức Toán giải tích 1..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition"
                  value={newDeckName}
                  onChange={e => setNewDeckName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mô tả ngắn</label>
                <textarea 
                  placeholder="Ví dụ: Tổng hợp các kiến thức phục vụ kỳ thi giữa kỳ..."
                  className="w-full h-20 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition resize-none"
                  value={newDeckDesc}
                  onChange={e => setNewDeckDesc(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 text-xs font-black py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/10 transition"
                >
                  Xác nhận tạo bộ thẻ
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddDeckModal(false)}
                  className="px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
