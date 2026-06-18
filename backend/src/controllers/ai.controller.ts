import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_if_not_set',
});

export const chatWithDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { documentContext, question } = req.body;

    if (!documentContext || !question) {
      return res.status(400).json({ error: 'Vui lòng cung cấp nội dung tài liệu và câu hỏi' });
    }

    // Fallback if no OpenAI key is set
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ answer: '[Mô phỏng AI] Dựa trên tài liệu bạn cung cấp, đây là câu trả lời mô phỏng do thiếu OpenAI API Key.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `Bạn là một trợ lý học tập. Hãy trả lời câu hỏi dựa trên nội dung tài liệu sau: ${documentContext}` },
        { role: 'user', content: question }
      ]
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error communicating with AI:', error);
    res.status(500).json({ error: 'Lỗi server khi giao tiếp với AI' });
  }
};

export const generateFlashcards = async (req: AuthRequest, res: Response) => {
  try {
    const { textContext, count = 5 } = req.body;

    if (!textContext) {
      return res.status(400).json({ error: 'Vui lòng cung cấp nội dung để tạo flashcards' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        flashcards: [
          { front: 'Khái niệm A là gì?', back: 'Định nghĩa khái niệm A (Mô phỏng).' },
          { front: 'Tại sao B lại quan trọng?', back: 'Lý do B quan trọng (Mô phỏng).' }
        ]
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: `Trích xuất các ý chính và tạo ${count} thẻ flashcard. Hãy trả về ĐÚNG ĐỊNH DẠNG JSON sau: { "flashcards": [{ "front": "Câu hỏi", "back": "Đáp án" }] }` },
        { role: 'user', content: textContext }
      ],
      response_format: { type: 'json_object' }
    });

    const parsedData = JSON.parse(completion.choices[0].message.content || '{"flashcards":[]}');
    res.json({ flashcards: parsedData.flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo flashcards' });
  }
};
