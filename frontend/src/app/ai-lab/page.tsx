"use client";
import { motion } from "framer-motion";
import { Upload, Sparkles, FileText, Wand2, Loader2, CheckCircle2, Plus, X, Layers } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/services/api";
import { getDecks, createFlashcard, createDeck } from "@/services/flashcard.service";
import mammoth from "mammoth";
import { MainLayout } from "@/components/layout/MainLayout";

const suggestions = [
  "Generate 20 cards from Algorithms Chapter 4",
  "Create fill-in-the-blank questions for Network Security",
  "Summarize System Design concepts into cards",
  "Make cloze deletions for Data Science formulas",
];

const generatedPreview = [
  { front: "What algorithm finds shortest paths from a single source?", back: "Dijkstra's Algorithm — O((V+E) log V) with min-heap", confidence: 95 },
  { front: "Define a greedy algorithm", back: "An approach that makes locally optimal choices at each step hoping for a global optimum", confidence: 88 },
  { front: "What is the master theorem used for?", back: "Solving recurrences of the form T(n) = aT(n/b) + f(n)", confidence: 92 },
];

export default function AILabPage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  
  // Save to Deck State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | 'new' | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDecks().then(data => setDecks(data || []));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setPrompt(text.substring(0, 5000)); // Limit to prevent overload
      } else if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setPrompt(result.value.substring(0, 5000));
      } else {
        alert("Hiện tại hệ thống chỉ hỗ trợ trích xuất text từ file .txt và .docx trực tiếp trên trình duyệt.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi đọc file!");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGeneratedCards([]);
    
    try {
      const response = await apiFetch('/ai/generate-flashcards-from-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_content: prompt })
      });
      
      if (response && response.cards) {
        // Add fake confidence scores for UI flair
        const cardsWithConfidence = response.cards.map((c: any) => ({
          ...c,
          confidence: Math.floor(Math.random() * 15) + 85
        }));
        setGeneratedCards(cardsWithConfidence);
      }
    } catch (err: any) {
      alert("Lỗi tạo flashcard: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToDeck = async () => {
    if (!selectedDeckId) return alert("Vui lòng chọn bộ thẻ!");
    setIsSaving(true);
    try {
      let targetDeckId = selectedDeckId;
      if (selectedDeckId === 'new') {
        if (!newDeckName) return alert("Vui lòng nhập tên bộ thẻ mới!");
        const newDeck = await createDeck(newDeckName, "Tạo tự động từ AI Lab");
        targetDeckId = newDeck.id;
        setDecks([newDeck, ...decks]);
      }
      
      // Save all cards
      await Promise.all(
        generatedCards.map(card => createFlashcard(targetDeckId as number, card.front, card.back))
      );
      
      alert("Đã lưu toàn bộ thẻ thành công!");
      setShowSaveModal(false);
      setGeneratedCards([]);
      setPrompt("");
    } catch (err: any) {
      alert("Lỗi lưu thẻ: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-5">
        <div>
        <h1 style={{ color: "#111827", marginBottom: "4px", fontSize: "22px", fontWeight: 700 }}>AI Lab</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>Generate flashcards automatically from text, PDFs, or prompts</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Input panel */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            className="rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-150 relative overflow-hidden"
            style={{ border: "2px dashed #d1fae5", background: "#f0fdf4", minHeight: "140px" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1a3a2a";
              (e.currentTarget as HTMLElement).style.background = "#e8f0eb";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#d1fae5";
              (e.currentTarget as HTMLElement).style.background = "#f0fdf4";
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.docx"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#1a3a2a" }}>
              <Upload size={18} className="text-white" />
            </div>
            <div className="text-center">
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a3a2a" }}>Tải lên file tóm tắt</p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Hỗ trợ .TXT, .DOCX (Sẽ tự động trích xuất chữ vào ô bên dưới)</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg pointer-events-none"
              style={{ fontSize: "12px", fontWeight: 600, background: "#1a3a2a", color: "#fff" }}>
              <FileText size={12} /> Chọn File
            </button>
          </div>

          {/* Prompt input */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
              Or describe what to generate
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Generate 15 cards on binary trees covering insertion, deletion, and traversal..."
              className="w-full p-3 rounded-xl outline-none resize-none"
              style={{ border: "1px solid #e5e7eb", fontSize: "13px", color: "#374151", lineHeight: 1.6, minHeight: "100px", background: "#fff" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#1a3a2a")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Suggestions */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", marginBottom: "8px", letterSpacing: "0.05em" }}>QUICK PROMPTS</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 rounded-lg transition-colors duration-150"
                  style={{ fontSize: "11.5px", fontWeight: 500, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#e8f0eb";
                    (e.currentTarget as HTMLElement).style.color = "#1a3a2a";
                    (e.currentTarget as HTMLElement).style.borderColor = "#1a3a2a";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                    (e.currentTarget as HTMLElement).style.color = "#6b7280";
                    (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white"
            style={{ fontSize: "13.5px", fontWeight: 600,
              background: prompt.trim() ? "#1a3a2a" : "#d1d5db",
              cursor: prompt.trim() ? "pointer" : "not-allowed" }}
          >
            {generating ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Wand2 size={15} /> Generate Cards</>}
          </motion.button>
        </div>

        {/* Preview panel */}
        <div>
          {generatedCards.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Đã tạo {generatedCards.length} thẻ</span>
                </div>
                <button 
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#234b37] transition-colors"
                  style={{ fontSize: "12px", fontWeight: 600, background: "#1a3a2a", color: "#fff" }}>
                  <Plus size={13} /> Lưu vào bộ thẻ
                </button>
              </div>
              <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {generatedCards.map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} className="bg-white rounded-xl p-4 shadow-sm"
                    style={{ border: "1px solid #e5e7eb" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{card.front}</p>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full"
                        style={{ fontSize: "10px", fontWeight: 700, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                        {card.confidence}%
                      </span>
                    </div>
                    <p style={{ fontSize: "12.5px", color: "#6b7280", lineHeight: 1.5 }}>{card.back}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="h-full rounded-xl flex flex-col items-center justify-center gap-3"
              style={{ border: "1px dashed #e5e7eb", background: "#fafafa", minHeight: "400px" }}>
              <Sparkles size={32} style={{ color: "#d1d5db" }} />
              <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", maxWidth: "200px", lineHeight: 1.6 }}>
                Your generated cards will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SAVE TO DECK MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Layers size={18} /> Lưu {generatedCards.length} thẻ vào bộ thẻ
              </h3>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Chọn bộ thẻ đích</label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDeckId === 'new' ? 'border-[#1a3a2a] bg-[#f0fdf4]' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="deck_target" checked={selectedDeckId === 'new'} onChange={() => setSelectedDeckId('new')} className="text-[#1a3a2a]" />
                    <span className="text-sm font-bold text-gray-800">Tạo bộ thẻ mới...</span>
                  </label>
                  {decks.map(deck => (
                    <label key={deck.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDeckId === deck.id ? 'border-[#1a3a2a] bg-[#f0fdf4]' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="deck_target" checked={selectedDeckId === deck.id} onChange={() => setSelectedDeckId(deck.id)} className="text-[#1a3a2a]" />
                      <span className="text-sm font-semibold text-gray-700">{deck.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {selectedDeckId === 'new' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pt-2">
                  <input 
                    type="text" 
                    placeholder="Nhập tên bộ thẻ mới..."
                    value={newDeckName}
                    onChange={e => setNewDeckName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1a3a2a] focus:outline-none text-sm font-medium"
                  />
                </motion.div>
              )}
            </div>
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveToDeck}
                disabled={isSaving || !selectedDeckId}
                className="flex-1 py-2.5 bg-[#1a3a2a] text-white rounded-xl font-bold text-sm hover:bg-[#234b37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-[#1a3a2a]/20"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Lưu thẻ</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}
