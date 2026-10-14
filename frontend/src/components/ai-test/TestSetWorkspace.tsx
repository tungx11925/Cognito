"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Panel, Group, Separator } from "react-resizable-panels";
import Link from "next/link";
import { X, Save, CheckCircle2, Clock, Sparkles, Send, Loader2, Play, BookOpen, Trash2, BadgeCheck, FileEdit, AlertTriangle, PlusCircle, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import { getQuestions, bulkUpdateQuestions, approveTestSet, deleteQuestion, getTestSetDetail, updateQuestion } from "@/services/ai-test.service";
import { apiFetch } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Option { A: string; B: string; C: string; D: string }
interface Question {
  id: number;
  type: "MULTIPLE_CHOICE" | "FILL_BLANK" | "ESSAY" | "TRUE_FALSE";
  content: string;
  score: number;
  status: "DRAFT" | "APPROVED";
  options?: Option;
  correct_answer?: any;
  explanation?: string | null;
  difficulty?: string | null;
  source_keyword?: string | null;
}
interface FormValues { questions: Question[] }


const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  FILL_BLANK: "Điền từ",
  ESSAY: "Tự luận",
  TRUE_FALSE: "Đúng / Sai",
};
const TABS = ["MULTIPLE_CHOICE", "FILL_BLANK", "ESSAY", "TRUE_FALSE"] as const;

interface Props {
  testSetId: number;
  testSetName: string;
  onClose: () => void;
}

export default function TestSetWorkspace({ testSetId, testSetName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("MULTIPLE_CHOICE");
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [testSetStatus, setTestSetStatus] = useState<"DRAFT" | "APPROVED">("DRAFT");
  const [approving, setApproving] = useState(false);
  const [savingSingleId, setSavingSingleId] = useState<number | null>(null);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: "user" | "ai", content: string}[]>([
    { role: "ai", content: "Chào bạn! Tôi là **AI Trợ giảng** 🎓\n\nTôi có thể giúp bạn:\n- ✅ **Kiểm tra lỗi sai** trong câu hỏi\n- ➕ **Tạo thêm câu hỏi** theo yêu cầu\n- 📊 **Phân tích độ khó** của bộ đề\n- 💡 **Gợi ý cải thiện** đề thi\n\nHãy nhập yêu cầu hoặc chọn nhanh bên dưới!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const { register, control, handleSubmit, reset, getValues } = useForm<FormValues>({
    defaultValues: { questions: [] },
  });
  const { fields, append } = useFieldArray({ control, name: "questions" });

  useEffect(() => {
    setLoading(true);
    getQuestions(testSetId)
      .then((data: Question[]) => {
        if (Array.isArray(data)) reset({ questions: data });
        else toast.error("Không tải được câu hỏi");
      })
      .finally(() => setLoading(false));
    // Trạng thái bộ đề (DRAFT/APPROVED) từ GET /api/test-sets/:id
    getTestSetDetail(testSetId)
      .then((ts: any) => {
        if (ts && !ts.error && ts.status) setTestSetStatus(ts.status);
      })
      .catch(() => {});
  }, [testSetId, reset]);

  const handleApprove = async () => {
    setApproving(true);
    const tid = toast.loading("Đang duyệt bộ đề...");
    const r = await approveTestSet(testSetId);
    toast.dismiss(tid);
    setApproving(false);
    if (r?.error) { toast.error(r.error); return; }
    setTestSetStatus("APPROVED");
    const updated = (getValues().questions || []).map(q => ({ ...q, status: "APPROVED" as const }));
    reset({ questions: updated });
    toast.success("Đã duyệt & lưu! Bộ đề đã sẵn sàng để luyện tập.");
  };

  const handleSaveSingleQuestion = async (idx: number) => {
    const q = getValues(`questions.${idx}`);
    if (!q || !q.id) return;
    setSavingSingleId(q.id);
    const tid = toast.loading(`Đang lưu câu hỏi ${idx + 1}...`);
    try {
      const res = await updateQuestion(q.id, {
        content: q.content,
        score: q.score,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        status: q.status,
      });
      toast.dismiss(tid);
      if (res?.error) {
        toast.error("Lỗi: " + res.error);
      } else {
        toast.success(`Đã lưu câu hỏi ${idx + 1}!`);
      }
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || "Lỗi khi lưu câu hỏi");
    } finally {
      setSavingSingleId(null);
    }
  };

  const handleDeleteQuestion = async (qId: number) => {
    if (!window.confirm("Bạn có chắc muốn xoá câu hỏi này?")) return;
    const r = await deleteQuestion(qId);
    if (r?.error) { toast.error(r.error); return; }
    const remaining = (getValues().questions || []).filter(q => q.id !== qId);
    reset({ questions: remaining });
    toast.success("Đã xoá câu hỏi");
  };

  const filteredFields = fields
    .map((f, i) => ({ ...f, globalIdx: i }))
    .filter((f) => f.type === activeTab);

  const onSubmit = async (data: FormValues) => {
    const toastId = toast.loading("Đang lưu thay đổi...");
    const result = await bulkUpdateQuestions(data.questions);
    toast.dismiss(toastId);
    if (result?.error) toast.error("Lỗi: " + result.error);
    else toast.success(`Đã lưu ${result.updatedIds?.length ?? 0} câu hỏi!`);
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  const sendChatMessage = async (msg: string) => {
    if (!msg.trim() || chatLoading) return;
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    const currentQs = getValues().questions || [];
    const qSummary = currentQs.slice(0, 5).map((q, i) =>
      `Câu ${i+1}: ${q.content?.slice(0, 80)}... [${q.type}, đáp án: ${q.correct_answer || "?"}]`
    ).join("\n");

    const contextualMessage = `[Bộ đề: "${testSetName}" — ${currentQs.length} câu hỏi]\n${qSummary.length > 0 ? `Ví dụ câu hỏi:\n${qSummary}\n\n` : ""}Yêu cầu: ${msg}`;

    try {
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualMessage,
          context_mode: 'GENERAL',
        })
      });

      const aiReply = res?.reply || "Tôi đã ghi nhận yêu cầu. Vui lòng thử lại hoặc mô tả rõ hơn!";
      setChatMessages(prev => [...prev, { role: "ai", content: aiReply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "ai", content: "⚠️ Lỗi kết nối. Vui lòng thử lại." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput("");
    await sendChatMessage(msg);
  };

  const handleQuickAction = (text: string) => {
    sendChatMessage(text);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF8F5] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-[#1a3a2a]" /> Workspace Bộ đề
              {testSetStatus === "DRAFT" ? (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <FileEdit size={10} /> NHÁP — chưa công khai
                </span>
              ) : (
                <span className="text-[10px] font-black text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <BadgeCheck size={10} /> ĐÃ DUYỆT
                </span>
              )}
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{testSetName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit(onSubmit)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#1a3a2a] rounded-xl hover:bg-[#234b37] transition-colors shadow-md shadow-[#1a3a2a]/20"
          >
            <Save size={16} /> Lưu thay đổi
          </button>
          {testSetStatus === "DRAFT" && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md shadow-emerald-600/20"
            >
              {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Duyệt &amp; Lưu
            </button>
          )}
          <Link
            href={`/quiz/${testSetId}`}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
          >
            <Play size={16} className="fill-emerald-800" /> Làm bài thi
          </Link>
        </div>
      </div>

      {/* Workspace Area */}
      {/* @ts-ignore */}
      <Group direction="horizontal" className="flex-1 overflow-hidden">
        {/* Left Panel - Test Editor */}
        <Panel defaultSize={65} minSize={40} className="flex flex-col bg-white h-full relative">
          <div className="flex border-b border-gray-100 px-6 flex-shrink-0 pt-2 shadow-sm relative z-10 bg-white">
            {TABS.map((tab) => {
              const count = fields.filter((f) => f.type === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors mr-2 ${
                    activeTab === tab
                      ? "border-[#1a3a2a] text-[#1a3a2a]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {TYPE_LABEL[tab]}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab ? "bg-[#1a3a2a] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 bg-gray-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="w-8 h-8 border-4 border-[#1a3a2a]/20 border-t-[#1a3a2a] rounded-full animate-spin" />
                <p className="text-sm font-semibold">Đang tải dữ liệu...</p>
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Sparkles size={32} className="opacity-30" />
                <p className="text-sm font-semibold">Chưa có câu hỏi loại {TYPE_LABEL[activeTab]}</p>
              </div>
            ) : (
              filteredFields.map(({ globalIdx }, i) => {
                const isExpanded = expandedIdx === globalIdx;
                return (
                  <div key={globalIdx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div
                      className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-500 flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                          {fields[globalIdx].content || "(Chưa có nội dung)"}
                        </p>
                        {fields[globalIdx].explanation?.includes('LOW_GROUNDING') && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200">
                            ⚠️ Cần soát lại nội dung (AI cảnh báo: độ bám sát tài liệu thấp)
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0 pt-1">
                        <span className="text-xs font-bold text-[#1a3a2a] bg-[#f0fdf4] border border-[#d1fae5] px-2.5 py-1 rounded-lg">
                          {fields[globalIdx].score} điểm
                        </span>
                        {fields[globalIdx].status === "APPROVED" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 size={12} /> Đã duyệt
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <Clock size={12} /> Bản nháp
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(fields[globalIdx].id); }}
                          title="Xoá câu hỏi"
                          className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={11} /> Xoá
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-4 bg-gray-50/50">
                            <div>
                              <label className="text-xs font-bold text-gray-600 mb-1.5 block">Nội dung câu hỏi</label>
                              <textarea
                                {...register(`questions.${globalIdx}.content`)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-800 resize-none focus:outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-white shadow-sm"
                              />
                            </div>

                            {(fields[globalIdx].type === "MULTIPLE_CHOICE" || fields[globalIdx].type === "TRUE_FALSE") && (
                              <div className="grid grid-cols-2 gap-3">
                                {(["A", "B", "C", "D"] as const).map((opt) => (
                                  <div key={opt}>
                                    <label className="text-[11px] font-bold text-gray-500 mb-1.5 block flex items-center gap-1">
                                      <span className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center text-gray-700">{opt}</span>
                                      Đáp án
                                    </label>
                                    <input
                                      {...register(`questions.${globalIdx}.options.${opt}` as any)}
                                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a2a] focus:ring-1 focus:ring-[#1a3a2a] transition-all bg-white shadow-sm"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                              <div>
                                <label className="text-xs font-bold text-emerald-600 mb-1.5 block">Đáp án đúng</label>
                                <input
                                  {...register(`questions.${globalIdx}.correct_answer` as any)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                  placeholder="Vd: A"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Điểm</label>
                                <input
                                  type="number" step="0.25" min="0"
                                  {...register(`questions.${globalIdx}.score`, { valueAsNumber: true })}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#1a3a2a] transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Trạng thái</label>
                                <select
                                  {...register(`questions.${globalIdx}.status`)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#1a3a2a] transition-all bg-gray-50"
                                >
                                  <option value="DRAFT">Bản nháp</option>
                                  <option value="APPROVED">Đã duyệt</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                              <div>
                                <label className="text-xs font-bold text-indigo-600 mb-1.5 block">Giải thích (explanation)</label>
                                <textarea
                                  {...register(`questions.${globalIdx}.explanation` as any)}
                                  rows={2}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                                  placeholder="Giải thích chi tiết phương án và kiến thức trọng tâm..."
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-600 mb-1.5 block">Độ khó</label>
                                <select
                                  {...register(`questions.${globalIdx}.difficulty` as any)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#1a3a2a] transition-all bg-gray-50"
                                >
                                  <option value="easy">Dễ</option>
                                  <option value="medium">Trung bình</option>
                                  <option value="hard">Khó</option>
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1.5">
                                  Từ khoá nguồn: <b>{fields[globalIdx].source_keyword || "—"}</b>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <span className="text-[11px] text-gray-400">
                                ID: #{fields[globalIdx].id}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(fields[globalIdx].id)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                  <Trash2 size={13} /> Xoá câu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleQuestion(globalIdx)}
                                  disabled={savingSingleId === fields[globalIdx].id}
                                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#1a3a2a] hover:bg-[#234b37] rounded-xl transition-colors shadow-sm disabled:opacity-50"
                                >
                                  {savingSingleId === fields[globalIdx].id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Save size={13} />
                                  )}
                                  Lưu câu này
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        <Separator className="w-1.5 bg-gray-200 hover:bg-[#1a3a2a] transition-colors cursor-col-resize flex flex-col justify-center items-center group">
          <div className="h-8 w-1 rounded-full bg-gray-400 group-hover:bg-white transition-colors"></div>
        </Separator>

        {/* Right Panel - AI Assistant */}
        <Panel defaultSize={35} minSize={25} className="flex flex-col bg-[#f5f3ee]">
          <div className="p-4 border-b border-[rgba(26,46,28,0.1)] bg-white shadow-sm flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-black text-[#1a2e1c] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-[#1a3a2a]">
                <Sparkles size={14} />
              </div>
              AI Trợ giảng
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Markdown + LaTeX ✓
            </span>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#1a3a2a] text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 border border-[rgba(26,46,28,0.12)] rounded-tl-sm'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-[#1a3a2a] prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span>{msg.content}</span>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[rgba(26,46,28,0.12)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '120ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '240ms' }}></div>
                  <span className="text-[11px] text-gray-400 ml-1">AI đang soạn...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-[rgba(26,46,28,0.08)] flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar flex-wrap">
              <button
                onClick={() => handleQuickAction(`Kiểm tra toàn bộ ${getValues().questions?.length || 0} câu trong bộ đề "${testSetName}": phát hiện câu mơ hồ, đáp án sai, câu thiếu giải thích. Liệt kê cụ thể từng vấn đề.`)}
                disabled={chatLoading}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={11} /> Kiểm tra lỗi sai
              </button>
              <button
                onClick={() => handleQuickAction(`Tạo thêm 5 câu trắc nghiệm khó về chủ đề "${testSetName}". Mỗi câu có 4 đáp án A/B/C/D, ghi rõ đáp án đúng và giải thích ngắn. Trình bày dạng markdown.`)}
                disabled={chatLoading}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <PlusCircle size={11} /> Thêm 5 câu khó
              </button>
              <button
                onClick={() => handleQuickAction(`Phân tích bộ đề "${testSetName}" (${getValues().questions?.length || 0} câu): phân bố độ khó, chủ đề trọng tâm, tỷ lệ các loại câu hỏi. Đưa ra nhận xét và gợi ý cải thiện.`)}
                disabled={chatLoading}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#f0fdf4] text-[#1a3a2a] text-[11px] font-bold rounded-lg border border-[#d1fae5] hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <BarChart2 size={11} /> Phân tích đề
              </button>
            </div>
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(e as any); } }}
                placeholder="Nhắn tin với AI để hỗ trợ bộ đề..."
                className="flex-1 bg-gray-50 border border-[rgba(26,46,28,0.18)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="p-2.5 bg-[#1a3a2a] text-white rounded-xl hover:bg-[#234b37] disabled:opacity-50 transition-colors shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
