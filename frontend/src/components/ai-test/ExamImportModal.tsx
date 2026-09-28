'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Trash2,
  Plus,
  ArrowLeft,
  Save,
  Check,
  Loader2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  parseExamFile,
  parseExamText,
  importExamQuestions,
  ParsedQuestionItem,
} from '@/services/ai-test.service';

interface ExamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (testSet: any) => void;
}

export default function ExamImportModal({ isOpen, onClose, onSuccess }: ExamImportModalProps) {
  // Step: 'upload' | 'preview'
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');

  // File & Text inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [examName, setExamName] = useState('');
  const [useAI, setUseAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse state & results
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState<'RULE_BASED' | 'AI_NORMALIZED'>('RULE_BASED');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!examName) {
        setExamName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!examName) {
        setExamName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleStartParsing = async () => {
    if (inputMode === 'file' && !selectedFile) {
      toast.error('Vui lòng chọn file đề thi (.docx, .pdf, .xlsx, .txt)');
      return;
    }
    if (inputMode === 'text' && !rawText.trim()) {
      toast.error('Vui lòng dán nội dung văn bản đề thi');
      return;
    }

    setParsing(true);
    try {
      let res;
      if (inputMode === 'file' && selectedFile) {
        res = await parseExamFile(selectedFile, examName, useAI);
      } else {
        res = await parseExamText({ textContent: rawText, name: examName, useAI });
      }

      if (res.error || !res.success || !res.data) {
        throw new Error(res.error || 'Không thể bóc tách nội dung đề thi');
      }

      setParsedQuestions(res.data.questions || []);
      setExtractionMethod(res.data.extractionMethod || 'RULE_BASED');
      setWarnings(res.data.warnings || []);
      setStats(res.data.stats || null);
      if (res.data.title && !examName) {
        setExamName(res.data.title);
      }
      setStep('preview');
      toast.success(`Đã bóc tách thành công ${res.data.questions?.length || 0} câu hỏi!`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi phân tích đề thi');
    } finally {
      setParsing(false);
    }
  };

  // Preview modifications
  const handleUpdateQuestion = (index: number, updates: Partial<ParsedQuestionItem>) => {
    setParsedQuestions(prev =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const handleUpdateOption = (qIndex: number, optKey: string, optVal: string) => {
    setParsedQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOpts = { ...(q.options || {}), [optKey]: optVal };
        return { ...q, options: newOpts };
      })
    );
  };

  const handleDeleteQuestion = (qIndex: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== qIndex));
    toast.success('Đã xóa câu hỏi khỏi bản xem trước');
  };

  const handleAddQuestion = () => {
    const newQ: ParsedQuestionItem = {
      index: parsedQuestions.length + 1,
      type: 'MULTIPLE_CHOICE',
      content: 'Nội dung câu hỏi mới',
      score: 1.0,
      options: { A: 'Lựa chọn A', B: 'Lựa chọn B', C: 'Lựa chọn C', D: 'Lựa chọn D' },
      correctAnswer: 'A',
    };
    setParsedQuestions(prev => [...prev, newQ]);
  };

  const handleSaveToQuestionSet = async (targetStatus: 'DRAFT' | 'APPROVED') => {
    if (parsedQuestions.length === 0) {
      toast.error('Bộ đề cần có ít nhất 1 câu hỏi');
      return;
    }

    setSaving(true);
    try {
      const res = await importExamQuestions({
        name: examName.trim() || 'Đề thi nhập vào',
        questions: parsedQuestions,
        status: targetStatus,
      });

      if (res.error || !res.success) {
        throw new Error(res.error || 'Không thể lưu bộ đề vào hệ thống');
      }

      toast.success(
        targetStatus === 'APPROVED'
          ? 'Đã duyệt và lưu bộ đề thành công!'
          : 'Đã lưu bản nháp đề thi thành công!'
      );
      onSuccess(res.data.testSet);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu bộ đề');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              {step === 'upload' ? <Upload className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {step === 'upload'
                  ? 'Nhập đề thi có sẵn (Word / PDF / Excel)'
                  : 'Xem trước & Hiệu chỉnh đề thi'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 'upload'
                  ? 'Bóc tách tự động câu hỏi, options A-B-C-D và bảng đáp án cuối đề'
                  : `Đã phát hiện ${parsedQuestions.length} câu hỏi. Bạn có thể sửa đổi trước khi lưu.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'upload' ? (
            <div className="space-y-6">
              {/* Exam Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên bộ đề thi
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="Ví dụ: Đề kiểm tra 1 tiết Đại số 12, Đề thi thử THPT..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Mode Toggle: File vs Text */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setInputMode('file')}
                  className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                    inputMode === 'file'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Tải lên file (.docx, .pdf, .xlsx, .txt)
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
                    inputMode === 'text'
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Dán nội dung văn bản
                </button>
              </div>

              {inputMode === 'file' ? (
                <div>
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx,.doc,.pdf,.xlsx,.xls,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                      {selectedFile?.name.endsWith('.xlsx') || selectedFile?.name.endsWith('.xls') ? (
                        <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
                      ) : (
                        <FileText className="w-7 h-7" />
                      )}
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-base">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB — Nhấp để chọn file khác
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Kéo thả file đề thi vào đây, hoặc{' '}
                          <span className="text-indigo-600 dark:text-indigo-400 underline">duyệt từ máy</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Hỗ trợ định dạng Word (.docx), PDF (.pdf), Excel (.xlsx) và TXT
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nội dung đề thi & Bảng đáp án
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder={`Câu 1: Thủ đô của Việt Nam là gì?\nA. Đà Nẵng\nB. Hà Nội\nC. TP. Hồ Chí Minh\nD. Cần Thơ\nĐáp án: B\n\nCâu 2: ...`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono leading-relaxed"
                  />
                </div>
              )}

              {/* Extraction Engine Notice & Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Ưu tiên Rule-Based Regex Engine
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Phân tích trực tiếp từ cấu trúc file và nhận diện bảng đáp án cuối bài (BẢNG ĐÁP ÁN: 1.A, 2.B...). Hoàn toàn không tiêu tốn token AI.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={e => setUseAI(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Fallback AI khi layout vỡ
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Method & Stats Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      extractionMethod === 'RULE_BASED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {extractionMethod === 'RULE_BASED' ? (
                      <>
                        <Zap className="w-3.5 h-3.5" /> Bóc tách Rule-Based (Regex)
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Chuẩn hóa bằng AI
                      </>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tổng: {parsedQuestions.length} câu
                  </span>
                </div>

                {stats && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Trắc nghiệm: {stats.multipleChoiceCount}</span>
                    <span>•</span>
                    <span>Đã nhận diện đáp án: {stats.answerKeyCount}/{stats.totalQuestions}</span>
                  </div>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {warnings.map((w, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable Question Cards */}
              <div className="space-y-4">
                {parsedQuestions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    {/* Top Row: Index, Type, Score, Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          Câu {qIndex + 1}
                        </span>
                        <select
                          value={q.type}
                          onChange={e => handleUpdateQuestion(qIndex, { type: e.target.value as any })}
                          className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="MULTIPLE_CHOICE">Trắc nghiệm (MCQ)</option>
                          <option value="TRUE_FALSE">Đúng / Sai</option>
                          <option value="FILL_BLANK">Điền từ khuyết</option>
                          <option value="ESSAY">Tự luận</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span>Điểm:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="10"
                            value={q.score}
                            onChange={e => handleUpdateQuestion(qIndex, { score: parseFloat(e.target.value) || 1 })}
                            className="w-14 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-semibold text-xs"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(qIndex)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <textarea
                      rows={2}
                      value={q.content}
                      onChange={e => handleUpdateQuestion(qIndex, { content: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    {/* Options (for MULTIPLE_CHOICE & TRUE_FALSE) */}
                    {(q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {['A', 'B', 'C', 'D'].map(optKey => {
                          const optText = q.options?.[optKey];
                          if (optText === undefined && q.type === 'TRUE_FALSE' && (optKey === 'C' || optKey === 'D')) {
                            return null;
                          }
                          const isCorrect = q.correctAnswer === optKey;

                          return (
                            <div
                              key={optKey}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleUpdateQuestion(qIndex, { correctAnswer: optKey })}
                                className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center transition flex-shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Bấm để đặt làm đáp án đúng"
                              >
                                {optKey}
                              </button>
                              <input
                                type="text"
                                value={optText || ''}
                                onChange={e => handleUpdateOption(qIndex, optKey, e.target.value)}
                                placeholder={`Nội dung phương án ${optKey}`}
                                className="flex-1 text-xs bg-transparent border-0 focus:outline-none text-slate-800 dark:text-slate-200"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Non-MCQ Answer & Explanation */}
                    {q.type !== 'MULTIPLE_CHOICE' && q.type !== 'TRUE_FALSE' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-20">
                            Đáp án gợi ý:
                          </span>
                          <input
                            type="text"
                            value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
                            onChange={e => handleUpdateQuestion(qIndex, { correctAnswer: e.target.value })}
                            placeholder="Nhập đáp án chuẩn hoặc từ khóa..."
                            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <button
                onClick={handleAddQuestion}
                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" /> Thêm câu hỏi thủ công
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          {step === 'upload' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStartParsing}
                disabled={parsing}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang bóc tách đề...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Bóc tách & Xem trước
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại tải file
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSaveToQuestionSet('DRAFT')}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold text-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Lưu bản nháp (DRAFT)
                </button>
                <button
                  onClick={() => handleSaveToQuestionSet('APPROVED')}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Duyệt & Lưu bộ đề
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
