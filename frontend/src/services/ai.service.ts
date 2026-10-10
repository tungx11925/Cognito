import { apiFetch } from './api';

export interface AIChatResponse {
  reply?: string;
  context_mode?: 'GENERAL' | 'DOCUMENT_CONTEXT';
  error?: string;
  code?: string;
  message?: string;
  details?: any;
}

/**
 * Trò chuyện với Trợ lý AI (Hỗ trợ theo tài liệu RAG hoặc kiến thức tổng quát)
 */
export const chatWithAI = async (
  document_id?: number | null, 
  message: string = '', 
  history?: any[], 
  images?: string[] | string,
  context_mode?: 'GENERAL' | 'DOCUMENT_CONTEXT'
): Promise<AIChatResponse> => {
  const imagesPayload = Array.isArray(images) ? images : (images ? [images] : []);
  return apiFetch('/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      document_id: document_id || undefined, 
      message, 
      history, 
      images: imagesPayload,
      image: imagesPayload[0] || undefined,
      context_mode: context_mode || (document_id ? 'DOCUMENT_CONTEXT' : 'GENERAL'),
    })
  });
};

/**
 * Sinh câu hỏi trắc nghiệm tự động từ tài liệu
 */
export const generateQuiz = (document_id: number) => apiFetch('/ai/generate-quiz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ document_id })
});

/**
 * Sinh sơ đồ tư duy bằng AI
 */
export const generateMindmap = (document_id: number, force_regenerate?: boolean) => apiFetch('/ai/generate-mindmap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ document_id, force_regenerate })
});

/**
 * Lấy sơ đồ tư duy đã cache từ tài liệu
 */
export const getCachedMindmap = (document_id: number) => apiFetch(`/ai/mindmap/${document_id}`, {
  method: 'GET',
});

/**
 * Sinh Flashcard tự động từ file tài liệu (.docx, .pdf, .txt, .xlsx, .csv)
 * Dùng chung HTTP client, gửi FormData không set cứng header Content-Type
 */
export const generateFlashcardsFromFile = async (file: File) => {
  const formData = new FormData();
  formData.append('document', file);
  return apiFetch('/flashcards/generate-from-file', {
    method: 'POST',
    body: formData,
  });
};

/**
 * Sinh câu hỏi cho tính năng AI Test
 */
export const generateAITestQuestions = async (document_id: number, count: number = 10) => {
  return apiFetch('/question-generation/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_id, count })
  });
};
