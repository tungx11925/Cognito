"use client";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, FileText, BookOpen, Upload, ChevronDown, Settings2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { MainLayout } from "@/components/layout/MainLayout";
import TestSetWorkspace from "@/components/ai-test/TestSetWorkspace";
import {
  getAIConfig, updateAIConfig,
  getMyDocuments, getMyDecks, getDeckContent, getDocumentContent,
  getTestSets, generateTestSet, toggleTestSetStatus, deleteTestSet,
} from "@/services/ai-test.service";
import mammoth from "mammoth";

const CONFIG_KEY = "default";

type SourceType = "paste" | "document" | "deck" | "upload";

interface AIConfig {
  id: number; use_custom_prompt: boolean; custom_prompt: string;
  multiple_choice_count: number; multiple_choice_score: number;
  fill_blank_count: number; fill_blank_score: number;
  essay_count: number; essay_score: number;
  true_false_count: number; true_false_score: number;
}
interface TestSet {
  id: number; name: string; total_questions: number; total_score: number;
  is_active: boolean; created_at: string;
}

const SCORE_ROWS = [
  { label: "Trắc nghiệm", ck: "multiple_choice_count", sk: "multiple_choice_score" },
  { label: "Điền từ",     ck: "fill_blank_count",       sk: "fill_blank_score" },
  { label: "Tự luận",     ck: "essay_count",             sk: "essay_score" },
  { label: "Đúng / Sai",  ck: "true_false_count",        sk: "true_false_score" },
];

export default function AITestPage() {
  const [config, setConfig]       = useState<AIConfig | null>(null);
  const [testSets, setTestSets]   = useState<TestSet[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [editTarget, setEditTarget] = useState<TestSet | null>(null);

  // Source picker
  const [sourceType, setSourceType] = useState<SourceType>("paste");
  const [pasteText, setPasteText]   = useState("");
  const [myDocs, setMyDocs]         = useState<any[]>([]);
  const [myDecks, setMyDecks]       = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc]   = useState<number | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  const [uploadedText, setUploadedText] = useState("");
  const [testName, setTestName]         = useState("");
  const [fileUrl, setFileUrl]           = useState<string | null>(null);
  const [fileName, setFileName]         = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, reset } = useForm<AIConfig>();
  const w = watch();
  const totalScore =
    (Number(w.multiple_choice_count)||0)*(Number(w.multiple_choice_score)||0) +
    (Number(w.fill_blank_count)||0)*(Number(w.fill_blank_score)||0) +
    (Number(w.essay_count)||0)*(Number(w.essay_score)||0) +
    (Number(w.true_false_count)||0)*(Number(w.true_false_score)||0);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAIConfig(CONFIG_KEY), getTestSets(), getMyDocuments(), getMyDecks()])
      .then(([cfg, sets, docs, decks]) => {
        if (cfg && !cfg.error) { setConfig(cfg); reset(cfg); }
        setTestSets(Array.isArray(sets) ? sets : []);
        setMyDocs(Array.isArray(docs) ? docs : []);
        setMyDecks(Array.isArray(decks) ? decks : []);
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSaveConfig = handleSubmit(async (data) => {
    setSaving(true);
    const r = await updateAIConfig(CONFIG_KEY, data);
    setSaving(false);
    if (r?.error) toast.error(r.error);
    else { setConfig(r); toast.success("Đã lưu cấu hình!"); }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const tid = toast.loading("Đang đọc file...");
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'txt') {
        setUploadedText(await file.text());
      } else if (ext === 'docx') {
        const buf = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        setUploadedText(value);
      } else if (ext === 'pptx' || ext === 'ppsx') {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        let textContent = '';
        const slideFiles = Object.keys(loadedZip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
        slideFiles.sort((a, b) => {
          const matchA = a.match(/slide(\d+)\.xml/);
          const matchB = b.match(/slide(\d+)\.xml/);
          if (matchA && matchB) return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
          return 0;
        });
        for (const slideFile of slideFiles) {
          const content = await loadedZip.files[slideFile].async('string');
          const textMatches = content.match(/<a:t>([\s\S]*?)<\/a:t>/g);
          if (textMatches) {
            textContent += textMatches.map(t => t.replace(/<[^>]+>/g, '')).join(' ') + '\n\n';
          }
        }
        setUploadedText(textContent);
      } else if (ext === 'odp') {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const contentXml = await loadedZip.files['content.xml'].async('string');
        const textMatches = contentXml.match(/<text:[ph][^>]*>([\s\S]*?)<\/text:[ph]>/g);
        let textContent = '';
        if (textMatches) {
           textContent = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('\n');
        }
        setUploadedText(textContent);
      } else if (ext === 'ppt' || ext === 'key') {
        toast("Đang thử rút trích dữ liệu từ định dạng cũ/phức tạp...", { icon: "⚠️" });
        const buf = await file.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        let text = "";
        let currentString = "";
        for (let i = 0; i < uint8.length; i++) {
          const charCode = uint8[i];
          if (charCode >= 32 && charCode <= 126) {
            currentString += String.fromCharCode(charCode);
          } else {
            if (currentString.length >= 5) text += currentString + " ";
            currentString = "";
          }
        }
        setUploadedText(text);
      } else if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContentObj = await page.getTextContent();
          textContent += textContentObj.items.map((item: any) => item.str).join(' ') + '\n\n';
        }
        setUploadedText(textContent);
      } else {
        toast.error("Định dạng chưa được hỗ trợ. Vui lòng dùng .txt, .docx, .pptx, .ppsx, .odp, .pdf, .ppt, .key");
        return;
      }
      setFileName(file.name);
      if (ext === 'pdf') {
        setFileUrl(URL.createObjectURL(file));
      } else {
        setFileUrl(null);
      }
      toast.dismiss(tid);
    } catch (err: any) { 
      toast.dismiss(tid);
      toast.error("Lỗi đọc file: " + err.message); 
      console.error(err);
    }
  };

  const resolveContent = async (): Promise<string> => {
    if (sourceType === "paste")  return pasteText;
    if (sourceType === "upload") return uploadedText;
    if (sourceType === "document" && selectedDoc) {
      const r = await getDocumentContent(selectedDoc);
      return r?.content || "";
    }
    if (sourceType === "deck" && selectedDeck) {
      const r = await getDeckContent(selectedDeck);
      return r?.content || "";
    }
    return "";
  };

  const handleGenerate = async () => {
    const content = await resolveContent();
    if (!content || content.trim().length < 20) {
      toast.error("Vui lòng cung cấp nội dung ít nhất 20 ký tự."); return;
    }
    setGenerating(true);
    const tid = toast.loading("AI đang tạo bộ đề...");
    try {
      const r = await generateTestSet({ configKey: CONFIG_KEY, documentContent: content, name: testName || undefined });
      toast.dismiss(tid);
      if (r?.error) { toast.error(r.error); return; }
      toast.success(r.message || "Tạo thành công!");
      setTestSets(prev => [r.testSet, ...prev]);
      setShowGenPanel(false); setPasteText(""); setUploadedText(""); setTestName("");
    } catch (e: any) { toast.dismiss(tid); toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const handleToggle = async (ts: TestSet) => {
    const r = await toggleTestSetStatus(ts.id, !ts.is_active);
    if (!r?.error) setTestSets(prev => prev.map(s => s.id === ts.id ? { ...s, is_active: !s.is_active } : s));
  };

  const handleDelete = (ts: TestSet) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="text-sm font-semibold">Xóa bộ đề <b>"{ts.name}"</b>?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 text-xs bg-gray-100 rounded-lg font-bold">Hủy</button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            const r = await deleteTestSet(ts.id);
            if (r?.error) toast.error(r.error);
            else { setTestSets(prev => prev.filter(s => s.id !== ts.id)); toast.success("Đã xóa"); }
          }} className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg font-bold">Xóa</button>
        </div>
      </div>
    ), { duration: Infinity, style: { borderRadius: "16px" } });
  };

  if (loading) return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1a3a2a]/20 border-t-[#1a3a2a] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1a3a2a] rounded-xl flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              Bài tập AI
            </h1>
            <p className="text-sm text-gray-500 mt-1">Tự động tạo bộ đề từ tài liệu, flashcard hoặc nội dung bất kỳ.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfig(p => !p)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
              <Settings2 size={14} /> Cấu hình
            </button>
            <button onClick={() => setShowGenPanel(p => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3a2a] text-white text-sm font-bold rounded-xl hover:bg-[#234b37] transition-colors shadow-lg shadow-[#1a3a2a]/20">
              <Plus size={15} /> Tạo đề mới
            </button>
          </div>
        </div>

        {/* CONFIG PANEL */}
        {/* CONFIG MODAL */}
        <AnimatePresence>
          {showConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }} 
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa trợ giảng - Bài tập AI</h2>
                  <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>
                
                {/* Mock Tabs */}
                <div className="px-6 border-b border-gray-100 flex gap-6 overflow-x-auto text-sm font-semibold text-gray-400">
                  <div className="py-3 cursor-pointer hover:text-gray-600 border-b-2 border-transparent">Cơ bản</div>
                  <div className="py-3 cursor-pointer hover:text-gray-600 border-b-2 border-transparent">Bài đọc thêm</div>
                  <div className="py-3 border-b-2 border-[#1a3a2a] text-[#1a3a2a]">Bài tập AI</div>
                  <div className="py-3 cursor-pointer hover:text-gray-600 border-b-2 border-transparent">Bài tập</div>
                  <div className="py-3 cursor-pointer hover:text-gray-600 border-b-2 border-transparent">Bài giảng AI</div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                  {/* Language & Toggle */}
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Ngôn ngữ tạo đề</label>
                      <select className="w-full sm:w-1/3 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-[#1a3a2a] bg-white">
                        <option>Tiếng Việt</option>
                        <option>Tiếng Anh</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group pt-2 border-t border-gray-100">
                      <div className="relative flex items-center">
                        <input type="checkbox" {...register("use_custom_prompt")} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1a3a2a]"></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                        Nâng cao: Sử dụng prompt tùy chỉnh để cá nhân hoá cách AI tạo câu hỏi
                      </span>
                    </label>
                  </div>
                  
                  {w.use_custom_prompt && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <textarea {...register("custom_prompt")} rows={8}
                        placeholder="Nhập prompt tùy chỉnh tại đây..."
                        className="w-full border border-gray-200 rounded-xl p-4 text-sm font-mono text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a2a]/20 focus:border-[#1a3a2a] transition-all bg-gray-50 leading-relaxed" />
                    </div>
                  )}

                  {/* Settings Grid */}
                  <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles size={14} className="text-[#1a3a2a]" /> Cấu trúc đề thi
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {SCORE_ROWS.map(row => (
                        <div key={row.label} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-3">
                          <p className="text-sm font-bold text-gray-700 border-b border-gray-50 pb-2">{row.label}</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between group">
                              <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600 transition-colors">SỐ CÂU</span>
                              <input type="number" min={0} {...register(row.ck as any, { valueAsNumber: true })}
                                className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-center focus:outline-none focus:border-[#1a3a2a] text-[#1a3a2a] bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                            <div className="flex items-center justify-between group">
                              <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600 transition-colors">ĐIỂM/CÂU</span>
                              <input type="number" min={0} step={0.25} {...register(row.sk as any, { valueAsNumber: true })}
                                className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold text-center focus:outline-none focus:border-[#1a3a2a] text-[#1a3a2a] bg-gray-50 focus:bg-white transition-colors" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    Tổng điểm cấu hình: <span className="text-lg text-[#1a3a2a] font-black">{totalScore.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowConfig(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-gray-100 border border-gray-200 rounded-xl transition-colors">
                      Hủy
                    </button>
                    <button onClick={onSaveConfig} disabled={saving} className="px-6 py-2.5 bg-[#1a3a2a] text-white text-sm font-bold rounded-xl hover:bg-[#234b37] transition-all flex items-center gap-2 shadow-lg shadow-[#1a3a2a]/20 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Cập nhật cấu hình
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* GENERATE PANEL */}
        <AnimatePresence>
          {showGenPanel && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">✨ Tạo bộ đề mới</h3>
                  <button onClick={() => setShowGenPanel(false)}><X size={16} className="text-gray-400" /></button>
                </div>

                {/* Test name */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên bộ đề (tuỳ chọn)</label>
                  <input value={testName} onChange={e => setTestName(e.target.value)}
                    placeholder="Để trống sẽ tự tạo tên theo ngày..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a2a]" />
                </div>

                {/* Source type tabs */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Nguồn nội dung</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "paste",    icon: <FileText size={13} />,  label: "Dán văn bản" },
                      { key: "document", icon: <BookOpen size={13} />,  label: "Tài liệu của tôi" },
                      { key: "deck",     icon: <Sparkles size={13} />,  label: "Bộ Flashcard" },
                      { key: "upload",   icon: <Upload size={13} />,    label: "Upload slide" },
                    ].map(s => (
                      <button key={s.key} onClick={() => setSourceType(s.key as SourceType)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${sourceType === s.key ? "bg-[#1a3a2a] text-white border-[#1a3a2a]" : "bg-white text-gray-600 border-gray-200 hover:border-[#1a3a2a]"}`}>
                        {s.icon} {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source content */}
                {sourceType === "paste" && (
                  <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={7}
                    placeholder="Dán nội dung bài giảng, ghi chú, hoặc bất kỳ văn bản nào vào đây..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#1a3a2a]" />
                )}

                {sourceType === "document" && (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {myDocs.length === 0
                      ? <p className="text-sm text-gray-400 text-center py-4">Chưa có tài liệu nào trong thư viện</p>
                      : myDocs.map(d => (
                        <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDoc === d.id ? "border-[#1a3a2a] bg-[#f0fdf4]" : "border-gray-200 hover:bg-gray-50"}`}>
                          <input type="radio" name="doc" checked={selectedDoc === d.id} onChange={() => setSelectedDoc(d.id)} className="accent-[#1a3a2a]" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{d.title}</p>
                            <p className="text-xs text-gray-400">{d.category} · {d.file_type}</p>
                          </div>
                        </label>
                      ))
                    }
                  </div>
                )}

                {sourceType === "deck" && (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {myDecks.length === 0
                      ? <p className="text-sm text-gray-400 text-center py-4">Chưa có bộ thẻ nào</p>
                      : myDecks.map(d => (
                        <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDeck === d.id ? "border-[#1a3a2a] bg-[#f0fdf4]" : "border-gray-200 hover:bg-gray-50"}`}>
                          <input type="radio" name="deck" checked={selectedDeck === d.id} onChange={() => setSelectedDeck(d.id)} className="accent-[#1a3a2a]" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                            <p className="text-xs text-gray-400">{d.card_count} thẻ</p>
                          </div>
                        </label>
                      ))
                    }
                  </div>
                )}

                {sourceType === "upload" && (
                  <div className="space-y-4">
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-[#1a3a2a] hover:bg-[#f0fdf4] transition-colors">
                      <Upload size={24} className="text-gray-400" />
                      <p className="text-sm font-semibold text-gray-600">Tải lên tài liệu / slide</p>
                      <p className="text-xs text-gray-400 text-center">Hỗ trợ TXT, DOCX, PPTX, PPSX, ODP, PDF, PPT, KEY<br/>Nhấp để tải lên để xem trước trên web</p>
                      {uploadedText && <p className="text-xs text-green-600 font-bold mt-1">✓ Đã đọc {uploadedText.length} ký tự từ {fileName}</p>}
                    </div>
                    <input ref={fileRef} type="file" accept=".txt,.docx,.pptx,.ppsx,.odp,.pdf,.ppt,.key" className="hidden" onChange={handleFileUpload} />
                    
                    {/* File Preview directly on web */}
                    {uploadedText && (
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col">
                        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-600">Xem trước Slide / Tài liệu</p>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded border text-gray-500">{fileName}</span>
                        </div>
                        {fileUrl && fileName.endsWith('.pdf') ? (
                          <object data={fileUrl} type="application/pdf" className="w-full h-[400px]" />
                        ) : (
                          <div className="p-4 max-h-[400px] overflow-y-auto">
                            <p className="text-xs text-gray-400 mb-2 italic">Không thể hiển thị định dạng này trực tiếp. Đây là văn bản được trích xuất:</p>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-3 border rounded shadow-inner leading-relaxed">
                              {uploadedText}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    AI sẽ dùng cấu hình prompt đã lưu của bạn để tạo đề.
                  </p>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a2a] text-white text-sm font-bold rounded-xl hover:bg-[#234b37] disabled:opacity-50 transition-colors shadow-md shadow-[#1a3a2a]/20">
                    {generating ? <><Loader2 size={14} className="animate-spin" /> Đang tạo...</> : <><Sparkles size={14} /> Tạo bộ đề</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TEST SETS GRID */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 mb-3">Bộ đề của tôi ({testSets.length})</h2>
          {testSets.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-gray-400">
              <Sparkles size={32} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Chưa có bộ đề nào</p>
              <p className="text-xs mt-1">Nhấn "+ Tạo đề mới" và chọn nguồn nội dung</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testSets.map(ts => (
                <motion.div key={ts.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{ts.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(ts.created_at).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <button onClick={() => handleToggle(ts)} className={`flex-shrink-0 transition-colors ${ts.is_active ? "text-[#1a3a2a]" : "text-gray-300"}`} title={ts.is_active ? "Bật" : "Tắt"}>
                      {ts.is_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-gray-400">Số câu</p>
                      <p className="text-base font-bold text-gray-900">{ts.total_questions}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-green-600">Tổng điểm</p>
                      <p className="text-base font-bold text-[#1a3a2a]">{Number(ts.total_score).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditTarget(ts)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#1a3a2a] bg-[#f0fdf4] border border-[#d1fae5] rounded-xl hover:bg-[#dcfce7] transition-colors">
                      <Edit3 size={12} /> Xem / Sửa
                    </button>
                    <button onClick={() => handleDelete(ts)}
                      className="px-3 py-2 text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editTarget && (
          <TestSetWorkspace testSetId={editTarget.id} testSetName={editTarget.name} onClose={() => setEditTarget(null)} />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
