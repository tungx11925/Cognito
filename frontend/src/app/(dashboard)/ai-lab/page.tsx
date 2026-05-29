"use client";

import React from 'react';
import { useStudy } from '../../../context/StudyContext';
import Link from 'next/link';

export default function AiLabPage() {
  const {
    activeDoc,
    aiWorkspaceTab,
    setAiWorkspaceTab,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    handleSendChatMessage,
    timerMinutes,
    setTimerMinutes,
    timerSeconds,
    setTimerSeconds,
    timerActive,
    setTimerActive,
    timerMaxMinutes,
    setTimerMaxMinutes,
    setElapsedStudyTime,
    notesText,
    setNotesText,
    notesTitle,
    setNotesTitle,
    notesSaving,
    notesSavedTime,
    handleSaveNotes,
    quizzes,
    quizLoading,
    selectedAnswers,
    quizSubmitted,
    setQuizSubmitted,
    handleGenerateQuiz,
    handleSelectQuizAnswer,
    getQuizScore
  } = useStudy();

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-center p-6 bg-white border border-[#0D2B24]/10 rounded-3xl shadow-sm space-y-5">
        <div className="w-16 h-16 bg-[#FAF8F5] border border-[#0D2B24]/5 rounded-full flex items-center justify-center text-[#0D2B24]/50 shadow-inner">
          <svg className="w-7 h-7 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-sm font-black text-[#0D2B24]">Chưa chọn tài liệu học tập</h3>
          <p className="text-[11px] text-[#0D2B24]/60 leading-relaxed font-semibold">
            Vui lòng chọn một tài liệu ở thư viện trước để trợ lý AI có ngữ cảnh hỗ trợ bạn trả lời câu hỏi, ghi chú và sinh quiz.
          </p>
        </div>
        <Link 
          href="/library"
          className="bg-[#0D2B24] text-white font-black text-xs px-6 py-3 rounded-xl hover:bg-[#0D2B24]/90 transition shadow-sm"
        >
          Chọn tài liệu ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)] min-h-[500px]">
      
      {/* LEFT COLUMN: ACTIVE DOCUMENT DETAIL (Lh 5 cols) */}
      <div className="lg:col-span-5 bg-white border border-[#0D2B24]/10 rounded-3xl p-6 flex flex-col overflow-hidden shadow-sm">
        <div className="border-b border-[#0D2B24]/10 pb-4 mb-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[9px] font-black px-2 py-0.5 bg-[#0D2B24]/5 border border-[#0D2B24]/10 rounded-full text-[#0D2B24]/80">
              {activeDoc.category}
            </span>
            <h2 className="text-sm font-bold text-[#0D2B24] mt-1.5 truncate">{activeDoc.title}</h2>
          </div>
          <Link 
            href="/library" 
            className="text-[10px] font-extrabold text-[#0D2B24]/50 hover:text-[#0D2B24]"
          >
            Đổi tài liệu
          </Link>
        </div>

        {/* Scrollable doc content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs leading-relaxed text-[#0D2B24]/80 font-normal">
          <div>
            <h4 className="text-[10px] font-black uppercase text-[#0D2B24]/40 tracking-wider mb-1">Mô tả</h4>
            <p>{activeDoc.description || 'Không có mô tả.'}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase text-[#0D2B24]/40 tracking-wider mb-1">Nội dung chính</h4>
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0D2B24]/5 whitespace-pre-wrap font-sans text-[#0D2B24]">
              {activeDoc.description ? activeDoc.title + "\n\n" + activeDoc.description : 'Đang mở tài liệu...'}
            </div>
          </div>
          {activeDoc.solution_text && (
            <div>
              <h4 className="text-[10px] font-black uppercase text-[#0D2B24]/40 tracking-wider mb-1">Lời giải chi tiết đính kèm</h4>
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#0D2B24]/5 font-mono text-[11px] text-[#0D2B24]/80 whitespace-pre-wrap leading-normal">
                {activeDoc.solution_text}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: WORKSPACE INTERACTIVE INTERFACES (Rh 7 cols) */}
      <div className="lg:col-span-7 bg-white border border-[#0D2B24]/10 rounded-3xl p-6 flex flex-col overflow-hidden shadow-sm">
        
        {/* Workspace Subtabs */}
        <div className="flex items-center justify-between border-b border-[#0D2B24]/10 pb-3 mb-4 shrink-0">
          <div className="flex gap-4">
            {[
              { id: 'chat', label: 'AI Chat' },
              { id: 'timer', label: 'Pomodoro' },
              { id: 'notes', label: 'Notes' },
              { id: 'quiz', label: 'AI Quiz' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAiWorkspaceTab(tab.id as any)}
                className={`text-xs font-bold pb-1 transition-all ${
                  aiWorkspaceTab === tab.id 
                    ? 'text-[#0D2B24] border-b-2 border-[#0D2B24]' 
                    : 'text-[#0D2B24]/40 hover:text-[#0D2B24]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full uppercase tracking-wider animate-pulse">
            Active Study
          </span>
        </div>

        {/* WORKSPACE TAB VIEWS */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* TAB 1: AI CHAT */}
          {aiWorkspaceTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0D2B24] text-white font-semibold rounded-br-none'
                        : 'bg-[#FAF8F5] border border-[#0D2B24]/10 text-[#0D2B24] rounded-bl-none shadow-sm'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-2xl p-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#0D2B24] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#0D2B24] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#0D2B24] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input panel */}
              <div className="pt-3 border-t border-[#0D2B24]/10 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  placeholder="Hỏi trợ lý AI về nội dung tài liệu..." 
                  className="flex-1 bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-xl px-4 py-2.5 text-xs text-[#0D2B24] outline-none focus:border-[#0D2B24] transition-all placeholder:text-[#0D2B24]/30"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                />
                <button 
                  onClick={handleSendChatMessage}
                  className="bg-[#0D2B24] hover:bg-[#0D2B24]/90 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
                >
                  Gửi
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: STUDY TIMER */}
          {aiWorkspaceTab === 'timer' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              {/* Huge Timer Screen */}
              <div className="relative w-44 h-44 rounded-full border-4 border-[#0D2B24]/10 flex flex-col items-center justify-center shadow-inner">
                <span className="text-3xl font-black text-[#0D2B24] font-mono leading-none">
                  {timerMinutes < 10 ? '0' + timerMinutes : timerMinutes}:
                  {timerSeconds < 10 ? '0' + timerSeconds : timerSeconds}
                </span>
                <span className="text-[9px] font-black text-[#0D2B24]/40 uppercase tracking-widest mt-1">Focus Time</span>
              </div>

              {/* Session duration selectors */}
              <div className="space-y-2 w-full max-w-xs text-center">
                <p className="text-[10px] font-bold text-[#0D2B24]/50 uppercase tracking-wider">Thời gian làm việc</p>
                <div className="flex gap-2">
                  {[15, 25, 45, 60].map(m => (
                    <button 
                      key={m}
                      onClick={() => {
                        setTimerActive(false);
                        setTimerMinutes(m);
                        setTimerSeconds(0);
                        setTimerMaxMinutes(m);
                      }}
                      className={`flex-1 py-1.5 rounded-lg border text-[11px] font-extrabold transition ${
                        timerMaxMinutes === m 
                          ? 'bg-[#0D2B24] text-white border-[#0D2B24]' 
                          : 'bg-[#FAF8F5] text-[#0D2B24]/60 border-[#0D2B24]/10 hover:text-[#0D2B24]'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Start/Stop triggers */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setTimerActive(!timerActive)}
                  className={`px-8 py-3 rounded-xl text-xs font-black transition-all shadow-sm ${
                    timerActive 
                      ? 'bg-amber-600 text-white hover:bg-amber-700' 
                      : 'bg-[#0D2B24] text-white hover:bg-[#0D2B24]/90'
                  }`}
                >
                  {timerActive ? 'Pause Session' : 'Start Focus Clock'}
                </button>
                <button 
                  onClick={() => {
                    setTimerActive(false);
                    setTimerMinutes(timerMaxMinutes);
                    setTimerSeconds(0);
                    setElapsedStudyTime(0);
                  }}
                  className="px-5 py-3 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 border border-[#0D2B24]/10 text-[#0D2B24]/85 font-extrabold text-xs rounded-xl transition shadow-sm"
                >
                  Reset
                </button>
              </div>

              {timerActive && (
                <p className="text-[10px] text-[#0D2B24]/60 italic animate-pulse">Bạn đang tập trung học tập. Giữ vững phong độ nhé! 🚀</p>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE NOTES */}
          {aiWorkspaceTab === 'notes' && (
            <div className="flex-1 flex flex-col space-y-3.5 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <input 
                  type="text" 
                  value={notesTitle}
                  onChange={e => setNotesTitle(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-[#0D2B24]/20 focus:border-[#0D2B24] font-bold text-xs text-[#0D2B24] outline-none transition py-0.5 w-2/3"
                  placeholder="Nhập tiêu đề ghi chú..."
                />
                
                <div className="flex items-center gap-2">
                  {notesSavedTime && (
                    <span className="text-[9px] text-[#0D2B24]/40 font-semibold">Saved: {notesSavedTime}</span>
                  )}
                  <button 
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="bg-[#0D2B24] hover:bg-[#0D2B24]/90 disabled:bg-[#0D2B24]/10 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    {notesSaving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

              <textarea 
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                placeholder="Ghi chú nhanh kiến thức quan trọng của bạn ở đây... (Gõ nội dung Markdown)"
                className="flex-1 bg-[#FAF8F5] border border-[#0D2B24]/10 rounded-2xl p-4 text-[#0D2B24] text-xs font-mono leading-relaxed outline-none focus:border-[#0D2B24] transition-all resize-none shadow-inner"
              />
            </div>
          )}

          {/* TAB 4: AI GENERATED QUIZ */}
          {aiWorkspaceTab === 'quiz' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {quizLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#0D2B24] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-[#0D2B24]/60 font-semibold animate-pulse">AI is scanning the document to compose quiz questions...</p>
                </div>
              ) : quizzes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-12 h-12 bg-[#FAF8F5] border border-[#0D2B24]/5 rounded-2xl flex items-center justify-center text-[#0D2B24]/40">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[#0D2B24] font-bold text-xs">Biên soạn bài ôn luyện với AI</h4>
                    <p className="text-[#0D2B24]/60 text-[11px] max-w-[260px] leading-relaxed">Nhấp vào nút dưới để trợ lý AI quét tài liệu này và sinh nhanh đề trắc nghiệm ôn tập.</p>
                  </div>
                  <button 
                    onClick={handleGenerateQuiz}
                    className="bg-[#0D2B24] text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-[#0D2B24]/90 transition shadow-sm"
                  >
                    Bắt đầu sinh Quiz
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
                    {quizzes.map((q, idx) => (
                      <div key={q.id} className="bg-[#FAF8F5]/40 border border-[#0D2B24]/10 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                        <p className="text-xs font-extrabold text-[#0D2B24] leading-snug">Câu {idx + 1}: {q.question}</p>
                        
                        {/* Options */}
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[q.id] === oIdx;
                            const isCorrect = q.correctAnswer === oIdx;
                            
                            let btnClass = "bg-white hover:bg-[#FAF8F5] text-[#0D2B24]/85 border-[#0D2B24]/10 shadow-sm";
                            if (isSelected) {
                              btnClass = "bg-[#0D2B24]/10 text-[#0D2B24] border-[#0D2B24]/20 font-bold";
                            }
                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnClass = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                              } else if (isSelected) {
                                btnClass = "bg-rose-50 text-rose-800 border-rose-300";
                              } else {
                                btnClass = "bg-white text-[#0D2B24]/30 border-[#0D2B24]/5 opacity-60 shadow-none";
                              }
                            }

                            return (
                              <button 
                                key={oIdx}
                                disabled={quizSubmitted}
                                onClick={() => handleSelectQuizAnswer(q.id, oIdx)}
                                className={`w-full text-left p-3 text-[11px] rounded-xl border transition-all flex items-start gap-2.5 ${btnClass}`}
                              >
                                <span className="w-4 h-4 rounded-full border border-[#0D2B24]/10 flex items-center justify-center text-[9px] shrink-0 font-bold mt-0.5 bg-[#FAF8F5] text-[#0D2B24]/80">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="bg-white p-3 rounded-xl border border-[#0D2B24]/10 text-[10px] text-[#0D2B24]/60 leading-relaxed font-normal shadow-inner">
                            <span className="font-extrabold text-[#0D2B24] uppercase tracking-wider block mb-1">Giải thích từ AI:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Submission and results footer */}
                  <div className="pt-3 border-t border-[#0D2B24]/10 flex items-center justify-between shrink-0">
                    {quizSubmitted ? (
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-black text-[#0D2B24]">Score: {getQuizScore()}/{quizzes.length} correct</p>
                        <button 
                          onClick={handleGenerateQuiz}
                          className="text-xs text-[#0D2B24] hover:underline font-bold"
                        >
                          Làm đề khác
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(selectedAnswers).length < quizzes.length}
                        className="w-full bg-[#0D2B24] hover:bg-[#0D2B24]/90 disabled:bg-[#0D2B24]/10 disabled:text-[#0D2B24]/30 text-white text-xs font-black py-2.5 rounded-xl transition shadow-sm"
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
  );
}
