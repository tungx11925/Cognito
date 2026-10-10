import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { flashcardService } from '../services/flashcard.service';
import { aiProviderService } from '../services/ai-provider.service';

export const getDecks = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const decks = await flashcardService.getDecks(userId);
    res.status(200).json(decks);
  } catch (error) {
    next(error);
  }
};

export const getDeckById = async (req: Request, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.id, 10);
    const deck = await flashcardService.getDeckById(deckId);
    const userId = (req as AuthRequest).user?.id;
    if (deck.user_id !== userId && !deck.is_public && deck.visibility !== 'public') {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bộ thẻ này' });
    }
    res.status(200).json(deck);
  } catch (error) {
    next(error);
  }
};

export const getDeckCards = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const cards = await flashcardService.getDeckCards(deckId, userId);
    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
};

export const getDueCards = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const cards = await flashcardService.getDueCards(deckId, userId);
    res.status(200).json(cards);
  } catch (error) {
    next(error);
  }
};

export const createDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const { name, description, is_public, visibility, category, cards } = req.body;
    const deck = await flashcardService.createDeck(userId, name, description, is_public, visibility, category, cards);
    res.status(201).json(deck);
  } catch (error) {
    next(error);
  }
};

export const updateDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { name, description, is_public, visibility, category, cards } = req.body;

    const deck = await flashcardService.updateDeck(deckId, userId, name, description, is_public, visibility, category, cards);
    res.status(200).json(deck);
  } catch (error) {
    next(error);
  }
};

export const getStudySettings = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const deckId = parseInt(req.params.deckId, 10);
    const settings = await flashcardService.getStudySettings(userId, deckId);
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

export const saveStudySettings = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const deckId = parseInt(req.params.deckId, 10);
    const settings = await flashcardService.saveStudySettings(userId, deckId, req.body);
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};


export const deleteDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    // Requires authenticate to be safe
    const deckId = parseInt(req.params.id, 10);
    const userId = req.user!.id;

    // Verify ownership
    const existing = await flashcardService.getDeckById(deckId);
    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bộ thẻ này' });
    }

    await flashcardService.deleteDeck(deckId);
    res.status(200).json({ message: 'Đã xóa bộ bài thành công' });
  } catch (error) {
    next(error);
  }
};

import cloudinary from '../config/cloudinary';
import fs from 'fs';
import path from 'path';

export const uploadFlashcardImage = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP)' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP' });
    }

    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Dung lượng ảnh không được vượt quá 2MB' });
    }

    // Try Cloudinary if configured
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const streamUpload = (buffer: Buffer): Promise<any> => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: 'cognito/flashcards',
                resource_type: 'image',
              },
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
            stream.end(buffer);
          });
        };

        const result = await streamUpload(file.buffer);
        if (result && result.secure_url) {
          return res.status(200).json({ url: result.secure_url });
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to local storage:', cloudErr);
      }
    }

    // Fallback: Local uploads directory
    const uploadDir = path.join(__dirname, '../../uploads/flashcards');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || (file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg');
    const fileName = `fc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);
    const localUrl = `/uploads/flashcards/${fileName}`;

    return res.status(200).json({ url: localUrl });
  } catch (error) {
    next(error);
  }
};

export const createFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const { deck_id, document_id, front, back, position, term_image_url, definition_image_url } = req.body;
    const card = await flashcardService.createFlashcard(
      userId, 
      deck_id, 
      document_id, 
      front, 
      back, 
      position || 0, 
      term_image_url || null, 
      definition_image_url || null
    );
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
};

export const updateFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { front, back, position, term_image_url, definition_image_url } = req.body;

    const updated = await flashcardService.updateFlashcard(
      cardId, 
      userId, 
      front, 
      back, 
      position, 
      term_image_url, 
      definition_image_url
    );
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};


export const deleteFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    await flashcardService.deleteFlashcard(cardId, userId);
    res.status(200).json({ message: 'Đã xóa thẻ thành công' });
  } catch (error) {
    next(error);
  }
};

export const starFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { is_starred } = req.body;
    const updated = await flashcardService.starFlashcard(cardId, userId, is_starred);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const getCommunityDecks = async (req: Request, res: Response, next: any) => {
  try {
    const decks = await flashcardService.getCommunityDecks();
    res.status(200).json(decks);
  } catch (error) {
    next(error);
  }
};

export const forkDeck = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const deck = await flashcardService.forkDeck(deckId, userId);
    res.status(201).json(deck);
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req: Request, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const leaderboard = await flashcardService.getLeaderboard(deckId);
    res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
};

export const addLeaderboardEntry = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const deckId = parseInt(req.params.deckId, 10);
    const userId = req.user!.id;
    const { time_ms } = req.body;
    const entry = await flashcardService.addLeaderboardEntry(deckId, userId, time_ms);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

export const reviewFlashcard = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user!.id;
    const { difficulty } = req.body;
    const result = await flashcardService.reviewFlashcard(cardId, userId, difficulty);
    res.status(200).json({
      message: 'Flashcard reviewed successfully',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const generateFlashcardsFromFile = async (req: AuthRequest, res: Response, next: any) => {
  const beStartTime = Date.now();
  let aiDurationMs = 0;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file tài liệu' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const ext = originalname.split('.').pop()?.toLowerCase();
    let extractedText = '';

    if (mimetype === 'application/pdf' || ext === 'pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      const mammoth = require('mammoth');
      const data = await mammoth.extractRawText({ buffer });
      extractedText = data.value;
    } else if (mimetype === 'text/plain' || ext === 'txt') {
      extractedText = buffer.toString('utf-8');
    } else if (
      mimetype.includes('spreadsheetml') ||
      mimetype.includes('excel') ||
      mimetype === 'text/csv' ||
      ext === 'xlsx' ||
      ext === 'xls' ||
      ext === 'csv'
    ) {
      const xlsx = require('xlsx');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      extractedText = xlsx.utils.sheet_to_csv(sheet);
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({ error: 'Không tìm thấy nội dung văn bản hợp lệ trong tài liệu này' });
    }

    const truncatedText = extractedText.trim().substring(0, 15000);
    const userId = req.user?.id || null;

    const systemPrompt = `Bạn là một chuyên gia giáo dục thiết kế thẻ ghi nhớ (Flashcards).
Đọc văn bản sau và trích xuất các khái niệm cốt lõi thành các cặp Flashcard (front - back).
QUY TẮC BẮT BUỘC:
1. "front": Khái niệm / câu hỏi ngắn / thuật ngữ.
2. "back": Định nghĩa ngắn gọn / câu trả lời rõ ràng / ví dụ nếu có.
3. Chỉ trả về một mảng JSON các object [{ "front": "...", "back": "..." }]. Không bọc markdown, không thêm giải thích ngoài JSON.`;

    let cards: Array<{ front: string; back: string }> = [];
    let metadata: {
      provider: string;
      model: string;
      isLLMGenerated: boolean;
      warning: string | null;
    } = {
      provider: 'unknown',
      model: 'unknown',
      isLLMGenerated: false,
      warning: null,
    };

    try {
      const aiStartTime = Date.now();
      const aiRes = await aiProviderService.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `NỘI DUNG TÀI LIỆU (${originalname}):\n\n${truncatedText}` }
        ],
        taskType: 'flashcard',
        jsonMode: true,
        userId,
        temperature: 0.3
      });
      aiDurationMs = Date.now() - aiStartTime;

      let cleaned = aiRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const startIdx = cleaned.indexOf('[');
      const endIdx = cleaned.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        cleaned = `[${cleaned}]`;
      }
      cards = JSON.parse(cleaned);
      metadata = {
        provider: aiRes.provider,
        model: aiRes.modelName,
        isLLMGenerated: true,
        warning: null,
      };
      console.log(`[FLASHCARD_AI] Generated ${cards.length} cards via LLM (${aiRes.provider}/${aiRes.modelName}) in ${aiDurationMs}ms`);
    } catch (aiErr: any) {
      console.warn('[FLASHCARD_AI] AI provider call error, using fallback parser:', aiErr?.message);
      const paragraphs = truncatedText.split(/\n\s*\n/).filter(p => p.trim().length > 20);
      cards = paragraphs.slice(0, 8).map((para, i) => {
        const sentences = para.split(/[.!?]\s+/);
        const front = sentences[0]?.trim() || `Khái niệm ${i + 1}`;
        const back = sentences.slice(1).join('. ').trim() || para.trim();
        return { front: front.substring(0, 150), back: back.substring(0, 300) };
      });
      metadata = {
        provider: 'heuristic_fallback',
        model: 'regex_paragraph_extractor',
        isLLMGenerated: false,
        warning: 'Dịch vụ AI không khả dụng hoặc phản hồi quá thời gian chờ (~15s). Bộ thẻ được trích xuất bằng thuật toán tách đoạn văn bản tự động (không qua LLM).',
      };
      console.warn(`[FLASHCARD_AI] Heuristic fallback used (${cards.length} cards):`, metadata.warning);
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(500).json({ error: 'AI không tìm thấy nội dung phù hợp để tạo thẻ ghi nhớ.' });
    }

    const beTotalDurationMs = Date.now() - beStartTime;
    res.setHeader('X-BE-Duration-Ms', String(beTotalDurationMs));
    res.setHeader('X-AI-Duration-Ms', String(aiDurationMs));
    res.setHeader('X-AI-Provider', metadata.provider);
    res.setHeader('X-AI-Model', metadata.model);
    res.setHeader('X-AI-Is-LLM', String(metadata.isLLMGenerated));
    return res.status(200).json({
      cards,
      metadata,
      beDurationMs: beTotalDurationMs,
      aiDurationMs
    });
  } catch (error: any) {
    console.error('Error generating flashcards from file:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý file tài liệu' });
  }
};


