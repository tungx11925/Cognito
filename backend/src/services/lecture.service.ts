import { db } from '../db';
import { AppError } from '../utils/AppError';
import { parserService } from './parser.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { cleanVietnameseText } from '../utils/vietnamese';

import fs from 'fs';
import path from 'path';

export class LectureService {
  /**
   * List all lectures
   */
  async listLectures(userId?: number) {
    const query = userId 
      ? 'SELECT * FROM lectures WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC'
      : 'SELECT * FROM lectures ORDER BY created_at DESC';
    const params = userId ? [userId] : [];
    const res = await db.query(query, params);
    return res.rows.map(row => ({
      ...row,
      title: cleanVietnameseText(row.title),
      description: cleanVietnameseText(row.description),
      subject: cleanVietnameseText(row.subject)
    }));
  }

  /**
   * Get lecture with all slides
   */
  async getLectureById(id: number) {
    const lectureRes = await db.query('SELECT * FROM lectures WHERE id = $1', [id]);
    if (lectureRes.rows.length === 0) {
      throw new AppError('Không tìm thấy bài giảng / slide này', 404);
    }
    const lecture = lectureRes.rows[0];

    const slidesRes = await db.query(
      'SELECT * FROM lecture_slides WHERE lecture_id = $1 ORDER BY slide_number ASC',
      [id]
    );

    return {
      ...lecture,
      title: cleanVietnameseText(lecture.title),
      description: cleanVietnameseText(lecture.description),
      subject: cleanVietnameseText(lecture.subject),
      slides: slidesRes.rows.map(s => ({
        ...s,
        title: cleanVietnameseText(s.title),
        subtitle: cleanVietnameseText(s.subtitle),
        chapter_title: cleanVietnameseText(s.chapter_title),
        content: cleanVietnameseText(s.content),
        callout_title: cleanVietnameseText(s.callout_title),
        callout_content: cleanVietnameseText(s.callout_content),
        speaker_notes: cleanVietnameseText(s.speaker_notes),
      }))
    };
  }

  /**
   * Upload file and create lecture (ORIGINAL or AI_GENERATED)
   */
  async createLectureFromFile(
    userId: number,
    fileBuffer: Buffer,
    originalname: string,
    title?: string,
    subject?: string,
    mode: 'ORIGINAL' | 'AI_GENERATED' = 'ORIGINAL'
  ) {
    // 1. Save file locally to uploads folder
    const safeBaseName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const savedFileName = `${Date.now()}-${safeBaseName}`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, savedFileName), fileBuffer);
    const fileUrl = `/uploads/${savedFileName}`;

    const ext = originalname.split('.').pop()?.toLowerCase();
    const lectureTitle = cleanVietnameseText(title || originalname.replace(/\.[^/.]+$/, ''));
    const lectureSubject = cleanVietnameseText(subject || 'Khoa học tổng hợp');

    // ─── CHẾ ĐỘ 1: TRÌNH CHIẾU NGUYÊN BẢN (ORIGINAL SLIDE VIEWER) ───────────
    if (mode === 'ORIGINAL') {
      let pageCount = 1;
      if (ext === 'pdf') {
        try {
          const pdfParse = require('pdf-parse/lib/pdf-parse.js');
          const data = await pdfParse(fileBuffer);
          pageCount = data.numpages || 1;
        } catch (e) {
          console.warn('PDF parse page count error:', e);
        }
      }

      // Save Lecture record in DB
      const lectureRes = await db.query(`
        INSERT INTO lectures (
          user_id, title, description, subject, chapter_count, total_slides, cover_color, file_url, presentation_mode, original_filename
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        userId,
        lectureTitle,
        cleanVietnameseText(`Slide trình chiếu gốc từ file ${originalname}`),
        lectureSubject,
        1,
        pageCount,
        '#0B132B',
        fileUrl,
        'ORIGINAL',
        originalname
      ]);

      const createdLecture = lectureRes.rows[0];

      // Create slide records 1-to-1 for each page
      for (let i = 1; i <= pageCount; i++) {
        await db.query(`
          INSERT INTO lecture_slides (
            lecture_id, slide_number, chapter_index, chapter_title, title, subtitle, content, callout_type, callout_title, callout_content, speaker_notes, page_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          createdLecture.id,
          i,
          1,
          'Slide gốc',
          `${lectureTitle} - Trang ${i}`,
          `TRANG ${i} / ${pageCount}`,
          `Nội dung trang ${i}`,
          'takeaway',
          'Trang slide',
          `Trang ${i} của file ${originalname}`,
          `Ghi chú cho trang ${i}`,
          i
        ]);
      }

      return this.getLectureById(createdLecture.id);
    }

    // ─── CHẾ ĐỘ 2: AI TỰ ĐỘNG TÓM TẮT & SOẠN SLIDE (AI_GENERATED) ───────────
    let mimetype = 'application/octet-stream';
    if (ext === 'pdf') mimetype = 'application/pdf';
    else if (ext === 'docx' || ext === 'doc') mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'txt' || ext === 'md') mimetype = 'text/plain';

    let extractedText = await parserService.parseFromBuffer(fileBuffer, mimetype);
    extractedText = cleanVietnameseText(extractedText);

    let generatedSlides: any[] = [];
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    const prompt = `Bạn là chuyên gia thiết kế bài giảng sư phạm cao cấp. Hãy đọc kỹ tài liệu sau và chuyển đổi thành một bộ Slide bài giảng trình chiếu chuyên nghiệp cho Giảng viên.

QUY TẮC BẮT BUỘC VỀ CHÍNH TẢ & FONT TIẾNG VIỆT (QUAN TRỌNG):
- Toàn bộ tiêu đề, nội dung, ghi chú PHẢI viết bằng Tiếng Việt chuẩn Unicode (NFC), chuẩn chính tả 100%.
- TUYỆT ĐỐI KHÔNG để lỗi tách dấu thanh như 'vê\`', 'giơ'i', 'tuê\`'. Phải viết liền đúng dấu như 'về', 'giới', 'tuệ'.

QUY TẮC BẮT BUỘC VỀ TRÌNH BÀY SLIDE (CANVA & POWERPOINT STANDARD):
1. VỪA VẶN 1 MÀN HÌNH: Mỗi slide chỉ chứa tối đa 2 đến 3 ý gạch đầu dòng (bullet points) ngắn gọn, súc tích để vừa vặn 100% trong 1 khung máy chiếu, không bị tràn hay cắt xén.
2. TỰ ĐỘNG TÁCH TRANG NẾU DÀI: Nếu một khái niệm, chủ đề hoặc danh sách có nhiều hơn 3 ý/công thức, BẮT BUỘC phải chia tách thành nhiều Slide liên tiếp sang trang sau: VD "Tên bài học (Phần 1)", "Tên bài học (Phần 2)".
3. CẤU TRÚC MỖI SLIDE:
   - "slide_number": Số thứ tự từ 1
   - "chapter_index": Số thứ tự chapter (1, 2, 3...)
   - "chapter_title": Tên chapter (VD: "Chapter 1: Tổng quan")
   - "title": Tiêu đề chính ngắn gọn (VD: "Activation Functions (Phần 1)")
   - "subtitle": Tiêu đề phụ (VD: "3.1 KHÁI NIỆM TRỌNG TÂM")
   - "content": Nội dung ngắn gọn (tối đa 2-3 gạch đầu dòng, công thức LaTeX $...$ nếu có)
   - "callout_type": "definition" | "formula" | "takeaway" | "warning"
   - "callout_title": Tiêu đề hộp ghi chú (VD: "Định nghĩa", "Công thức", "Lưu ý")
   - "callout_content": 1-2 câu cô đọng trong hộp ghi chú
   - "speaker_notes": Gợi ý cho giảng viên khi thuyết trình slide này

4. Trả về ĐÚNG MẢNG JSON thuần túy (không markdown, không bọc \`\`\`json):
[
  {
    "slide_number": 1,
    "chapter_index": 1,
    "chapter_title": "Chapter 1: ...",
    "title": "...",
    "subtitle": "...",
    "content": "...",
    "callout_type": "definition",
    "callout_title": "...",
    "callout_content": "...",
    "speaker_notes": "..."
  }
]

TÀI LIỆU CẦN CHUYỂN ĐỔI:
"""
${extractedText.substring(0, 15000)}
"""`;

    if (geminiApiKey && !geminiApiKey.includes('your_') && !geminiApiKey.startsWith('AQ.')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        let cleaned = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          generatedSlides = JSON.parse(cleaned.substring(start, end + 1));
        }
      } catch (e) {
        console.error('Gemini Lecture Gen Error:', e);
      }
    }

    if (generatedSlides.length === 0 && groqApiKey && !groqApiKey.includes('your_')) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        const comp = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: process.env.GROQ_CHAT_MODEL || 'groq/compound-mini',
          temperature: 0.3,
          max_tokens: 3000
        });
        let cleaned = (comp.choices[0]?.message?.content || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          generatedSlides = JSON.parse(cleaned.substring(start, end + 1));
        }
      } catch (e) {
        console.error('Groq Lecture Gen Error:', e);
      }
    }

    // Fallback if AI didn't return
    if (generatedSlides.length === 0) {
      generatedSlides = [
        {
          slide_number: 1,
          chapter_index: 1,
          chapter_title: 'Chapter 1: Tổng quan',
          title: lectureTitle,
          subtitle: '1.1 GIỚI THIỆU BÀI GIẢNG',
          content: extractedText.substring(0, 500) || 'Nội dung bài giảng được trích xuất từ tài liệu giáo trình.',
          callout_type: 'definition',
          callout_title: 'Mục tiêu bài học',
          callout_content: 'Nắm vững kiến thức nền tảng và phương pháp thực hành theo giáo trình.',
          speaker_notes: 'Giới thiệu khái quát lộ trình bài học cho sinh viên.'
        }
      ];
    }

    // Save Lecture in Database
    const distinctChapters = new Set(generatedSlides.map(s => s.chapter_index)).size;
    const lectureRes = await db.query(`
      INSERT INTO lectures (
        user_id, title, description, subject, chapter_count, total_slides, cover_color, file_url, presentation_mode, original_filename
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      userId,
      cleanVietnameseText(lectureTitle),
      cleanVietnameseText(`Bài giảng tạo từ file ${originalname}`),
      cleanVietnameseText(lectureSubject),
      distinctChapters || 1,
      generatedSlides.length,
      '#0A1128',
      fileUrl,
      'AI_GENERATED',
      originalname
    ]);

    const createdLecture = lectureRes.rows[0];

    for (let i = 0; i < generatedSlides.length; i++) {
      const s = generatedSlides[i];
      await db.query(`
        INSERT INTO lecture_slides (
          lecture_id, slide_number, chapter_index, chapter_title, title, subtitle, content, callout_type, callout_title, callout_content, speaker_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        createdLecture.id,
        i + 1,
        s.chapter_index || 1,
        cleanVietnameseText(s.chapter_title || `Chapter ${s.chapter_index || 1}`),
        cleanVietnameseText(s.title || `Slide ${i + 1}`),
        cleanVietnameseText(s.subtitle || ''),
        cleanVietnameseText(s.content || ''),
        s.callout_type || 'takeaway',
        cleanVietnameseText(s.callout_title || 'Lưu ý'),
        cleanVietnameseText(s.callout_content || ''),
        cleanVietnameseText(s.speaker_notes || '')
      ]);
    }

    return this.getLectureById(createdLecture.id);
  }

  /**
   * Update slide
   */
  async updateSlide(lectureId: number, slideId: number, data: any) {
    const res = await db.query(`
      UPDATE lecture_slides
      SET title = COALESCE($1, title),
          subtitle = COALESCE($2, subtitle),
          content = COALESCE($3, content),
          callout_title = COALESCE($4, callout_title),
          callout_content = COALESCE($5, callout_content),
          speaker_notes = COALESCE($6, speaker_notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND lecture_id = $8
      RETURNING *
    `, [
      data.title,
      data.subtitle,
      data.content,
      data.callout_title,
      data.callout_content,
      data.speaker_notes,
      slideId,
      lectureId
    ]);

    if (res.rows.length === 0) {
      throw new AppError('Slide không tồn tại', 404);
    }
    return res.rows[0];
  }

  /**
   * Delete lecture
   */
  async deleteLecture(id: number, userId: number) {
    const res = await db.query('DELETE FROM lectures WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING id', [id, userId]);
    if (res.rows.length === 0) {
      throw new AppError('Không thể xóa bài giảng hoặc bạn không có quyền', 403);
    }
    return { success: true };
  }

  /**
   * On-demand AI assistant for a specific slide / page
   */
  async aiAssistSlide(
    lectureId: number, 
    slideNumber: number, 
    action: 'notes' | 'summary' | 'explain' | 'quiz' | 'chat',
    userQuestion?: string
  ) {
    const lecture = await this.getLectureById(lectureId);
    const targetSlide = lecture.slides.find((s: any) => s.slide_number === slideNumber) || lecture.slides[0];

    // Try to get text context from file or slide
    let pageContext = '';
    if (lecture.file_url) {
      const filePath = path.join(__dirname, '../../', lecture.file_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try {
          const pdfParse = require('pdf-parse/lib/pdf-parse.js');
          const buffer = fs.readFileSync(filePath);
          let pageText = '';
          await pdfParse(buffer, {
            pagerender: function(pageData: any) {
              if (pageData.pageIndex + 1 === slideNumber) {
                return pageData.getTextContent().then((textContent: any) => {
                  let lastY, text = '';
                  for (let item of textContent.items) {
                    if (lastY == item.transform[5] || !lastY){
                      text += item.str;
                    } else {
                      text += '\n' + item.str;
                    }
                    lastY = item.transform[5];
                  }
                  pageText = text;
                  return text;
                });
              }
              return Promise.resolve('');
            }
          });
          if (pageText && pageText.trim()) {
            pageContext = cleanVietnameseText(pageText.trim());
          }
        } catch (e) {
          console.warn('Page text extract warning:', e);
        }
      }
    }

    if (!pageContext) {
      pageContext = `${targetSlide.title}\n${targetSlide.subtitle || ''}\n${targetSlide.content || ''}\n${targetSlide.callout_content || ''}`;
    }

    // Build prompt based on action
    let systemPrompt = `Bạn là trợ lý sư phạm AI cao cấp hỗ trợ Giảng viên trong buổi thuyết trình bài giảng.
Bài giảng: "${lecture.title}"
Môn học: "${lecture.subject}"
Slide hiện tại: Trang ${slideNumber}/${lecture.total_slides}
Nội dung trang slide:
"""
${pageContext}
"""

`;

    if (action === 'notes') {
      systemPrompt += `Nhiệm vụ: Hãy soạn "Gợi ý giảng dạy & Speaker Notes" cho giảng viên khi chiếu trang slide này:
1. 🎯 Điểm nhấn cốt lõi cần truyền đạt (2-3 gạch đầu dòng)
2. 💡 Câu hỏi tương tác / Tình huống gợi mở thảo luận cho lớp học
3. ⚠️ Lưu ý những điểm sinh viên hay hiểu sai hoặc cần giải thích kỹ.
Hãy trả về định dạng Markdown đẹp, chuyên nghiệp, tiếng Việt chuẩn 100%.`;
    } else if (action === 'summary') {
      systemPrompt += `Nhiệm vụ: Hãy tóm tắt 3 ý trọng tâm súc tích nhất của trang slide này cho sinh viên ghi nhớ nhanh. Trả về định dạng Markdown.`;
    } else if (action === 'explain') {
      systemPrompt += `Nhiệm vụ: Hãy giảng giải chi tiết, rõ ràng và trực quan về nội dung của trang slide này như một giáo sư tâm huyết. Có ví dụ thực tế minh họa. Trả về Markdown.`;
    } else if (action === 'quiz') {
      systemPrompt += `Nhiệm vụ: Hãy tạo 2 câu hỏi trắc nghiệm nhanh (4 lựa chọn A, B, C, D) dựa trên nội dung trang slide này để giảng viên đố nhanh cả lớp. Kèm theo đáp án đúng và lời giải thích ngắn gọn. Trả về Markdown.`;
    } else if (action === 'chat') {
      systemPrompt += `Nhiệm vụ: Trả lời câu hỏi sau của giảng viên/học sinh liên quan đến trang slide này:
"${userQuestion || 'Giải thích thêm về nội dung này'}"
Trả lời súc tích, dễ hiểu và chuyên sâu bằng Tiếng Việt chuẩn.`;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (geminiApiKey && !geminiApiKey.includes('your_') && !geminiApiKey.startsWith('AQ.')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(systemPrompt);
        return cleanVietnameseText(result.response.text());
      } catch (e) {
        console.error('Gemini Assist Error:', e);
      }
    }

    if (groqApiKey && !groqApiKey.includes('your_')) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        const comp = await groq.chat.completions.create({
          messages: [{ role: 'user', content: systemPrompt }],
          model: process.env.GROQ_CHAT_MODEL || 'groq/compound-mini',
          temperature: 0.5,
          max_tokens: 1500
        });
        const reply = comp.choices[0]?.message?.content || '';
        return cleanVietnameseText(reply);
      } catch (e) {
        console.error('Groq Assist Error:', e);
      }
    }

    return `### 💡 Gợi ý giảng dạy cho Trang ${slideNumber}:\n- Trình bày trực quan nội dung cốt lõi của bài học.\n- Đặt câu hỏi thảo luận cho người học để tăng tính tương tác.`;
  }
}

export const lectureService = new LectureService();
