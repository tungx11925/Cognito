import { apiFetch } from './api';

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const authJson = () => ({ ...getAuthHeaders(), ...JSON_HEADERS });

export interface QuizQuestion {
  index: number;
  id: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'ESSAY';
  content: string;
  score: number;
  options?: Record<string, string>;
  difficulty: string;
}

export interface QuizAttempt {
  id: number;
  testSetId: number;
  testSetName?: string;
  score: number;
  totalScore: number;
  percentage?: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds?: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'ABANDONED';
  startedAt: string;
  completedAt?: string;
}

export interface StartQuizResponse {
  attempt: QuizAttempt;
  testSet: {
    id: number;
    name: string;
  };
  isRetryMistakes: boolean;
  questions: QuizQuestion[];
  error?: string;
}

export interface SubmitAnswerItem {
  questionId: number;
  answer: any;
}

export interface QuizResultAnswer {
  id: number;
  question_id: number;
  user_answer: any;
  is_correct: boolean;
  score_awarded: number;
  explanation: string | null;
  questionContent?: string;
  question_content?: string;
  options?: Record<string, string>;
  question_options?: Record<string, string>;
  correctAnswer?: any;
  question_correct_answer?: any;
  type?: string;
  question_type?: string;
  maxScore?: number;
  question_max_score?: number;
}

export interface SubmitQuizResponse {
  attempt: QuizAttempt;
  answers: QuizResultAnswer[];
  error?: string;
}

export interface MistakeItem {
  id: number;
  question_id: number;
  user_answer: any;
  is_correct: boolean;
  score_awarded: number;
  explanation: string | null;
  question_content: string;
  question_options: Record<string, string> | null;
  question_correct_answer: any;
  question_explanation: string | null;
  question_type: string;
  question_max_score: number;
}

export interface GetMistakesResponse {
  attemptId: number;
  testSetId: number;
  testSetName: string;
  totalMistakes: number;
  mistakes: MistakeItem[];
  error?: string;
}

export interface QuizHistoryResponse {
  attempts: QuizAttempt[];
  total: number;
  error?: string;
}

/**
 * Bắt đầu làm bài thi (hỗ trợ cả thi toàn bộ hoặc làm lại câu sai)
 */
export const startQuiz = (
  testSetId: number,
  options?: { isRetryMistakes?: boolean; previousAttemptId?: number }
): Promise<StartQuizResponse> =>
  apiFetch('/quizzes/start', {
    method: 'POST',
    headers: authJson(),
    body: JSON.stringify({
      testSetId,
      isRetryMistakes: options?.isRetryMistakes,
      previousAttemptId: options?.previousAttemptId,
    }),
  });

/**
 * Nộp bài thi và nhận kết quả chấm điểm server-side
 */
export const submitQuiz = (
  attemptId: number,
  data: { answers: SubmitAnswerItem[]; durationSeconds: number }
): Promise<SubmitQuizResponse> =>
  apiFetch(`/quizzes/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: authJson(),
    body: JSON.stringify(data),
  });

/**
 * Xem chi tiết kết quả một lượt làm bài
 */
export const getAttemptResult = (attemptId: number): Promise<SubmitQuizResponse> =>
  apiFetch(`/quizzes/attempts/${attemptId}`, {
    headers: getAuthHeaders(),
  });

/**
 * Lấy danh sách câu sai của lượt thi (Review Mistakes)
 */
export const getAttemptMistakes = (attemptId: number): Promise<GetMistakesResponse> =>
  apiFetch(`/quizzes/attempts/${attemptId}/mistakes`, {
    headers: getAuthHeaders(),
  });

/**
 * Lịch sử làm bài thi
 */
export const getQuizHistory = (
  params?: { limit?: number; offset?: number }
): Promise<QuizHistoryResponse> => {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  return apiFetch(`/quizzes/history?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
};
