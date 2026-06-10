"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, Clock, FileQuestion, CheckSquare, XCircle, CheckCircle2, RefreshCcw } from 'lucide-react';

// Fisher-Yates shuffle algorithm
const shuffle = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function TestMode({ 
  cards, 
  deckId,
  onBack 
}: { 
  cards: any[]; 
  deckId: number;
  onBack: () => void;
}) {
  const [isConfiguring, setIsConfiguring] = useState(true);
  
  // Test Options State
  const [questionCount, setQuestionCount] = useState(Math.min(20, cards.length));
  const [questionTypes, setQuestionTypes] = useState({
    trueFalse: true,
    multipleChoice: true,
    written: false
  });
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);

  // Active Test State
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Tracking Active Question on scroll
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isConfiguring && !isSubmitted && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConfiguring, isSubmitted, timeRemaining]);

  // Setup Intersection Observer for active question tracking
  useEffect(() => {
    if (isConfiguring || isSubmitted || questions.length === 0) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = parseInt(entry.target.id.replace('q-', ''));
          setActiveQuestionId(id);
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 });

    questions.forEach(q => {
      const el = document.getElementById(`q-${q.id}`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [isConfiguring, isSubmitted, questions]);

  const handleStartTest = () => {
    generateTest();
    if (timeLimitEnabled) {
      setTimeRemaining(timeLimitMinutes * 60);
    } else {
      setTimeRemaining(null);
    }
    setIsConfiguring(false);
    setIsSubmitted(false);
    setAnswers({});
  };

  const generateTest = () => {
    if (cards.length === 0) return;
    
    const activeTypes = Object.entries(questionTypes)
      .filter(([_, isActive]) => isActive)
      .map(([type]) => type);
      
    if (activeTypes.length === 0) activeTypes.push('multipleChoice');

    const pool = shuffle([...cards]);
    const selectedCards = pool.slice(0, questionCount);
    
    const generated = selectedCards.map((card, index) => {
      const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
      
      let questionObj: any = {
        id: index,
        cardId: card.id,
        type,
        front: card.front,
        correctBack: card.back,
      };

      if (type === 'multipleChoice') {
        const distractorPool = cards.filter(c => c.id !== card.id);
        const wrongAnswers = shuffle([...distractorPool]).slice(0, 3).map(c => c.back);
        questionObj.options = shuffle([...wrongAnswers, card.back]);
      } else if (type === 'trueFalse') {
        const isTrue = Math.random() > 0.5;
        questionObj.isTrue = isTrue;
        if (isTrue) {
          questionObj.displayBack = card.back;
        } else {
          const distractorPool = cards.filter(c => c.id !== card.id);
          const wrongCard = shuffle([...distractorPool])[0] || card;
          questionObj.displayBack = wrongCard.back;
        }
      }

      return questionObj;
    });

    setQuestions(generated);
    if (generated.length > 0) {
      setActiveQuestionId(generated[0].id);
    }
  };

  const handleToggleType = (type: keyof typeof questionTypes) => {
    setQuestionTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleAnswerChange = (qId: number, val: any) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: val }));
    
    // Auto move to next active when answered
    const currentIndex = questions.findIndex(q => q.id === qId);
    if (currentIndex >= 0 && currentIndex < questions.length - 1) {
      const nextId = questions[currentIndex + 1].id;
      // Note: We don't force scroll here to not annoy the user, 
      // they might want to change answer. Just let them scroll manually.
    }
  };

  const handleSubmitTest = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    let correctCount = 0;
    
    questions.forEach(q => {
      const userAns = answers[q.id];
      if (q.type === 'multipleChoice' && userAns === q.correctBack) correctCount++;
      if (q.type === 'trueFalse') {
        if (userAns !== undefined && userAns !== '') {
          const userBool = userAns === 'true';
          if (userBool === q.isTrue) correctCount++;
        }
      }
      if (q.type === 'written') {
        if (userAns && userAns.trim().toLowerCase() === q.correctBack.trim().toLowerCase()) correctCount++;
      }
    });
    
    setScore(Math.round((correctCount / questions.length) * 100));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isConfiguring) {
    return (
      <div className="flex-1 bg-[#fafafa] overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* === CỘT TRÁI: MAIN CONTENT (QUESTIONS) === */}
            <div className="lg:col-span-8 space-y-8 pb-20">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => setIsConfiguring(true)} className="text-gray-500 font-bold hover:text-gray-800 bg-gray-100 px-4 py-2 rounded-xl transition-colors">
                  Thoát bài thi
                </button>
                
                <div className="flex items-center gap-4">
                  {timeRemaining !== null && (
                    <div className={`font-mono text-xl font-bold flex items-center gap-2 ${timeRemaining < 60 ? 'text-red-500' : 'text-[#4255FF]'}`}>
                      <Clock size={20} /> {formatTime(timeRemaining)}
                    </div>
                  )}
                </div>
              </div>

              {isSubmitted && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Kết quả bài thi</h2>
                  <div className="text-6xl font-black mb-4" style={{ color: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {score}%
                  </div>
                  <p className="text-gray-500 mb-6 font-medium text-lg">Bạn đã trả lời đúng <strong className="text-gray-800">{Math.round(score * questions.length / 100)} / {questions.length}</strong> câu hỏi.</p>
                  <button onClick={() => setIsConfiguring(true)} className="bg-blue-50 text-[#4255FF] hover:bg-blue-100 font-bold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto">
                    <RefreshCcw size={20} /> Thi lại
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const isCorrect = isSubmitted && (
                    (q.type === 'multipleChoice' && answers[q.id] === q.correctBack) ||
                    (q.type === 'trueFalse' && (answers[q.id] === 'true') === q.isTrue) ||
                    (q.type === 'written' && answers[q.id]?.trim().toLowerCase() === q.correctBack.trim().toLowerCase())
                  );
                  const showRed = isSubmitted && !isCorrect;

                  return (
                    <div id={`q-${q.id}`} key={q.id} className={`bg-white rounded-2xl shadow-sm border-2 p-8 transition-colors scroll-mt-28 ${showRed ? 'border-red-200 bg-red-50/30' : isSubmitted ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="font-bold text-gray-400 text-lg">Câu {idx + 1}</div>
                        {isSubmitted && (
                          <div className="flex items-center gap-1 font-bold">
                            {isCorrect ? <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={18}/> Đúng</span> : <span className="text-red-500 flex items-center gap-1"><XCircle size={18}/> Sai</span>}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-800 mb-8">{q.front}</div>

                      {q.type === 'multipleChoice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {q.options.map((opt: string, i: number) => {
                            const isSelected = answers[q.id] === opt;
                            let optionClass = "border-gray-200 hover:border-[#10b981] bg-white text-gray-700";
                            
                            if (isSubmitted) {
                              if (opt === q.correctBack) optionClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-[0_0_0_2px_#10b981] z-10 relative";
                              else if (isSelected) optionClass = "border-red-500 bg-red-50 text-red-800 font-bold";
                              else optionClass = "border-gray-100 opacity-40";
                            } else if (isSelected) {
                              optionClass = "border-[#10b981] bg-green-50 text-green-800 font-bold shadow-inner";
                            }

                            return (
                              <button 
                                key={i}
                                disabled={isSubmitted}
                                onClick={() => handleAnswerChange(q.id, opt)}
                                className={`p-5 rounded-xl border-2 text-left transition-all ${optionClass}`}
                              >
                                <div className="flex items-center gap-3 text-lg">
                                  {isSubmitted && opt === q.correctBack && <CheckCircle2 size={20} className="text-green-600 shrink-0" />}
                                  {isSubmitted && !isCorrect && isSelected && <XCircle size={20} className="text-red-600 shrink-0" />}
                                  <span>{opt}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'trueFalse' && (
                        <div className="space-y-6">
                          <div className="p-6 bg-gray-50 border border-gray-100 rounded-xl text-center text-xl font-medium italic text-gray-700">
                            "{q.displayBack}"
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {['true', 'false'].map((opt) => {
                              const isSelected = answers[q.id] === opt;
                              const label = opt === 'true' ? 'Đúng' : 'Sai';
                              let optionClass = "border-gray-200 hover:border-[#10b981] bg-white text-gray-600";
                              
                              if (isSubmitted) {
                                const isActuallyTrue = q.isTrue.toString() === opt;
                                if (isActuallyTrue) optionClass = "border-green-500 bg-green-50 text-green-800 font-bold shadow-[0_0_0_2px_#10b981] z-10 relative";
                                else if (isSelected) optionClass = "border-red-500 bg-red-50 text-red-800 font-bold";
                                else optionClass = "border-gray-100 opacity-40";
                              } else if (isSelected) {
                                optionClass = "border-[#10b981] bg-green-50 text-green-800 font-bold shadow-inner";
                              }

                              return (
                                <button
                                  key={opt}
                                  disabled={isSubmitted}
                                  onClick={() => handleAnswerChange(q.id, opt)}
                                  className={`p-5 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 text-lg ${optionClass}`}
                                >
                                  {isSubmitted && q.isTrue.toString() === opt && <CheckCircle2 size={20} className="text-green-600" />}
                                  {isSubmitted && !isCorrect && isSelected && <XCircle size={20} className="text-red-600" />}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {q.type === 'written' && (
                        <div>
                          <input 
                            type="text" 
                            disabled={isSubmitted}
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Nhập đáp án của bạn..."
                            className={`w-full p-5 rounded-xl border-2 outline-none text-xl transition-colors font-medium ${
                              isSubmitted 
                                ? isCorrect ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900'
                                : 'border-gray-200 focus:border-[#10b981] text-gray-800'
                            }`}
                          />
                          {showRed && (
                            <div className="mt-4 p-5 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                              <CheckCircle2 size={24} className="text-green-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-green-700 font-bold block mb-1">Đáp án đúng:</span>
                                <span className="text-green-900 font-medium text-xl">{q.correctBack}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Đã xóa nút Nộp bài thi ở đây theo yêu cầu */}
            </div>

            {/* === CỘT PHẢI: STICKY SIDEBAR (NAVIGATION) === */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-24 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col max-h-[calc(100vh-8rem)]">
                <h3 className="font-bold text-gray-800 mb-6 text-xl">Danh sách câu hỏi</h3>
                
                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 mb-8">
                  <div className="grid grid-cols-4 xl:grid-cols-5 gap-3">
                    {questions.map((q, idx) => {
                      const hasAnswered = answers[q.id] !== undefined && answers[q.id].trim?.() !== '';
                      const isActive = activeQuestionId === q.id && !isSubmitted;
                      
                      let btnClass = "border-gray-200 text-gray-500 hover:border-gray-300 bg-white";
                      
                      if (isSubmitted) {
                        const isCorrect = (
                          (q.type === 'multipleChoice' && answers[q.id] === q.correctBack) ||
                          (q.type === 'trueFalse' && (answers[q.id] === 'true') === q.isTrue) ||
                          (q.type === 'written' && answers[q.id]?.trim().toLowerCase() === q.correctBack.trim().toLowerCase())
                        );
                        if (isCorrect) {
                          btnClass = "border-green-500 bg-green-50 text-green-700 font-bold shadow-sm";
                        } else {
                          btnClass = "border-red-500 bg-red-50 text-red-700 font-bold shadow-sm";
                        }
                      } else if (hasAnswered) {
                        // Vẫn giữ highlight màu đậm nếu đang active dù đã trả lời
                        btnClass = isActive 
                          ? "border-[#10b981] bg-green-100 text-green-800 font-bold shadow-[0_0_0_2px_#10b981]"
                          : "border-[#10b981] bg-green-50 text-[#10b981] font-bold shadow-sm";
                      } else if (isActive) {
                        btnClass = "border-[#10b981] bg-white text-[#10b981] font-bold shadow-[0_0_0_2px_#10b981]";
                      }

                      return (
                        <button 
                          key={q.id}
                          onClick={() => {
                            setActiveQuestionId(q.id);
                            document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className={`h-12 w-12 mx-auto rounded-xl border-2 flex items-center justify-center transition-all text-lg focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#10b981] ${btnClass}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!isSubmitted ? (
                  <button 
                    onClick={handleSubmitTest} 
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-4 rounded-xl font-bold transition-colors text-lg flex items-center justify-center gap-2 shrink-0 shadow-lg"
                  >
                    <CheckSquare size={22} />
                    Nộp bài thi
                  </button>
                ) : (
                  <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-600 font-medium text-base">Điểm số tổng quát</span>
                      <span className="font-bold text-gray-800 text-xl">{score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-[#10b981] h-3 rounded-full transition-all duration-1000" style={{ width: `${score}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6 w-full animate-in slide-in-from-right duration-300 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden my-auto">
        <div className="bg-[#10b981] p-6 text-white flex items-center gap-3">
          <Settings size={28} />
          <div>
            <h2 className="text-2xl font-bold">Thiết lập Bài kiểm tra</h2>
            <p className="text-green-100 text-sm opacity-90 mt-1">Cá nhân hóa bài thi để đạt hiệu quả cao nhất</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-800 text-lg">
              <FileQuestion size={20} className="text-[#10b981]" />
              Số lượng câu hỏi
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                min={1} 
                max={cards.length}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(cards.length, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-24 p-3 rounded-xl border-2 border-gray-200 focus:border-[#10b981] outline-none text-lg font-bold text-center"
              />
              <span className="text-gray-500 font-medium">/ tối đa {cards.length} thẻ</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-800 text-lg">
              <CheckSquare size={20} className="text-[#10b981]" />
              Loại câu hỏi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'trueFalse', label: 'Đúng / Sai' },
                { id: 'multipleChoice', label: 'Trắc nghiệm (4 đáp án)' },
                { id: 'written', label: 'Tự luận (Viết)' }
              ].map(type => (
                <label key={type.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${questionTypes[type.id as keyof typeof questionTypes] ? 'border-[#10b981] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input 
                    type="checkbox" 
                    checked={questionTypes[type.id as keyof typeof questionTypes]}
                    onChange={() => handleToggleType(type.id as keyof typeof questionTypes)}
                    className="w-5 h-5 text-[#10b981] rounded focus:ring-[#10b981]"
                  />
                  <span className={`font-semibold ${questionTypes[type.id as keyof typeof questionTypes] ? 'text-green-800' : 'text-gray-700'}`}>
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 font-bold text-gray-800 text-lg">
              <Clock size={20} className="text-[#10b981]" />
              Giới hạn thời gian
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={timeLimitEnabled}
                  onChange={(e) => setTimeLimitEnabled(e.target.checked)}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#10b981]"></div>
                <span className="ml-3 font-semibold text-gray-700">{timeLimitEnabled ? 'Bật' : 'Tắt'}</span>
              </label>
              
              <AnimatePresence>
                {timeLimitEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <input 
                      type="number" 
                      min={1} 
                      max={180}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 1)}
                      className="w-20 p-2 rounded-xl border-2 border-gray-200 focus:border-[#10b981] outline-none font-bold text-center"
                    />
                    <span className="text-gray-500 font-medium whitespace-nowrap">phút</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onBack}
            className="flex-1 py-4 font-bold text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleStartTest}
            disabled={!Object.values(questionTypes).some(Boolean)}
            className="flex-1 py-4 font-bold text-white bg-[#10b981] rounded-xl hover:bg-[#059669] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={20} fill="currentColor" />
            Bắt đầu bài thi
          </button>
        </div>
      </div>
    </div>
  );
}
