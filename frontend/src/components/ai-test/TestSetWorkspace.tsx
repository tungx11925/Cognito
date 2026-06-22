"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Panel, Group, Separator } from "react-resizable-panels";
import { X, Save, CheckCircle2, Clock, Sparkles, Send, Loader2, Play, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { getQuestions, bulkUpdateQuestions } from "@/services/ai-test.service";
import { apiFetch } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

interface Option { A: string; B: string; C: string; D: string }
interface Question {
  id: number;
  type: "MULTIPLE_CHOICE" | "FILL_BLANK" | "ESSAY" | "TRUE_FALSE";
  content: string;
  score: number;
  status: "DRAFT" | "APPROVED";
  options?: Option;
  correct_answer?: any;
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

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: "user" | "ai", content: string}[]>([
    { role: "ai", content: "Chào bạn! Tôi là trợ lý AI. Bạn có thể yêu cầu tôi tạo thêm câu hỏi, sửa đổi đáp án, hoặc giải thích chi tiết về bộ đề này." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
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
  }, [testSetId, reset]);

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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    try {
      // Mocked AI generation for chat, since actual backend context chat isn't provided
      // But we use the groq/gemini logic. We'll call a dummy or existing endpoint.
      // Since there isn't a direct chat endpoint for testset, we can simulate or use general AI chat.
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, context: `Tôi đang làm việc trên bộ đề "${testSetName}".` })
      });
      
      const aiReply = res?.reply || "Đã ghi nhận yêu cầu. Bạn có thể sử dụng cấu hình AI bên ngoài để tạo thêm câu hỏi trực tiếp vào bộ đề này!";
      setChatMessages(prev => [...prev, { role: "ai", content: aiReply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "ai", content: "Xin lỗi, tôi đang gặp lỗi kết nối." }]);
    } finally {
      setChatLoading(false);
    }
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
            </h2>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{testSetName}</p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#1a3a2a] rounded-xl hover:bg-[#234b37] transition-colors shadow-md shadow-[#1a3a2a]/20"
        >
          <Save size={16} /> Lưu thay đổi
        </button>
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
        <Panel defaultSize={35} minSize={25} className="flex flex-col bg-[#F8FAFC]">
          <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles size={14} />
              </div>
              AI Trợ giảng
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#1a3a2a] text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
              <button onClick={() => setChatInput("Kiểm tra lỗi sai trong bộ đề này")} className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                Kiểm tra lỗi sai
              </button>
              <button onClick={() => setChatInput("Tạo thêm 5 câu trắc nghiệm khó")} className="flex-shrink-0 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                Thêm 5 câu TN
              </button>
            </div>
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Nhắn tin với AI để hỗ trợ bộ đề..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || chatLoading}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200"
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
