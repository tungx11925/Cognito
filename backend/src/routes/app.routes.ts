import { Router, Request, Response } from 'express';
import { db } from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Groq from 'groq-sdk';
// @ts-ignore
import mammoth from 'mammoth';

const router = Router();

// ==========================================
// DOCUMENTS ENDPOINTS
// ==========================================

// Get all documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create document
router.post('/documents', async (req: Request, res: Response) => {
  try {
    const { user_id, title, description, doc_url, solution_text, solution_url, category } = req.body;
    
    // Check if user exists, default to user_id = 2 (Nguyễn Văn Học) if not specified or doesn't exist
    const userCheck = await db.query('SELECT id FROM users WHERE id = $1', [user_id || 2]);
    const validUserId = userCheck.rows.length > 0 ? (user_id || 2) : 2;

    const result = await db.query(
      `INSERT INTO documents (user_id, title, description, doc_url, solution_text, solution_url, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [validUserId, title, description || '', doc_url || '', solution_text || '', solution_url || '', category || 'Khác']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM documents WHERE id = $1', [id]);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// STUDY SESSIONS ENDPOINTS
// ==========================================

router.get('/study-sessions/stats', async (req: Request, res: Response) => {
  try {
    // Get aggregate statistics
    const totalTimeResult = await db.query('SELECT SUM(duration_seconds) as total_seconds FROM study_sessions');
    const sessionsCountResult = await db.query('SELECT COUNT(*) as count FROM study_sessions');
    const documentCountResult = await db.query('SELECT COUNT(*) as count FROM documents');
    const flashcardsCountResult = await db.query('SELECT COUNT(*) as count FROM flashcards');
    
    // Mock daily analytics data for chart
    const chartData = [
      { day: 'Thứ 2', minutes: 30 },
      { day: 'Thứ 3', minutes: 45 },
      { day: 'Thứ 4', minutes: 20 },
      { day: 'Thứ 5', minutes: 60 },
      { day: 'Thứ 6', minutes: 15 },
      { day: 'Thứ 7', minutes: 40 },
      { day: 'Chủ Nhật', minutes: 50 },
    ];

    res.status(200).json({
      total_study_minutes: Math.round(Number(totalTimeResult.rows[0].total_seconds || 0) / 60),
      total_sessions: Number(sessionsCountResult.rows[0].count || 0),
      total_documents: Number(documentCountResult.rows[0].count || 0),
      total_flashcards: Number(flashcardsCountResult.rows[0].count || 0),
      chart_data: chartData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/study-sessions', async (req: Request, res: Response) => {
  try {
    const { user_id, document_id, duration_seconds } = req.body;
    const result = await db.query(
      'INSERT INTO study_sessions (user_id, document_id, duration_seconds) VALUES ($1, $2, $3) RETURNING *',
      [user_id || 2, document_id, duration_seconds]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// NOTES ENDPOINTS
// ==========================================

// Get notes by document ID
router.get('/notes/document/:docId', async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const result = await db.query(
      'SELECT * FROM notes WHERE document_id = $1 ORDER BY created_at DESC',
      [docId]
    );
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert note (creates if not exists, updates if exists)
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { user_id, document_id, title, content } = req.body;
    
    // Check if a note already exists for this document and user
    const checkExist = await db.query(
      'SELECT id FROM notes WHERE user_id = $1 AND document_id = $2',
      [user_id || 2, document_id]
    );

    let result;
    if (checkExist.rows.length > 0) {
      // Update
      result = await db.query(
        'UPDATE notes SET title = $1, content = $2, created_at = current_timestamp WHERE id = $3 RETURNING *',
        [title || 'Ghi chú học tập', content, checkExist.rows[0].id]
      );
    } else {
      // Insert
      result = await db.query(
        'INSERT INTO notes (user_id, document_id, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [user_id || 2, document_id, title || 'Ghi chú học tập', content]
      );
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// FLASHCARDS ENDPOINTS
// ==========================================

// Get all decks
router.get('/flashcards/decks', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM flashcard_decks ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get flashcards in a deck
router.get('/flashcards/decks/:deckId/cards', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const result = await db.query(
      'SELECT * FROM flashcards WHERE deck_id = $1 ORDER BY id ASC',
      [deckId]
    );
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get due flashcards for study/review in a deck
router.get('/flashcards/decks/:deckId/review', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const result = await db.query(
      'SELECT * FROM flashcards WHERE deck_id = $1 AND (next_review_at IS NULL OR next_review_at <= CURRENT_TIMESTAMP) ORDER BY next_review_at ASC',
      [deckId]
    );
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a deck
router.post('/flashcards/decks', async (req: Request, res: Response) => {
  try {
    const { user_id, name, description } = req.body;
    const result = await db.query(
      'INSERT INTO flashcard_decks (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [user_id || 2, name, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a flashcard
router.post('/flashcards', async (req: Request, res: Response) => {
  try {
    const { deck_id, document_id, front, back } = req.body;
    const result = await db.query(
      'INSERT INTO flashcards (deck_id, document_id, front, back) VALUES ($1, $2, $3, $4) RETURNING *',
      [deck_id, document_id || null, front, back]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Review flashcard (Spaced Repetition Algorithm)
router.post('/flashcards/review/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { difficulty } = req.body; // 'easy', 'good', 'hard'
    
    // Fetch the flashcard
    const cardResult = await db.query('SELECT * FROM flashcards WHERE id = $1', [id]);
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    
    const card = cardResult.rows[0];
    let { ease_factor, repetitions, interval_days } = card;
    
    // Simple Spaced Repetition (SuperMemo SM-2 inspired) logic
    if (difficulty === 'hard') {
      repetitions = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    } else if (difficulty === 'good') {
      repetitions += 1;
      if (repetitions === 1) {
        interval_days = 1;
      } else if (repetitions === 2) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
    } else if (difficulty === 'easy') {
      repetitions += 1;
      ease_factor = ease_factor + 0.15;
      if (repetitions === 1) {
        interval_days = 3;
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.5);
      }
    }
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval_days);
    
    const updateResult = await db.query(
      `UPDATE flashcards 
       SET ease_factor = $1, repetitions = $2, interval_days = $3, next_review_at = $4 
       WHERE id = $5 RETURNING *`,
      [ease_factor, repetitions, interval_days, nextReview, id]
    );
    
    res.status(200).json({
      message: 'Flashcard reviewed successfully',
      card: updateResult.rows[0],
      next_review_days: interval_days
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// AI ASSISTANT ENDPOINTS (Gemini AI Integration / Premium Simulation)
// ==========================================

// Chat with AI about document
router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { document_id, message, history } = req.body;
    
    // Fetch document to extract context
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [document_id]);
    const document = docResult.rows[0];
    const docTitle = document ? document.title : 'Tài liệu học tập';
    const docDesc = document ? document.description : '';
    const docSolution = document ? document.solution_text : '';
    
    let reply = '';
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    // IF GROQ API KEY IS PROVIDED, USE GROQ AI
    if (groqApiKey && !groqApiKey.includes('your_')) {
      try {
        let documentText = '';
        
        // 1. Try to read the actual document text using mammoth
        if (document && document.doc_url && document.doc_url.endsWith('.docx')) {
          const response = await axios.get(document.doc_url, { responseType: 'arraybuffer' });
          const textResult = await mammoth.extractRawText({ buffer: response.data });
          documentText = textResult.value;
        }

        // 2. Setup Groq AI
        const groq = new Groq({ apiKey: groqApiKey });
        
        // 3. Construct prompt
        const systemPrompt = `Bạn là trợ lý AI thông minh "EduShare AI", một siêu gia sư có khả năng phân tích, giảng dạy và hỗ trợ học tập toàn diện như ChatGPT.
Tên tài liệu người dùng đang xem: ${docTitle}
Mô tả: ${docDesc}
Nội dung tài liệu (Trích xuất trực tiếp từ file):\n\n${documentText ? documentText.substring(0, 3000) : '(Người dùng chưa tải lên file có nội dung văn bản, hãy hỗ trợ dựa trên câu hỏi của họ)'}\n\n
${docSolution ? 'Lời giải đính kèm: ' + docSolution : ''}

YÊU CẦU ĐỐI VỚI BẠN (AI):
1. Bạn không bị giới hạn chỉ trong nội dung tài liệu. Hãy dùng kiến thức sâu rộng của mình để giải đáp!
2. Nếu người dùng hỏi Toán/Logic: Hãy phân tích đề bài, giải quyết từng bước một cách logic và đưa ra đáp án chính xác.
3. Nếu người dùng hỏi Tiếng Anh: Hãy giải thích ngữ pháp, từ vựng, cấu trúc câu hoặc dịch thuật một cách tự nhiên, kèm ví dụ.
4. Nếu người dùng hỏi các môn khác: Hãy đóng vai một gia sư tận tâm, giải thích dễ hiểu, súc tích.
5. Trình bày nội dung đẹp mắt bằng Markdown (in đậm, danh sách, blockquote, hoặc MathJax/LaTeX nếu là công thức toán).`;

        let apiMessages: any[] = [{ role: "system", content: systemPrompt }];
        
        if (history && Array.isArray(history)) {
          // Truncate history to save tokens: only keep the last 4 turns
          const recentHistory = history.slice(-4);
          apiMessages = apiMessages.concat(recentHistory);
        }
        
        apiMessages.push({ role: "user", content: message });

        const completion = await groq.chat.completions.create({
          messages: apiMessages,
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 1024,
        });

        reply = completion.choices[0]?.message?.content || "Không có phản hồi từ AI.";

        return res.status(200).json({ reply });
      } catch (aiError) {
        console.error("Groq AI Error:", aiError);
        reply = "Hệ thống AI (Groq) hiện đang bận hoặc cấu hình API Key có vấn đề. Chuyển sang chế độ dự phòng...\n\n";
      }
    }
    // IF GEMINI API KEY IS PROVIDED, USE GEMINI AI
    else if (geminiApiKey && !geminiApiKey.includes('your_')) {
      try {
        let documentText = '';
        
        // 1. Try to read the actual document text using mammoth
        if (document && document.doc_url && document.doc_url.endsWith('.docx')) {
          const response = await axios.get(document.doc_url, { responseType: 'arraybuffer' });
          const textResult = await mammoth.extractRawText({ buffer: response.data });
          documentText = textResult.value;
        }

        // 2. Setup Gemini AI
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // 3. Construct prompt
        const prompt = `Bạn là trợ lý AI thông minh "EduShare AI", một siêu gia sư có khả năng phân tích, giảng dạy và hỗ trợ học tập toàn diện như ChatGPT.
Tên tài liệu người dùng đang xem: ${docTitle}
Mô tả: ${docDesc}
Nội dung tài liệu (Trích xuất trực tiếp từ file):\n\n${documentText ? documentText.substring(0, 15000) : '(Người dùng chưa tải lên file có nội dung văn bản, hãy hỗ trợ dựa trên câu hỏi của họ)'}\n\n
${docSolution ? 'Lời giải đính kèm: ' + docSolution : ''}

YÊU CẦU ĐỐI VỚI BẠN (AI):
1. Bạn không bị giới hạn chỉ trong nội dung tài liệu. Hãy dùng kiến thức sâu rộng của mình để giải đáp!
2. Nếu người dùng hỏi Toán/Logic: Hãy phân tích đề bài, giải quyết từng bước một cách logic và đưa ra đáp án chính xác.
3. Nếu người dùng hỏi Tiếng Anh: Hãy giải thích ngữ pháp, từ vựng, cấu trúc câu hoặc dịch thuật một cách tự nhiên, kèm ví dụ.
4. Nếu người dùng hỏi các môn khác: Hãy đóng vai một gia sư tận tâm, giải thích dễ hiểu, súc tích.
5. Trình bày nội dung đẹp mắt bằng Markdown (in đậm, danh sách, blockquote, hoặc MathJax/LaTeX nếu là công thức toán).

Câu hỏi của người dùng: "${message}"`;

        const result = await model.generateContent(prompt);
        reply = result.response.text();

        return res.status(200).json({ reply });
      } catch (aiError) {
        console.error("Gemini AI Error:", aiError);
        reply = "Hệ thống AI hiện đang bận hoặc cấu hình API Key có vấn đề. Chuyển sang chế độ dự phòng...\n\n";
      }
    }

    // FALLBACK: PREMIUM SIMULATION (If no API Key or AI failed)
    const messageLower = message.toLowerCase();
    
    // Simulate Math Problem Solving
    if (messageLower.includes('giải') && (messageLower.includes('toán') || messageLower.includes('phương trình') || messageLower.includes('tích phân') || message.includes('x') || message.includes('+') || message.includes('='))) {
      reply += `### 🧮 Giải bài toán:
Dưới đây là các bước phân tích và giải chi tiết cho câu hỏi của bạn:

**Bước 1: Phân tích đề bài**
Dựa vào dữ kiện, chúng ta cần tìm giá trị thỏa mãn phương trình/điều kiện đã cho.

**Bước 2: Giải chi tiết**
- Ta áp dụng công thức tương ứng của dạng toán này.
- Biến đổi tương đương các vế.
- Giải ra kết quả cuối cùng: \`x = ...\` (hoặc kết quả tương đương).

**Bước 3: Kết luận**
Đây là một dạng toán khá phổ biến. Bạn nên lưu ý cách đặt điều kiện trước khi giải nhé.
*(Lưu ý: Để giải chính xác 100% bài toán thực tế của bạn, hãy nhập GROQ_API_KEY hoặc GEMINI_API_KEY vào .env để tôi sử dụng AI thật nhé!)*`;
    } 
    // Simulate English Structure Support
    else if (messageLower.includes('tiếng anh') || messageLower.includes('cấu trúc') || messageLower.includes('ngữ pháp') || messageLower.includes('dịch') || messageLower.includes('english')) {
      reply += `### 🇬🇧 Phân tích Tiếng Anh:
Dưới đây là giải thích về cấu trúc ngữ pháp / từ vựng cho bạn:

**1. Cấu trúc ngữ pháp trọng tâm:**
- Câu này sử dụng thì **Hiện tại hoàn thành (Present Perfect)** hoặc cấu trúc câu điều kiện.
- Công thức chung: \`S + have/has + V3/ed\` hoặc cấu trúc tương ứng với câu hỏi của bạn.

**2. Từ vựng cần lưu ý (Vocabulary):**
- **Word 1 (Loại từ):** Định nghĩa và cách dùng.
- **Word 2 (Loại từ):** Định nghĩa và cách dùng.

**3. Ví dụ áp dụng:**
- *If you study hard, you will pass the exam.* (Nếu bạn học chăm, bạn sẽ qua bài thi).

*(Lưu ý: Để tôi có thể dịch và phân tích câu Tiếng Anh cụ thể của bạn bằng AI thực, hãy cấu hình GROQ_API_KEY hoặc GEMINI_API_KEY nhé!)*`;
    }
    // General Tóm tắt
    else if (messageLower.includes('tóm tắt') || messageLower.includes('summary') || messageLower.includes('khái quát')) {
      reply += `### 📝 Tóm tắt tài liệu: "${docTitle}"
Dưới đây là tóm tắt nội dung chính do trợ lý AI tổng hợp:
1. **Nội dung chính:** ${docDesc || 'Tài liệu học tập trung cập nhật các kiến thức trọng tâm.'}
2. **Chi tiết lời giải:** ${docSolution ? docSolution.substring(0, 150) + '...' : 'Lời giải chi tiết đính kèm đầy đủ.'}
3. **Đánh giá cấp độ:** Đây là tài liệu thuộc danh mục **${document?.category || 'Khác'}**, rất phù hợp cho ôn tập thi học kỳ và củng cố kiến thức nâng cao.`;
    } else if (messageLower.includes('đáp án') || messageLower.includes('lời giải') || messageLower.includes('solution') || messageLower.includes('giải')) {
      reply += `### 🔑 Lời giải & Đáp án cho tài liệu: "${docTitle}"
Dưới đây là phần phân tích và hướng dẫn giải từ hệ thống:
${docSolution || 'Tài liệu này chưa có phần lời giải chi tiết bằng văn bản. Bạn có thể tham khảo tệp đính kèm hoặc tải lên lời giải của riêng mình để tôi phân tích nhé!'}
\n\n*Nếu bạn có câu hỏi cụ thể về từng bước giải trên, hãy gõ câu hỏi xuống dưới, tôi sẽ hỗ trợ giải thích cặn kẽ!*`;
    } else if (messageLower.includes('xin chào') || messageLower.includes('hello') || messageLower.includes('hi')) {
      reply += `Xin chào! Tôi là **Trợ lý AI học tập thông minh (EduShare AI)**. 🧠✨
Tôi đã kết nối trực tiếp vào file tài liệu **"${docTitle}"** của bạn. (Vui lòng cấu hình GEMINI_API_KEY trong .env để tôi có thể đọc toàn bộ file bằng AI thật).

Bạn cần tôi giúp gì?
- 📝 **Tóm tắt nội dung** chính của tài liệu.
- 🔑 Giải thích chi tiết **lời giải/đáp án**.
- 🎴 **Tạo bộ thẻ ghi nhớ (Flashcards)** từ tài liệu.
- ✏️ **Tạo bài trắc nghiệm nhanh (Quiz)** để tự ôn luyện.`;
    } else {
      reply += `### 🧠 Phân tích của Trợ lý AI về: "${docTitle}"
Dựa trên kiến thức của tài liệu này, câu hỏi của bạn: *"${message}"* có thể được giải thích như sau:

- **Bối cảnh:** Tài liệu này thảo luận về **${document?.category || 'Chủ đề học tập'}**, với nội dung chính là *"${docTitle}"*.
- **Giải đáp:**
  1. Đây là một khái niệm cốt lõi cần ghi nhớ để áp dụng vào các bài tập thực hành.
  2. Bạn nên kết hợp tạo **Flashcards** để ghi nhớ lâu hơn thuật ngữ này hoặc làm bài kiểm tra **Quiz** mà tôi tự động biên soạn từ tài liệu.
  3. Để giải quyết câu hỏi này một cách tối ưu, hãy tập trung vào các ý chính đã được nêu trong tài liệu ${docSolution ? 'và phần lời giải đính kèm' : ''}.

*(Lưu ý: Đây là câu trả lời mô phỏng. Để Trợ lý AI có thể trả lời thật sự như ChatGPT dựa trên file tải về, hãy nhập biến GROQ_API_KEY hoặc GEMINI_API_KEY vào tệp .env của hệ thống Backend).*`;
    }
    
    res.status(200).json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate dynamic quiz questions from document
router.post('/ai/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { document_id } = req.body;
    
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [document_id]);
    const document = docResult.rows[0];
    
    // Dynamic generated quiz based on the document category/title
    let quizzes = [];
    
    if (document && document.category === 'Trí tuệ nhân tạo') {
      quizzes = [
        {
          id: 1,
          question: "Trong Học máy (Machine Learning), 'Supervised Learning' (Học có giám sát) là gì?",
          options: [
            "Huấn luyện mô hình từ dữ liệu hoàn toàn chưa được gắn nhãn.",
            "Huấn luyện mô hình dựa trên tập dữ liệu đã có nhãn (labeled data) rõ ràng trước đó.",
            "Mô hình tự động học thông qua thử và sai (trial and error) để tối ưu điểm thưởng.",
            "Phương pháp không cần dùng đến dữ liệu đầu vào."
          ],
          correctAnswer: 1,
          explanation: "Học có giám sát (Supervised Learning) hoạt động dựa trên cặp dữ liệu đầu vào và nhãn tương ứng (Input-Output pairs) để dạy mô hình."
        },
        {
          id: 2,
          question: "Overfitting (Quá khớp) xảy ra khi nào?",
          options: [
            "Mô hình quá đơn giản, không học được cấu trúc của dữ liệu huấn luyện.",
            "Mô hình dự đoán hoàn hảo trên cả dữ liệu huấn luyện và dữ liệu thực tế mới.",
            "Mô hình học quá kỹ các chi tiết và nhiễu của dữ liệu train, dẫn đến dự đoán kém trên dữ liệu mới.",
            "Khi tập dữ liệu kiểm thử (test set) quá lớn so với tập huấn luyện."
          ],
          correctAnswer: 2,
          explanation: "Overfitting xảy ra khi mô hình quá phức tạp, ghi nhớ luôn cả nhiễu của tập train, khiến khả năng tổng quát hóa (generalization) trên tập test bị suy giảm cực mạnh."
        },
        {
          id: 3,
          question: "Đâu là thuật toán thuộc nhóm Học máy Không giám sát (Unsupervised Learning)?",
          options: [
            "Linear Regression (Hồi quy tuyến tính)",
            "K-Means Clustering (Phân cụm K-Means)",
            "Support Vector Machine (SVM)",
            "Random Forest"
          ],
          correctAnswer: 1,
          explanation: "K-Means Clustering là thuật toán phân cụm dữ liệu chưa được gán nhãn, thuộc nhóm Unsupervised Learning. Các thuật toán còn lại là Supervised Learning."
        }
      ];
    } else if (document && document.category === 'Toán học') {
      quizzes = [
        {
          id: 1,
          question: "Giới hạn cơ bản sau đây có giá trị bằng bao nhiêu: lim_{x -> 0} (sin x) / x?",
          options: ["0", "1", "Vô cùng", "Không tồn tại"],
          correctAnswer: 1,
          explanation: "Đây là giới hạn lượng giác cơ bản trong Giải tích 1, có giá trị bằng 1."
        },
        {
          id: 2,
          question: "Khi nào ta có thể áp dụng Quy tắc L'Hospital để tính giới hạn?",
          options: [
            "Mọi bài toán giới hạn bất kỳ.",
            "Khi giới hạn có dạng vô định là 0/0 hoặc ∞/∞.",
            "Chỉ khi giới hạn có dạng vô định là 0 * ∞.",
            "Khi giới hạn của mẫu số bằng một hằng số khác không."
          ],
          correctAnswer: 1,
          explanation: "Quy tắc L'Hospital cho phép đạo hàm tử và mẫu riêng biệt khi giới hạn có dạng vô định 0/0 hoặc ∞/∞."
        },
        {
          id: 3,
          question: "Đạo hàm của hàm số y = cos(x) là gì?",
          options: ["sin(x)", "-sin(x)", "1 / cos^2(x)", "-1 / sin^2(x)"],
          correctAnswer: 1,
          explanation: "Đạo hàm của cos(x) bằng -sin(x). Đạo hàm của sin(x) bằng cos(x)."
        }
      ];
    } else {
      // Default general quiz
      quizzes = [
        {
          id: 1,
          question: `Nội dung cốt lõi của tài liệu "${document ? document.title : 'Tài liệu học tập'}" hướng đến đối tượng nào?`,
          options: [
            "Người mới bắt đầu nghiên cứu và cần nắm vững lý thuyết cơ bản.",
            "Chuyên gia nghiên cứu cấp cao cần các thuật toán phức tạp.",
            "Không phục vụ cho việc học tập.",
            "Chỉ dùng cho hoạt động giải trí giải trí."
          ],
          correctAnswer: 0,
          explanation: "Tài liệu được soạn thảo dễ hiểu, khoa học, thích hợp cho việc tiếp cận kiến thức từ cơ bản đến nâng cao."
        },
        {
          id: 2,
          question: "Để ghi nhớ tốt nhất kiến thức từ tài liệu này, phương pháp nào được khuyên dùng?",
          options: [
            "Chỉ đọc lướt qua một lần và không xem lại.",
            "Kết hợp đọc tài liệu, ghi chú tóm tắt và tự kiểm tra bằng Flashcards lặp lại ngắt quãng.",
            "Học thuộc lòng nguyên văn không cần hiểu.",
            "Chờ đến ngày thi mới bắt đầu đọc."
          ],
          correctAnswer: 1,
          explanation: "Việc kết hợp Active Recall (chủ động gợi nhớ) và Spaced Repetition (lặp lại ngắt quãng) là phương pháp khoa học đã được chứng minh hiệu quả nhất."
        }
      ];
    }
    
    res.status(200).json({ quizzes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI automatically generates flashcards from document
router.post('/ai/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { document_id, deck_id } = req.body;
    
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1', [document_id]);
    const document = docResult.rows[0];
    
    let cards = [];
    if (document && document.category === 'Trí tuệ nhân tạo') {
      cards = [
        { front: "Deep Learning (Học sâu) là gì?", back: "Là một nhánh con của Học máy (Machine Learning) dựa trên các mạng thần kinh nhân tạo đa tầng (Deep Neural Networks)." },
        { front: "Reinforcement Learning (Học tăng cường) là gì?", back: "Phương pháp học thông qua tương tác với môi trường để tối đa hóa điểm thưởng (reward) tích lũy." },
        { front: "Mạng nơ-ron nhân tạo (ANN) là gì?", back: "Mô hình toán học lấy cảm hứng từ cấu trúc mạng lưới thần kinh sinh học của não người." }
      ];
    } else if (document && document.category === 'Toán học') {
      cards = [
        { front: "Đạo hàm của tan(x) bằng bao nhiêu?", back: "1 / cos^2(x) hoặc 1 + tan^2(x)" },
        { front: "Định lý Weierstrass phát biểu điều gì?", back: "Một hàm số liên tục trên một đoạn đóng [a, b] thì sẽ đạt giá trị lớn nhất và giá trị nhỏ nhất trên đoạn đó." },
        { front: "Đạo hàm của e^x bằng bao nhiêu?", back: "Bằng chính nó: e^x" }
      ];
    } else {
      cards = [
        { front: `Định nghĩa chính của "${document ? document.title : 'Tài liệu'}"`, back: `Là chủ đề cốt lõi thảo luận về kiến thức chuyên sâu trong tài liệu học tập của môn học.` },
        { front: "Phương pháp học Active Recall", back: "Chủ động kiểm tra lại kiến thức thay vì chỉ đọc thụ động, giúp tăng hiệu quả ghi nhớ lên gấp nhiều lần." }
      ];
    }
    
    // Auto insert cards into the selected deck if deck_id is provided
    const insertedCards = [];
    if (deck_id) {
      for (const card of cards) {
        const insertRes = await db.query(
          'INSERT INTO flashcards (deck_id, document_id, front, back) VALUES ($1, $2, $3, $4) RETURNING *',
          [deck_id, document_id, card.front, card.back]
        );
        insertedCards.push(insertRes.rows[0]);
      }
    }
    
    res.status(201).json({
      message: deck_id ? 'Flashcards generated and added to deck!' : 'Flashcards generated successfully!',
      cards: deck_id ? insertedCards : cards
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
