"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, ChevronDown, ChevronUp, CheckCircle2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { getQuestions, bulkUpdateQuestions } from "@/services/ai-test.service";

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

export default function EditTestModal({ testSetId, testSetName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("MULTIPLE_CHOICE");
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { questions: [] },
  });
  const { fields } = useFieldArray({ control, name: "questions" });

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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa bộ đề</h2>
            <p className="text-xs text-gray-500 mt-0.5">{testSetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          {TABS.map((tab) => {
            const count = fields.filter((f) => f.type === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors mr-1 ${
                  activeTab === tab
                    ? "border-[#1a3a2a] text-[#1a3a2a]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {TYPE_LABEL[tab]}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab ? "bg-[#1a3a2a] text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-[#1a3a2a]/20 border-t-[#1a3a2a] rounded-full animate-spin" />
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Không có câu hỏi loại {TYPE_LABEL[activeTab]}</p>
            </div>
          ) : (
            filteredFields.map(({ globalIdx }, i) => {
              const isExpanded = expandedIdx === globalIdx;
              return (
                <div
                  key={globalIdx}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Question Header Row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}
                  >
                    <span className="text-xs font-bold text-gray-400 w-6 text-center">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                      {fields[globalIdx].content || "(Chưa có nội dung)"}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {fields[globalIdx].score} điểm
                      </span>
                      {fields[globalIdx].status === "APPROVED" ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={10} /> Đã duyệt
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock size={10} /> Bản nháp
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>

                  {/* Expanded Edit Area */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                          {/* Content textarea */}
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                              Nội dung câu hỏi
                            </label>
                            <textarea
                              {...register(`questions.${globalIdx}.content`)}
                              rows={3}
                              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:border-[#1a3a2a] transition-colors"
                            />
                          </div>

                          {/* Options — only for MC & T/F */}
                          {(fields[globalIdx].type === "MULTIPLE_CHOICE" ||
                            fields[globalIdx].type === "TRUE_FALSE") && (
                            <div className="grid grid-cols-2 gap-2">
                              {(["A", "B", "C", "D"] as const).map((opt) => (
                                <div key={opt}>
                                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                                    Đáp án {opt}
                                  </label>
                                  <input
                                    {...register(
                                      `questions.${globalIdx}.options.${opt}` as any
                                    )}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a2a] transition-colors"
                                    placeholder={`Nội dung đáp án ${opt}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Correct Answer + Score + Status row */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                Đáp án đúng
                              </label>
                              <input
                                {...register(`questions.${globalIdx}.correct_answer` as any)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a2a] transition-colors"
                                placeholder="A / B / C / D hoặc nội dung"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                Điểm
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                {...register(`questions.${globalIdx}.score`, { valueAsNumber: true })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a2a] transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                Trạng thái
                              </label>
                              <select
                                {...register(`questions.${globalIdx}.status`)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1a3a2a] transition-colors bg-white"
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <p className="text-xs text-gray-500">
            {filteredFields.length} câu {TYPE_LABEL[activeTab]}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#1a3a2a] rounded-xl hover:bg-[#234b37] transition-colors shadow-md shadow-[#1a3a2a]/20"
            >
              <Save size={14} /> Lưu thay đổi
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
