import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { aiService } from '../services/ai.service';
import { db } from '../db';
import { generateMindmapWithAI } from '../utils/ai-engine.service';
import { sanitizeUserInstruction } from '../utils/ai-security';
import { entitlementService } from '../services/entitlement.service';
import { aiProviderService } from '../services/ai-provider.service';

export const chatWithDocument = async (req: AuthRequest, res: Response, next: any) => {
  let reservation: any = null;
  try {
    const { document_id, context_mode, message, history, image, images } = req.body;
    const userId = req.user!.id;
    
    // Check old style requests from previous version
    if (req.body.documentContext) {
       return res.status(400).json({ error: 'Endpoint deprecated for direct context. Use document_id instead.' });
    }

    // 1. Prompt Injection Protection (Dual-Tier Filter: English & Vietnamese)
    if (message) {
      sanitizeUserInstruction(message, 4000);
    }

    // 2. Pre-check Global System Daily Budget Cap (Phase 27 - Cost Control)
    // Chặn trước để không trừ oan hạn ngạch cá nhân của user khi hệ thống hết ngân sách
    await aiProviderService.checkGlobalDailyBudget();

    // 3. Entitlement / Daily Quota Check with Atomic Reservation (Phase 20)
    reservation = await entitlementService.checkAndReserveDailyUsage(userId, 'ai_chat_daily');
    if (!reservation.allowed) {
      return res.status(403).json({
        error: 'LIMIT_EXCEEDED',
        message: `Bạn đã đạt giới hạn ${reservation.limit} tin nhắn chat AI trong ngày của gói Miễn phí. Vui lòng nâng cấp lên gói Pro để tiếp tục trò chuyện không giới hạn.`,
        feature: 'ai_chat_daily',
        limit: reservation.limit,
        current: reservation.current,
      });
    }

    let document = null;
    let effectiveMode: 'GENERAL' | 'DOCUMENT_CONTEXT' = context_mode || (document_id ? 'DOCUMENT_CONTEXT' : 'GENERAL');

    if (document_id) {
      // Permission check: owner or public document
      const docResult = await db.query(
        'SELECT * FROM documents WHERE id = $1 AND (user_id = $2 OR visibility = \'public\')',
        [document_id, userId]
      );
      if (docResult.rows.length === 0) {
        if (reservation?.reserved) {
          await entitlementService.refundDailyUsage(userId, 'ai_chat_daily');
        }
        return res.status(403).json({ error: 'Không có quyền truy cập tài liệu này hoặc tài liệu không tồn tại' });
      }
      document = docResult.rows[0];
    } else {
      effectiveMode = 'GENERAL';
    }

    const chatResult = await aiService.chatWithDocument(document, message || '', history, images || image, userId, effectiveMode);
    res.setHeader('X-AI-Provider', chatResult.metadata.provider);
    res.setHeader('X-AI-Model', chatResult.metadata.model);
    res.setHeader('X-AI-Is-LLM', String(chatResult.metadata.isLLMGenerated));
    res.status(200).json({
      reply: chatResult.reply,
      context_mode: effectiveMode,
      metadata: chatResult.metadata,
    });
  } catch (error) {
    if (reservation?.reserved) {
      await entitlementService.refundDailyUsage(req.user!.id, 'ai_chat_daily');
    }
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
    const mermaidCode = await generateMindmapWithAI(docTitle, docContent, { userId, documentId: document_id });

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
