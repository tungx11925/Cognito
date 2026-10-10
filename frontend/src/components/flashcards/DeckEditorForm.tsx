"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, ArrowLeftRight, Upload, 
  FileText, Sparkles, AlertCircle, Check, X, Download, Eye, 
  Settings, Lock, Link as LinkIcon, Globe, Image as ImageIcon,
  Save, Play, Layers, ChevronRight, ChevronLeft, RefreshCw,
  Copy, FileSpreadsheet, AlertTriangle, CheckSquare, Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { 
  getDeckById, getAllFlashcards, createDeckWithBatch, 
  updateDeckWithBatch, uploadFlashcardImage, generateFlashcardsFromFile 
} from '@/services/flashcard.service';
import { apiFetch } from '@/services/api';
import StickyPromptBar, { ActivePromptState } from '@/components/ai/StickyPromptBar';
import { useStudy } from '@/context/StudyContext';

interface CardItem {
  id?: number;
  tempId: string;
  front: string;
  back: string;
  position: number;
  term_image_url?: string | null;
  definition_image_url?: string | null;
}

interface Props {
  initialDeckId?: number; // Nếu có deckId => chế độ Edit (B6)
}

const CATEGORY_OPTIONS = [
  'Chung',
  'Ngoại ngữ (Tiếng Anh, Nhật, Hàn...)',
  'Khoa học tự nhiên (Toán, Lý, Hóa, Sinh)',
  'Y dược & Sức khỏe',
  'Công nghệ thông tin & Lập trình',
  'Kinh tế, Tài chính & Quản trị',
  'Khoa học xã hội & Lịch sử',
  'Khác'
];

export default function DeckEditorForm({ initialDeckId }: Props) {
  const router = useRouter();
  const { activeUser } = useStudy();
  const isEdit = !!initialDeckId;

  // Deck metadata
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Chung');
  const [visibility, setVisibility] = useState<'private' | 'link' | 'public'>('private');
  
  // Cards state
  const [cards, setCards] = useState<CardItem[]>([
    { tempId: '1', front: '', back: '', position: 0 },
    { tempId: '2', front: '', back: '', position: 1 },
    { tempId: '3', front: '', back: '', position: 2 },
  ]);

  // Loading & Saving states
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [hasForbidden, setHasForbidden] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null);
  const [hasDraftToRestore, setHasDraftToRestore] = useState(false);

  // Modals & Panels
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Paste import state
  const [pasteText, setPasteText] = useState('');
  const [termSeparator, setTermSeparator] = useState<'tab' | 'comma' | 'custom'>('tab');
  const [customTermSep, setCustomTermSep] = useState('-');
  const [cardSeparator, setCardSeparator] = useState<'newline' | 'semicolon' | 'custom'>('newline');
  const [customCardSep, setCustomCardSep] = useState('---');
  const [pasteImportMode, setPasteImportMode] = useState<'append' | 'replace'>('append');

  // File import state
  const [filePreviewCards, setFilePreviewCards] = useState<Array<{ front: string; back: string; error?: string }>>([]);
  const [fileImportMode, setFileImportMode] = useState<'append' | 'replace'>('append');

  // AI Panel state
  const [aiSourceType, setAiSourceType] = useState<'prompt' | 'file' | 'document'>('prompt');
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [aiUploadedFile, setAiUploadedFile] = useState<File | null>(null);
  const [aiDocList, setAiDocList] = useState<any[]>([]);
  const [aiSelectedDocId, setAiSelectedDocId] = useState<number | null>(null);
  const [aiCardCount, setAiCardCount] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiCardType, setAiCardType] = useState('definition'); // definition, qa, vocabulary
  const [aiAvailableModels, setAiAvailableModels] = useState<any[]>([]);
  const [aiSelectedModel, setAiSelectedModel] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedCards, setAiGeneratedCards] = useState<Array<{ front: string; back: string; selected: boolean }>>([]);
  const [aiHeuristicFallback, setAiHeuristicFallback] = useState(false);
  const [aiAppliedPrompt, setAiAppliedPrompt] = useState<ActivePromptState | null>(null);

  // Ref tracking unsaved changes
  const isDirtyRef = useRef(false);

  // Draft storage key
  const draftKey = `cognito_deck_draft_${isEdit ? initialDeckId : 'new'}`;

  // 1. Initial Load (Edit or Draft restore check)
  useEffect(() => {
    if (isEdit && initialDeckId) {
      loadDeckData(initialDeckId);
    } else {
      // Check local draft
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.name || (parsed.cards && parsed.cards.length > 0)) {
            setHasDraftToRestore(true);
          }
        } catch (e) {
          console.warn('Lỗi đọc bản nháp:', e);
        }
      }
    }
    loadAIModels();
    loadUserDocuments();
  }, [initialDeckId, isEdit]);

  // Load existing deck for Edit (B6)
  const loadDeckData = async (deckId: number) => {
    try {
      setLoading(true);
      const [deck, deckCards] = await Promise.all([
        getDeckById(deckId),
        getAllFlashcards(deckId)
      ]);

      if ((deck as any)?.error || (deckCards as any)?.error) {
        const errorMsg = String((deck as any)?.error || (deckCards as any)?.error || '');
        if (errorMsg.includes('quyền') || errorMsg.includes('403') || (deck as any)?.status === 403 || (deckCards as any)?.status === 403) {
          setHasForbidden(true);
          return;
        }
      }

      if (deck && activeUser && deck.user_id && deck.user_id !== activeUser.id) {
        setHasForbidden(true);
        return;
      }

      if (!deck || (deck as any)?.error) {
        toast.error('Không tìm thấy học phần');
        router.push('/flashcards');
        return;
      }

      setName(deck.name || '');
      setDescription(deck.description || '');
      setCategory(deck.category || 'Chung');
      setVisibility(deck.visibility || (deck.is_public ? 'public' : 'private'));

      if (Array.isArray(deckCards) && deckCards.length > 0) {
        setCards(deckCards.map((c: any, idx: number) => ({
          id: c.id,
          tempId: `loaded_${c.id}_${idx}`,
          front: c.front || '',
          back: c.back || '',
          position: c.position !== undefined ? c.position : idx,
          term_image_url: c.term_image_url || null,
          definition_image_url: c.definition_image_url || null,
        })));
      } else {
        setCards([
          { tempId: '1', front: '', back: '', position: 0 },
          { tempId: '2', front: '', back: '', position: 1 },
        ]);
      }
    } catch (err: any) {
      if (err?.status === 403 || err?.message?.includes('403') || err?.message?.includes('quyền')) {
        setHasForbidden(true);
      } else {
        toast.error('Lỗi khi tải học phần: ' + (err.message || 'Thử lại sau'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load AI models
  const loadAIModels = async () => {
    try {
      const res = await apiFetch('/ai/models');
      if (Array.isArray(res)) {
        const available = res.filter((m: any) => m.is_available !== false);
        setAiAvailableModels(available);
        if (available.length > 0) {
          setAiSelectedModel(available[0].id || available[0].name);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải AI models:', err);
    }
  };

  // Load user documents for AI source
  const loadUserDocuments = async () => {
    try {
      const res = await apiFetch('/documents');
      if (Array.isArray(res)) {
        setAiDocList(res);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách tài liệu:', err);
    }
  };

  // 2. Auto-save Draft to LocalStorage (Debounce 2s)
  useEffect(() => {
    if (loading || hasForbidden) return;

    const timer = setTimeout(() => {
      const draftData = {
        name,
        description,
        category,
        visibility,
        cards,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastDraftSaved(new Date().toLocaleTimeString());
      isDirtyRef.current = true;
    }, 2000);

    return () => clearTimeout(timer);
  }, [name, description, category, visibility, cards, draftKey, loading, hasForbidden]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Restore Draft
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setName(parsed.name || '');
        setDescription(parsed.description || '');
        setCategory(parsed.category || 'Chung');
        setVisibility(parsed.visibility || 'private');
        if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
          setCards(parsed.cards);
        }
        toast.success('Đã khôi phục bản nháp!');
      }
    } catch (e) {
      toast.error('Không thể khôi phục bản nháp');
    } finally {
      setHasDraftToRestore(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraftToRestore(false);
  };

  // ── Card Operations ───────────────────────────────────────────────
  const handleCardChange = (index: number, field: 'front' | 'back', value: string) => {
    setCards(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddCard = () => {
    setCards(prev => [
      ...prev,
      {
        tempId: Math.random().toString(36).substring(2, 9),
        front: '',
        back: '',
        position: prev.length
      }
    ]);
  };

  const handleDeleteCard = (index: number) => {
    if (cards.length <= 2) {
      toast.error('Học phần cần có ít nhất 2 thẻ!');
      return;
    }
    setCards(prev => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, position: i })));
  };

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === cards.length - 1)) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setCards(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((c, i) => ({ ...c, position: i }));
    });
  };

  // Đảo Thuật ngữ ↔ Định nghĩa toàn bộ
  const handleSwapAll = () => {
    setCards(prev => prev.map(c => ({
      ...c,
      front: c.back,
      back: c.front,
      term_image_url: c.definition_image_url,
      definition_image_url: c.term_image_url
    })));
    toast.success('Đã đảo vị trí Thuật ngữ và Định nghĩa!');
  };

  // Upload image for card face
  const handleImageUpload = async (cardIndex: number, side: 'term' | 'definition', file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa 2MB');
      return;
    }
    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const res = await uploadFlashcardImage(file);
      if (res && res.url) {
        setCards(prev => {
          const next = [...prev];
          if (side === 'term') {
            next[cardIndex].term_image_url = res.url;
          } else {
            next[cardIndex].definition_image_url = res.url;
          }
          return next;
        });
        toast.success('Đã tải ảnh thành công!', { id: toastId });
      } else {
        toast.error('Không nhận được URL ảnh', { id: toastId });
      }
    } catch (err: any) {
      toast.error('Lỗi tải ảnh: ' + (err.message || 'Thử lại'), { id: toastId });
    }
  };

  const handleRemoveImage = (cardIndex: number, side: 'term' | 'definition') => {
    setCards(prev => {
      const next = [...prev];
      if (side === 'term') {
        next[cardIndex].term_image_url = null;
      } else {
        next[cardIndex].definition_image_url = null;
      }
      return next;
    });
  };

  // Phím Tab ở ô cuối cùng tự thêm thẻ
  const handleKeyDownDefinition = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' && !e.shiftKey && index === cards.length - 1) {
      e.preventDefault();
      handleAddCard();
      setTimeout(() => {
        const nextFrontInput = document.getElementById(`term-input-${cards.length}`);
        if (nextFrontInput) nextFrontInput.focus();
      }, 50);
    }
  };

  // ── Validation & Save Operations ──────────────────────────────────────────
  const validateCards = () => {
    const validCards = cards.filter(c => c.front.trim() && c.back.trim());
    if (validCards.length < 2) {
      toast.error('Học phần cần có ít nhất 2 thẻ hợp lệ (cả Thuật ngữ và Định nghĩa đều có nội dung)!');
      return false;
    }
    if (!name.trim()) {
      toast.error('Vui lòng nhập Tiêu đề học phần!');
      return false;
    }
    return true;
  };

  const handleSave = async (andStudyImmediately: boolean = false) => {
    if (!validateCards()) return;

    setSaving(true);
    const toastId = toast.loading(isEdit ? 'Đang cập nhật học phần...' : 'Đang tạo học phần mới...');

    try {
      const payloadCards = cards
        .filter(c => c.front.trim() || c.back.trim())
        .map((c, idx) => ({
          id: c.id,
          front: c.front.trim(),
          back: c.back.trim(),
          position: idx,
          term_image_url: c.term_image_url || null,
          definition_image_url: c.definition_image_url || null
        }));

      let savedDeck: any;

      if (isEdit && initialDeckId) {
        savedDeck = await updateDeckWithBatch(initialDeckId, {
          name: name.trim(),
          description: description.trim(),
          category,
          visibility,
          is_public: visibility === 'public',
          cards: payloadCards
        });
      } else {
        savedDeck = await createDeckWithBatch({
          name: name.trim(),
          description: description.trim(),
          category,
          visibility,
          is_public: visibility === 'public',
          cards: payloadCards
        });
      }

      // Clear draft on successful save
      localStorage.removeItem(draftKey);
      isDirtyRef.current = false;

      toast.success(isEdit ? 'Đã cập nhật học phần thành công!' : 'Đã tạo học phần thành công!', { id: toastId });

      if (andStudyImmediately) {
        router.push(`/flashcards/${savedDeck.id}?mode=study&fullscreen=true`);
      } else {
        router.push(`/flashcards/${savedDeck.id}`);
      }
    } catch (err: any) {
      toast.error('Lỗi khi lưu: ' + (err.message || 'Vui lòng thử lại'), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ── B3: Nhập dữ liệu bằng cách dán ──────────────────────────────────────
  const parsePastedContent = () => {
    if (!pasteText.trim()) return [];
    
    let cardSep = '\n';
    if (cardSeparator === 'semicolon') cardSep = ';';
    else if (cardSeparator === 'custom') cardSep = customCardSep;

    let termSep = '\t';
    if (termSeparator === 'comma') termSep = ',';
    else if (termSeparator === 'custom') termSep = customTermSep;

    const rawCards = pasteText.split(cardSep).map(s => s.trim()).filter(Boolean);
    const parsed: Array<{ front: string; back: string; error?: string }> = [];

    for (let i = 0; i < rawCards.length; i++) {
      const line = rawCards[i];
      const sepIndex = line.indexOf(termSep);
      if (sepIndex === -1) {
        parsed.push({ front: line, back: '', error: `Thiếu ký tự phân cách "${termSep === '\t' ? 'Tab' : termSep}"` });
      } else {
        const front = line.substring(0, sepIndex).trim();
        const back = line.substring(sepIndex + termSep.length).trim();
        if (!front || !back) {
          parsed.push({ front, back, error: 'Thiếu Thuật ngữ hoặc Định nghĩa' });
        } else {
          parsed.push({ front, back });
        }
      }
    }
    return parsed;
  };

  const handleApplyPastedCards = () => {
    const parsed = parsePastedContent();
    const valid = parsed.filter(p => !p.error && p.front && p.back);
    if (valid.length === 0) {
      toast.error('Không tìm thấy thẻ hợp lệ nào để nhập!');
      return;
    }

    const newCardItems: CardItem[] = valid.map((p, idx) => ({
      tempId: `pasted_${Date.now()}_${idx}`,
      front: p.front,
      back: p.back,
      position: idx
    }));

    if (pasteImportMode === 'replace') {
      setCards(newCardItems);
    } else {
      setCards(prev => [...prev, ...newCardItems].map((c, i) => ({ ...c, position: i })));
    }

    setShowPasteModal(false);
    setPasteText('');
    toast.success(`Đã nhập thành công ${valid.length} thẻ!`);
  };

  // ── B4: Nhập từ file mẫu (CSV / XLSX / TXT) ────────────────────────────
  const handleDownloadSample = (type: 'csv' | 'xlsx') => {
    const sampleData = [
      {
        term: 'Quang hợp',
        definition: 'Quá trình biến đổi năng lượng ánh sáng thành năng lượng hóa học ở thực vật.',
        term_image_url: '',
        definition_image_url: ''
      },
      {
        term: 'Mitochondria (Ty thể)',
        definition: 'Bào quan sản xuất năng lượng ATP chính của tế bào nhân thực.',
        term_image_url: '',
        definition_image_url: ''
      },
      {
        term: 'Lạm phát',
        definition: 'Sự tăng mức giá chung có tính chu kỳ hoặc kéo dài của hàng hóa và dịch vụ.',
        term_image_url: '',
        definition_image_url: ''
      }
    ];

    if (type === 'csv') {
      const csvHeader = 'term,definition,term_image_url,definition_image_url\n';
      const csvRows = sampleData.map(r => 
        `"${r.term.replace(/"/g, '""')}","${r.definition.replace(/"/g, '""')}","",""`
      ).join('\n');
      const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cognito_flashcard_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Flashcards');
      XLSX.writeFile(workbook, 'cognito_flashcard_sample.xlsx');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(firstSheet);
          
          const parsed = jsonRows.map((row, idx) => {
            const front = (row.term || row['Thuật ngữ'] || row.front || Object.values(row)[0] || '').toString().trim();
            const back = (row.definition || row['Định nghĩa'] || row.back || Object.values(row)[1] || '').toString().trim();
            if (!front || !back) {
              return { front, back, error: `Dòng ${idx + 2}: Thiếu cột thuật ngữ hoặc định nghĩa` };
            }
            return { front, back };
          });
          setFilePreviewCards(parsed);
          setShowFileModal(true);
        } catch (err: any) {
          toast.error('Lỗi khi đọc file Excel: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or TXT
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length === 0) {
            toast.error('File rỗng');
            return;
          }

          // Check if first row is header
          let startIndex = 0;
          const firstLine = lines[0].toLowerCase();
          if (firstLine.includes('term') || firstLine.includes('thuật ngữ') || firstLine.includes('front')) {
            startIndex = 1;
          }

          const parsed: Array<{ front: string; back: string; error?: string }> = [];
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const sep = line.includes('\t') ? '\t' : (line.includes(',') ? ',' : (line.includes('-') ? '-' : ';'));
            const parts = line.split(sep);
            const front = parts[0]?.replace(/^"|"$/g, '').trim();
            const back = parts.slice(1).join(sep).replace(/^"|"$/g, '').trim();

            if (!front || !back) {
              parsed.push({ front: front || line, back: '', error: `Dòng ${i + 1}: Thiếu nội dung định nghĩa` });
            } else {
              parsed.push({ front, back });
            }
          }
          setFilePreviewCards(parsed);
          setShowFileModal(true);
        } catch (err: any) {
          toast.error('Lỗi khi đọc file văn bản: ' + err.message);
        }
      };
      reader.readAsText(file, 'utf-8');
    }

    e.target.value = '';
  };

  const handleApplyFileCards = () => {
    const valid = filePreviewCards.filter(c => !c.error && c.front && c.back);
    if (valid.length === 0) {
      toast.error('Không có thẻ hợp lệ nào để nhập!');
      return;
    }

    const newCards: CardItem[] = valid.map((c, idx) => ({
      tempId: `file_${Date.now()}_${idx}`,
      front: c.front,
      back: c.back,
      position: idx
    }));

    if (fileImportMode === 'replace') {
      setCards(newCards);
    } else {
      setCards(prev => [...prev, ...newCards].map((c, i) => ({ ...c, position: i })));
    }

    setShowFileModal(false);
    setFilePreviewCards([]);
    toast.success(`Đã nhập thành công ${valid.length} thẻ từ file!`);
  };

  // ── B5: Tạo bằng AI (Panel) ──────────────────────────────────────────────
  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiHeuristicFallback(false);
    const toastId = toast.loading('AI đang phân tích và trích xuất thẻ học...');

    try {
      let cardsResult: Array<{ front: string; back: string }> = [];

      if (aiSourceType === 'file' && aiUploadedFile) {
        // Tái sử dụng logic generate-from-file hiện có
        const res = await generateFlashcardsFromFile(aiUploadedFile);
        if (res && Array.isArray(res.flashcards)) {
          cardsResult = res.flashcards.map((f: any) => ({
            front: f.front || f.term || '',
            back: f.back || f.definition || ''
          }));
          if (res.metadata?.isLLMGenerated === false) {
            setAiHeuristicFallback(true);
          }
        }
      } else {
        // Tạo qua prompt hoặc document ID
        let promptText = aiPromptInput.trim();
        if (aiSourceType === 'document' && aiSelectedDocId) {
          const selectedDoc = aiDocList.find(d => d.id === aiSelectedDocId);
          promptText = `Tài liệu: "${selectedDoc?.title || ''}". Hãy trích xuất các khái niệm cốt lõi nhất.`;
        }

        const fullPrompt = `${aiAppliedPrompt ? `[Chỉ dẫn ưu tiên: ${aiAppliedPrompt.text}]\n` : ''}Tạo ${aiCardCount} thẻ flashcard theo phong cách ${aiCardType} với độ khó ${aiDifficulty}. Yêu cầu trả về danh sách các cặp Thuật ngữ - Định nghĩa ngắn gọn, chính xác. Nội dung nguồn:\n${promptText}`;

        const res = await apiFetch('/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: aiSelectedDocId || undefined,
            message: fullPrompt,
            contextMode: aiSourceType === 'document' ? 'DOCUMENT_CONTEXT' : 'GENERAL',
            model: aiSelectedModel || undefined
          })
        });

        if (res && res.reply) {
          // Parse lines from AI response
          const lines = res.reply.split('\n');
          for (const line of lines) {
            if (line.includes(':') || line.includes('-') || line.includes('|')) {
              const sep = line.includes(':') ? ':' : (line.includes('|') ? '|' : '-');
              const parts = line.split(sep);
              const cleanFront = parts[0].replace(/^[\d\.\-\*\#\s]+/, '').trim();
              const cleanBack = parts.slice(1).join(sep).trim();
              if (cleanFront && cleanBack && cleanFront.length > 1 && cleanBack.length > 2) {
                cardsResult.push({ front: cleanFront, back: cleanBack });
              }
            }
          }
        }
      }

      if (cardsResult.length === 0) {
        // Fallback demo cards nếu AI không trả về dạng phân cách
        toast.error('AI chưa thể trích xuất thẻ. Vui lòng thử lại với prompt cụ thể hơn.', { id: toastId });
      } else {
        setAiGeneratedCards(cardsResult.map(c => ({ ...c, selected: true })));
        toast.success(`Đã sinh ${cardsResult.length} thẻ xem trước!`, { id: toastId });
      }
    } catch (err: any) {
      toast.error('Lỗi khi sinh thẻ bằng AI: ' + (err.message || 'Thử lại sau'), { id: toastId });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSelectedAICards = () => {
    const selected = aiGeneratedCards.filter(c => c.selected && c.front && c.back);
    if (selected.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thẻ để thêm!');
      return;
    }

    const newCards: CardItem[] = selected.map((c, idx) => ({
      tempId: `ai_${Date.now()}_${idx}`,
      front: c.front,
      back: c.back,
      position: cards.length + idx
    }));

    setCards(prev => [...prev, ...newCards].map((c, i) => ({ ...c, position: i })));
    toast.success(`Đã thêm ${selected.length} thẻ từ AI vào học phần!`);
    setAiGeneratedCards([]);
  };

  // 403 Forbidden Screen
  if (hasForbidden) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
          <Lock size={28} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">403 — Không có quyền truy cập</h1>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          Bạn không phải là chủ sở hữu của học phần này nên không thể chỉnh sửa.
        </p>
        <button
          onClick={() => router.push('/flashcards')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all"
        >
          Trở về Thẻ ghi nhớ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#121212] text-gray-900 dark:text-gray-100 font-sans pb-32">
      {/* ── Top Header Navigation & Action Bar ── */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-4 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(isEdit ? `/flashcards/${initialDeckId}` : '/flashcards')}
              className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-all active:scale-95"
              title="Quay lại"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-base lg:text-lg font-extrabold tracking-tight flex items-center gap-2">
                <Layers size={18} className="text-emerald-600" />
                {isEdit ? 'Chỉnh sửa học phần' : 'Tạo học phần mới'}
              </h1>
              {lastDraftSaved && (
                <span className="text-[10px] text-gray-400">
                  Tự lưu nháp lúc {lastDraftSaved}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAIPanel(v => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border ${
                showAIPanel 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Sparkles size={14} />
              AI Flashcard
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={14} />
              {isEdit ? 'Lưu' : 'Tạo'}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Play size={14} />
              {isEdit ? 'Lưu & Học ngay' : 'Tạo & Học ngay'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Restore Draft Notification Banner ── */}
      {hasDraftToRestore && (
        <div className="max-w-5xl mx-auto px-4 mt-4 animate-in slide-in-from-top-2">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span>Phát hiện bản nháp học phần chưa lưu trước đó của bạn.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreDraft}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
              >
                Khôi phục
              </button>
              <button
                onClick={handleDiscardDraft}
                className="px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout: Content + Right AI Panel ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-6 flex gap-6 items-start">
        {/* Left / Center: Form & Cards List */}
        <div className={`flex-1 transition-all duration-300 min-w-0 ${showAIPanel ? 'lg:max-w-[65%]' : 'w-full'}`}>
          {/* ── B1. Thông tin học phần ── */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs mb-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Tiêu đề học phần <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Sinh học 12 — Di truyền học phân tử, Từ vựng IELTS Topic Education..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-sm lg:text-base font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
                maxLength={255}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Môn học / Lĩnh vực
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium focus:border-emerald-500 outline-hidden"
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Chế độ chia sẻ (Phase 40B)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'private', label: 'Riêng tư', icon: Lock },
                    { id: 'link', label: 'Liên kết', icon: LinkIcon },
                    { id: 'public', label: 'Cộng đồng', icon: Globe },
                  ].map(v => {
                    const Icon = v.icon;
                    const isSelected = visibility === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVisibility(v.id as any)}
                        className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                            : 'border-gray-200 dark:border-zinc-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <Icon size={12} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Mô tả (Tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Thêm ghi chú, mục tiêu bài học hoặc hướng dẫn ôn tập..."
                rows={2}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-xs focus:border-emerald-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* ── Toolbar: Nhập dán, Nhập file, Đảo thẻ ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              >
                <Copy size={13} className="text-emerald-600" />
                Nhập bằng dán
              </button>

              <button
                type="button"
                onClick={() => setShowFileModal(true)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              >
                <FileSpreadsheet size={13} className="text-blue-500" />
                Nhập từ file (CSV/XLSX)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSwapAll}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs text-gray-700 dark:text-gray-300"
                title="Đảo Thuật ngữ sang Định nghĩa cho tất cả các thẻ"
              >
                <ArrowLeftRight size={13} />
                Đảo Thuật ngữ ↔ Định nghĩa
              </button>
              <span className="text-xs font-bold text-gray-400">
                {cards.length} thẻ
              </span>
            </div>
          </div>

          {/* ── B2. Danh sách thẻ ── */}
          <div className="space-y-4">
            {cards.map((card, index) => {
              // Cảnh báo trùng lặp hoặc thiếu 1 mặt
              const isDuplicate = cards.some((c, i) => i !== index && c.front.trim() && c.front.trim().toLowerCase() === card.front.trim().toLowerCase());
              const isMissingOneSide = (card.front.trim() && !card.back.trim()) || (!card.front.trim() && card.back.trim());

              return (
                <div
                  key={card.tempId || index}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 shadow-2xs ${
                    isMissingOneSide 
                      ? 'border-rose-400 dark:border-rose-700' 
                      : isDuplicate 
                        ? 'border-amber-400 dark:border-amber-700' 
                        : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Card row header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      {isDuplicate && (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle size={11} /> Trùng thuật ngữ
                        </span>
                      )}
                      {isMissingOneSide && (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                          <AlertCircle size={11} /> Thiếu một mặt
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveCard(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-20"
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveCard(index, 'down')}
                        disabled={index === cards.length - 1}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-20"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(index)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-500"
                        title="Xóa thẻ này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Card inputs */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Front: Thuật ngữ */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          Thuật ngữ (Mặt trước)
                        </span>
                        {/* Term image button */}
                        <label className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                          <ImageIcon size={12} />
                          {card.term_image_url ? 'Đổi ảnh' : 'Thêm ảnh'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleImageUpload(index, 'term', e.target.files[0])}
                          />
                        </label>
                      </div>

                      <textarea
                        id={`term-input-${index}`}
                        value={card.front}
                        onChange={e => handleCardChange(index, 'front', e.target.value)}
                        placeholder="Nhập thuật ngữ, câu hỏi hoặc từ vựng..."
                        rows={2}
                        maxLength={1000}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent text-sm focus:border-emerald-500 outline-hidden resize-none font-medium"
                      />

                      {/* Image Preview for Term */}
                      {card.term_image_url && (
                        <div className="relative mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 group">
                          <img src={card.term_image_url} alt="Term" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, 'term')}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                            title="Xóa ảnh"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Back: Định nghĩa */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase">
                          Định nghĩa (Mặt sau)
                        </span>
                        {/* Definition image button */}
                        <label className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                          <ImageIcon size={12} />
                          {card.definition_image_url ? 'Đổi ảnh' : 'Thêm ảnh'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleImageUpload(index, 'definition', e.target.files[0])}
                          />
                        </label>
                      </div>

                      <textarea
                        value={card.back}
                        onChange={e => handleCardChange(index, 'back', e.target.value)}
                        onKeyDown={e => handleKeyDownDefinition(e, index)}
                        placeholder="Nhập định nghĩa, đáp án hoặc giải thích..."
                        rows={2}
                        maxLength={10000}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent text-sm focus:border-emerald-500 outline-hidden resize-none font-medium"
                      />

                      {/* Image Preview for Definition */}
                      {card.definition_image_url && (
                        <div className="relative mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 group">
                          <img src={card.definition_image_url} alt="Definition" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, 'definition')}
                            className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                            title="Xóa ảnh"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add card button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddCard}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-emerald-500 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all bg-white dark:bg-zinc-900 active:scale-[0.99] shadow-2xs"
            >
              <Plus size={16} />
              + THÊM THẺ (Nhấn Tab ở ô cuối để tự tạo thẻ mới)
            </button>
          </div>
        </div>

        {/* ── B5. Collapsible AI Flashcard Panel ── */}
        {showAIPanel && (
          <div className="w-full lg:w-[35%] shrink-0 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <Sparkles size={16} className="text-emerald-500" />
                AI Flashcard Generator
              </h3>
              <button
                type="button"
                onClick={() => setShowAIPanel(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sticky Prompt Bar trong AI Panel */}
            <StickyPromptBar
              documentId={aiSelectedDocId || undefined}
              activePrompt={aiAppliedPrompt}
              onChangeActivePrompt={setAiAppliedPrompt}
              className="rounded-xl border border-emerald-200 dark:border-zinc-800 !bg-emerald-50/70 dark:!bg-zinc-800/80 mb-2"
            />

            {/* Source tabs */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">
                Nguồn tài liệu
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl">
                {[
                  { id: 'prompt', label: 'Văn bản / Lệnh' },
                  { id: 'file', label: 'Tải file' },
                  { id: 'document', label: 'Kho tài liệu' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAiSourceType(t.id as any)}
                    className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                      aiSourceType === t.id 
                        ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source Input */}
            {aiSourceType === 'prompt' && (
              <div>
                <textarea
                  value={aiPromptInput}
                  onChange={e => setAiPromptInput(e.target.value)}
                  placeholder="Dán nội dung bài học, tóm tắt sách, hoặc ghi chú cần tạo thẻ..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs bg-transparent focus:border-emerald-500 outline-hidden"
                />
              </div>
            )}

            {aiSourceType === 'file' && (
              <div>
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx,.txt"
                  onChange={e => setAiUploadedFile(e.target.files?.[0] || null)}
                  className="text-xs w-full file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {aiUploadedFile && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold truncate">
                    Đã chọn: {aiUploadedFile.name} ({(aiUploadedFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>
            )}

            {aiSourceType === 'document' && (
              <div>
                <select
                  value={aiSelectedDocId || ''}
                  onChange={e => setAiSelectedDocId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                >
                  <option value="">-- Chọn tài liệu từ kho của bạn --</option>
                  {aiDocList.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Generation options */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Số lượng thẻ</label>
                <select
                  value={aiCardCount}
                  onChange={e => setAiCardCount(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                >
                  <option value={5}>5 thẻ</option>
                  <option value={10}>10 thẻ</option>
                  <option value={15}>15 thẻ</option>
                  <option value={20}>20 thẻ</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-gray-500 mb-1">Kiểu thẻ</label>
                <select
                  value={aiCardType}
                  onChange={e => setAiCardType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                >
                  <option value="definition">Khái niệm & Định nghĩa</option>
                  <option value="qa">Câu hỏi & Đáp án</option>
                  <option value="vocabulary">Từ vựng & Giải nghĩa</option>
                </select>
              </div>
            </div>

            {/* Model select */}
            {aiAvailableModels.length > 0 && (
              <div>
                <label className="block text-[10.5px] font-bold text-gray-500 mb-1">AI Model khả dụng</label>
                <select
                  value={aiSelectedModel}
                  onChange={e => setAiSelectedModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                >
                  {aiAvailableModels.map(m => (
                    <option key={m.id || m.name} value={m.id || m.name}>{m.name || m.id}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Trigger Button */}
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              {aiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiLoading ? 'Đang tạo thẻ...' : 'Sinh thẻ bằng AI'}
            </button>

            {/* Heuristic Fallback Alert */}
            {aiHeuristicFallback && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Nội dung được trích xuất bằng bộ quy tắc Heuristic.</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  className="self-end px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-[10px]"
                >
                  Thử lại bằng AI
                </button>
              </div>
            )}

            {/* AI Generated Preview List with Checkboxes */}
            {aiGeneratedCards.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    Xem trước ({aiGeneratedCards.filter(c => c.selected).length}/{aiGeneratedCards.length} thẻ)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = aiGeneratedCards.every(c => c.selected);
                      setAiGeneratedCards(prev => prev.map(c => ({ ...c, selected: !allSelected })));
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    {aiGeneratedCards.every(c => c.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {aiGeneratedCards.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setAiGeneratedCards(prev => prev.map((item, idx) => idx === i ? { ...item, selected: !item.selected } : item))}
                      className={`p-2 rounded-xl border text-xs cursor-pointer flex items-start gap-2 transition-all ${
                        c.selected 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                          : 'border-gray-200 dark:border-zinc-700 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={c.selected}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{c.front}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">{c.back}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddSelectedAICards}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Thêm {aiGeneratedCards.filter(c => c.selected).length} thẻ đã chọn vào học phần
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── B3 Modal: Nhập dữ liệu bằng cách dán ── */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Copy size={16} className="text-emerald-600" />
                Nhập thẻ bằng cách dán văn bản
              </h3>
              <button onClick={() => setShowPasteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Separators configuration */}
            <div className="grid grid-cols-2 gap-4 my-3 text-xs">
              <div>
                <label className="block font-bold text-gray-500 mb-1">Phân cách Thuật ngữ - Định nghĩa</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={termSeparator === 'tab'} onChange={() => setTermSeparator('tab')} />
                    Tab
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={termSeparator === 'comma'} onChange={() => setTermSeparator('comma')} />
                    Phẩy (,)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={termSeparator === 'custom'} onChange={() => setTermSeparator('custom')} />
                    Khác:
                  </label>
                  {termSeparator === 'custom' && (
                    <input
                      type="text"
                      value={customTermSep}
                      onChange={e => setCustomTermSep(e.target.value)}
                      className="w-12 px-1.5 py-0.5 border rounded text-center text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 mb-1">Phân cách giữa các thẻ</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={cardSeparator === 'newline'} onChange={() => setCardSeparator('newline')} />
                    Dòng mới
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={cardSeparator === 'semicolon'} onChange={() => setCardSeparator('semicolon')} />
                    Chấm phẩy (;)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" checked={cardSeparator === 'custom'} onChange={() => setCardSeparator('custom')} />
                    Khác:
                  </label>
                  {cardSeparator === 'custom' && (
                    <input
                      type="text"
                      value={customCardSep}
                      onChange={e => setCustomCardSep(e.target.value)}
                      className="w-14 px-1.5 py-0.5 border rounded text-center text-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Paste textarea */}
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Dán dữ liệu vào đây... Ví dụ:&#10;Quang hợp [Tab] Biến đổi năng lượng ánh sáng&#10;Hô hấp tế bào [Tab] Phân giải glucose sinh ATP"
              rows={8}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-transparent text-xs font-mono outline-hidden focus:border-emerald-500"
            />

            {/* Live preview */}
            {pasteText.trim() && (
              <div className="mt-3 p-2.5 bg-gray-50 dark:bg-zinc-800/60 rounded-xl max-h-36 overflow-y-auto border text-xs">
                {(() => {
                  const parsed = parsePastedContent();
                  const valid = parsed.filter(p => !p.error);
                  return (
                    <div>
                      <div className="flex justify-between font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                        <span>Xem trước: {valid.length} thẻ hợp lệ</span>
                        {parsed.length - valid.length > 0 && (
                          <span className="text-rose-500">{parsed.length - valid.length} dòng lỗi</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {parsed.slice(0, 10).map((p, i) => (
                          <div key={i} className={`p-1.5 rounded flex items-center justify-between text-[11px] ${p.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-white dark:bg-zinc-900'}`}>
                            <span className="font-semibold truncate max-w-[40%]">{p.front || '(Trống)'}</span>
                            <span className="text-gray-400 mx-1">→</span>
                            <span className="truncate max-w-[45%]">{p.back || '(Trống)'}</span>
                            {p.error && <span className="text-rose-600 text-[10px] ml-2">[{p.error}]</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal actions */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={pasteImportMode === 'append'} onChange={() => setPasteImportMode('append')} />
                  Thêm vào cuối
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={pasteImportMode === 'replace'} onChange={() => setPasteImportMode('replace')} />
                  Thay thế toàn bộ
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-bold hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyPastedCards}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm"
                >
                  Nhập thẻ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── B4 Modal: Nhập từ file mẫu ── */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-blue-500" />
                Nhập từ file (CSV / XLSX / TXT)
              </h3>
              <button onClick={() => setShowFileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Template download buttons */}
            <div className="my-3 p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-blue-900 dark:text-blue-200">Chưa có file mẫu chuẩn?</p>
                <p className="text-blue-700/80 dark:text-blue-300/80 text-[11px]">Tải file mẫu có sẵn 3 dòng ví dụ tiếng Việt chuẩn UTF-8.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSample('csv')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-blue-300 font-bold text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                >
                  <Download size={12} /> CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSample('xlsx')}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-1"
                >
                  <Download size={12} /> XLSX
                </button>
              </div>
            </div>

            {/* File chooser */}
            <div className="my-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Chọn file từ máy tính
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileUpload}
                className="text-xs w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-100 dark:file:bg-zinc-800 hover:file:bg-gray-200"
              />
            </div>

            {/* File Preview */}
            {filePreviewCards.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl max-h-48 overflow-y-auto border text-xs">
                <div className="flex justify-between font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  <span>Xem trước: {filePreviewCards.filter(c => !c.error).length} thẻ hợp lệ</span>
                  {filePreviewCards.filter(c => c.error).length > 0 && (
                    <span className="text-rose-500">{filePreviewCards.filter(c => c.error).length} dòng lỗi</span>
                  )}
                </div>
                <div className="space-y-1">
                  {filePreviewCards.slice(0, 15).map((p, i) => (
                    <div key={i} className={`p-1.5 rounded flex items-center justify-between text-[11px] ${p.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-white dark:bg-zinc-900'}`}>
                      <span className="font-semibold truncate max-w-[40%]">{p.front || '(Trống)'}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="truncate max-w-[45%]">{p.back || '(Trống)'}</span>
                      {p.error && <span className="text-rose-600 text-[10px] ml-2">[{p.error}]</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File modal footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={fileImportMode === 'append'} onChange={() => setFileImportMode('append')} />
                  Thêm vào cuối
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="radio" checked={fileImportMode === 'replace'} onChange={() => setFileImportMode('replace')} />
                  Thay thế toàn bộ
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border text-xs font-bold hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={filePreviewCards.length === 0}
                  onClick={handleApplyFileCards}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  Nhập thẻ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
