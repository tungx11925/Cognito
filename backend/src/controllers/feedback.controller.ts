import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';

export const submitFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, category, comment, user_name, user_email, page_url } = req.body;
    const userId = req.user?.id || null;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Đánh giá sao phải từ 1 đến 5 sao.' });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return res.status(400).json({ error: 'Nội dung nhận xét tối thiểu 3 ký tự.' });
    }

    let resolvedName = user_name?.trim() || null;
    let resolvedEmail = user_email?.trim() || null;

    if (userId) {
      const userRes = await db.query('SELECT name, email FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        resolvedName = resolvedName || userRes.rows[0].name;
        resolvedEmail = resolvedEmail || userRes.rows[0].email;
      }
    }

    const result = await db.query(
      `INSERT INTO user_feedbacks (user_id, user_name, user_email, rating, category, comment, page_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [
        userId,
        resolvedName || 'Người dùng ẩn danh',
        resolvedEmail || null,
        Math.round(rating),
        category?.trim() || 'Giao diện & Trải nghiệm',
        comment.trim(),
        page_url?.substring(0, 500) || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã đóng góp ý kiến giúp Cognito ngày càng hoàn thiện!',
      feedbackId: result.rows[0].id
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminFeedbacks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const feedbacksQuery = await db.query(
      `SELECT 
         f.id,
         f.user_id,
         f.user_name,
         f.user_email,
         f.rating,
         f.category,
         f.comment,
         f.page_url,
         f.created_at,
         u.name AS account_username,
         u.avatar_url
       FROM user_feedbacks f
       LEFT JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC`
    );

    const feedbacks = feedbacksQuery.rows;
    const totalFeedbacks = feedbacks.length;

    let averageRating = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const categoryCounts: Record<string, number> = {};

    if (totalFeedbacks > 0) {
      let sum = 0;
      let positiveCount = 0;
      for (const item of feedbacks) {
        const r = Number(item.rating) || 5;
        sum += r;
        distribution[r] = (distribution[r] || 0) + 1;
        if (r >= 4) positiveCount++;

        const cat = item.category || 'Khác';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
      averageRating = Number((sum / totalFeedbacks).toFixed(1));
    }

    const satisfactionRate = totalFeedbacks > 0
      ? Math.round(((distribution[4] + distribution[5]) / totalFeedbacks) * 100)
      : 100;

    return res.status(200).json({
      success: true,
      stats: {
        totalFeedbacks,
        averageRating,
        satisfactionRate,
        distribution,
        categoryCounts
      },
      feedbacks
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM user_feedbacks WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Đã xóa phản hồi thành công.' });
  } catch (error) {
    next(error);
  }
};
