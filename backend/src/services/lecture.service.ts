import { db } from '../db';
import { AppError } from '../utils/AppError';
import { parserService } from './parser.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

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
    return res.rows;
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
      slides: slidesRes.rows
    };
  }

  /**
   * Upload file and auto-generate slide deck with chapters
   */
  async createLectureFromFile(userId: number, fileBuffer: Buffer, originalname: string, title?: string, subject?: string) {
    let extractedText = '';
    const ext = originalname.split('.').pop()?.toLowerCase();
    let mimetype = 'application/octet-stream';
    if (ext === 'pdf') mimetype = 'application/pdf';
    else if (ext === 'docx' || ext === 'doc') mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === 'txt' || ext === 'md') mimetype = 'text/plain';

    extractedText = await parserService.parseFromBuffer(fileBuffer, mimetype);

    const lectureTitle = title || originalname.replace(/\.[^/.]+$/, '');
    const lectureSubject = subject || 'Khoa học tổng hợp';

    // Generate Chapters & Slides via Gemini or Groq
    let generatedSlides: any[] = [];
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    const prompt = `Bạn là chuyên gia thiết kế bài giảng sư phạm cao cấp. Hãy đọc kỹ tài liệu sau và chuyển đổi thành một bộ Slide bài giảng trình chiếu chuyên nghiệp cho Giảng viên.

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

    if (geminiApiKey && !geminiApiKey.includes('your_')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
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
          temperature: 0.5,
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
      INSERT INTO lectures (user_id, title, description, subject, chapter_count, total_slides, cover_color)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      userId,
      lectureTitle,
      `Bài giảng tạo từ file ${originalname}`,
      lectureSubject,
      distinctChapters || 1,
      generatedSlides.length,
      '#0A1128'
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
        s.chapter_title || `Chapter ${s.chapter_index || 1}`,
        s.title || `Slide ${i + 1}`,
        s.subtitle || '',
        s.content || '',
        s.callout_type || 'takeaway',
        s.callout_title || 'Lưu ý',
        s.callout_content || '',
        s.speaker_notes || ''
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
}

export const lectureService = new LectureService();
