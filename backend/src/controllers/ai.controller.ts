import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { aiService } from '../services/ai.service';
import { aiProviderService } from '../services/ai-provider.service';
import { db } from '../db';
import { generateMindmapWithAI } from '../utils/ai-engine.service';
import { parserService } from '../services/parser.service';

export const chatWithDocument = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { document_id, message, history, image, images } = req.body;
    const userId = req.user!.id;
    
    // Check old style requests from previous version
    if (req.body.documentContext) {
       return res.status(400).json({ error: 'Endpoint deprecated for direct context. Use document_id instead.' });
    }

    let document = null;
    if (document_id) {
      const docResult = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [document_id, userId]);
      document = docResult.rows[0];
    }

    const reply = await aiService.chatWithDocument(document, message || '', history, images || image);
    res.status(200).json({ reply });
  } catch (error) {
    next(error);
  }
};

export const generateQuiz = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { document_id } = req.body;
    const userId = req.user!.id;
    
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [document_id, userId]);
    const document = docResult.rows[0];
    
    const quizzes = await aiService.generateQuizForDocument(document);
    res.status(200).json({ quizzes });
  } catch (error) {
    next(error);
  }
};

export const generateFlashcardsFromFile = async (req: Request, res: Response, next: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file' });

    const { mimetype, buffer } = req.file;
    const extractedText = await parserService.parseFromBuffer(buffer, mimetype);

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Không tìm thấy chữ trong tài liệu này.' });
    }

    const truncatedText = extractedText.substring(0, 20000);
    const systemPrompt = `Bạn là một chuyên gia học thuật. Hãy đọc đoạn văn bản sau đây và trích xuất ra các khái niệm quan trọng nhất để tạo thành bộ thẻ Flashcard ghi nhớ. 
Yêu cầu đầu ra BẮT BUỘC phải là một mảng JSON có cấu trúc chính xác như sau, không được chứa thêm bất kỳ đoạn text giải thích nào khác bên ngoài JSON, KHÔNG BỌC TRONG \`\`\`json:
[
  { "front": "Thuật ngữ hoặc câu hỏi ngắn bằng ngôn ngữ gốc của tài liệu", "back": "Định nghĩa hoặc câu trả lời chi tiết bằng Tiếng Việt hoặc cùng ngôn ngữ" }
]`;

    // Đi qua AIProviderAdapter (Groq → Gemini, có timeout + log ai_request_logs)
    const aiResult = await aiProviderService.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `NỘI DUNG TÀI LIỆU:\n${truncatedText}` },
      ],
      temperature: 0.2,
      maxTokens: 4096,
      jsonMode: true,
      taskType: 'flashcard',
    });
    const responseText = aiResult.text;
    const cleanedJsonStr = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    let cards = [];
    try {
      cards = JSON.parse(cleanedJsonStr);
    } catch (parseError) {
      console.error("Lỗi Parse JSON từ AI:", responseText);
      return res.status(500).json({ error: 'AI trả về định dạng dữ liệu không hợp lệ. Vui lòng thử lại.' });
    }

    res.status(200).json({ cards });

  } catch (error: any) {
    console.error("Lỗi AI Flashcard Generator:", error);
    res.status(500).json({ error: error.message || 'Lỗi server nội bộ' });
  }
};

export const getMindmap = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { docId } = req.params;
    const userId = req.user!.id;
    const mindmap = await aiService.getMindmapCache(parseInt(docId), userId);

    if (!mindmap) {
      return res.status(404).json({ success: false, message: 'Chưa có sơ đồ tư duy nào được lưu.' });
    }

    res.status(200).json({ success: true, mindmap });
  } catch (error) {
    next(error);
  }
};

export const generateMindmap = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { document_id, title, content, force_regenerate } = req.body;
    const userId = req.user!.id;
    
    // 1. Check Cache
    if (document_id && !force_regenerate) {
      const cached = await aiService.getMindmapCache(document_id, userId);
      if (cached) {
        return res.status(200).json({
          success: true,
          cached: true,
          title: title || 'Sơ Đồ Tư Duy',
          mermaidCode: cached.mermaid_code,
        });
      }
    }

    // 2. Extract Document Text
    const { docTitle, docContent } = await aiService.getDocumentContentForMindmap(document_id, title, content);

    if (!docContent.trim()) {
      return res.status(400).json({ error: 'Nội dung tài liệu trống, không thể tạo mindmap.' });
    }

    // 3. AI Generate
    const mermaidCode = await generateMindmapWithAI(docTitle, docContent);

    // 4. Save Cache
    if (document_id) {
       await aiService.saveMindmapCache(document_id, userId, mermaidCode);
    }

    res.status(200).json({ success: true, cached: false, title: docTitle, mermaidCode });
  } catch (error) {
    next(error);
  }
};

export { listAIModels, listAITemplates } from './question-generation.controller';
