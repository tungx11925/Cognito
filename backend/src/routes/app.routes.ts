import { Router, Request, Response } from 'express';
import { db } from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Groq from 'groq-sdk';
// @ts-ignore
import mammoth from 'mammoth';
import multer from 'multer';
const pdfParse = require('pdf-parse');
import xlsx from 'xlsx';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
const router = Router();

export function getVietnamDateString(date: Date): string {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to update the user's daily study streak using user_study_dates database table
export async function updateUserStreak(userId: number) {
  try {
    const today = new Date();
    const todayStr = getVietnamDateString(today);

    // 1. Log today's study date into user_study_dates (prevents duplicates via ON CONFLICT)
    await db.query(
      'INSERT INTO user_study_dates (user_id, study_date) VALUES ($1, $2) ON CONFLICT (user_id, study_date) DO NOTHING',
      [userId, todayStr]
    );

    // 2. Fetch all study dates of the user to calculate the consecutive streak in VN timezone
    const datesRes = await db.query(
      'SELECT study_date FROM user_study_dates WHERE user_id = $1 ORDER BY study_date DESC',
      [userId]
    );

    const dates: string[] = datesRes.rows.map(row => {
      const d = new Date(row.study_date);
      return getVietnamDateString(d);
    });

    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getVietnamDateString(yesterday);

    let streak = 0;
    let checkDate = new Date(); // Start checking from today

    if (!dates.includes(todayStr)) {
      if (dates.includes(yesterdayStr)) {
        checkDate = yesterday;
      } else {
        // No study today or yesterday
        await db.query('UPDATE users SET streak = 0 WHERE id = $1', [userId]);
        return 0;
      }
    }

    while (true) {
      const checkStr = getVietnamDateString(checkDate);
      if (dates.includes(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 3. Cache the calculated streak back in the user record
    await db.query(
      'UPDATE users SET streak = $1, last_study_date = CURRENT_TIMESTAMP WHERE id = $2',
      [streak, userId]
    );

    return streak;
  } catch (error) {
    console.error('Error in updateUserStreak:', error);
    return 0;
  }
}


export async function getOrCreateDailyTasks(userId: number) {
  try {
    const todayStr = getVietnamDateString(new Date());
    
    // Check if today's tasks already exist
    const checkRes = await db.query(
      'SELECT * FROM user_daily_tasks WHERE user_id = $1 AND activity_date = $2',
      [userId, todayStr]
    );
    
    if (checkRes.rows.length > 0) {
      return checkRes.rows;
    }
    
    // Insert default tasks
    const defaultTasks = [
      {
        type: 'study_flashcards',
        title: 'Ôn tập Flashcards',
        description: 'Luyện tập ôn tập ít nhất 5 thẻ ghi nhớ trong ngày hôm nay.',
        target: 5
      },
      {
        type: 'read_document',
        title: 'Đọc tài liệu',
        description: 'Mở xem hoặc tải lên đọc ít nhất 1 tài liệu học tập.',
        target: 1
      },
      {
        type: 'practice_quiz',
        title: 'Luyện tập AI Quiz',
        description: 'Hoàn thành ít nhất 1 bộ trắc nghiệm tạo bởi AI trợ lý.',
        target: 1
      },
      {
        type: 'study_time',
        title: 'Thời gian học tập',
        description: 'Tích lũy tối thiểu 5 phút hoạt động học tập trên hệ thống.',
        target: 300
      }
    ];
    
    const insertedTasks = [];
    for (const task of defaultTasks) {
      try {
        const res = await db.query(
          `INSERT INTO user_daily_tasks (user_id, activity_date, task_type, title, description, target_value, current_value, completed, is_notified)
           VALUES ($1, $2, $3, $4, $5, $6, 0, false, false)
           ON CONFLICT (user_id, activity_date, task_type) DO NOTHING
           RETURNING *`,
          [userId, todayStr, task.type, task.title, task.description, task.target]
        );
        if (res.rows[0]) {
          insertedTasks.push(res.rows[0]);
        }
      } catch (err) {
        console.error('Error inserting default task:', err);
      }
    }
    
    // Re-fetch in case ON CONFLICT triggered DO NOTHING
    if (insertedTasks.length === 0) {
      const finalRes = await db.query(
        'SELECT * FROM user_daily_tasks WHERE user_id = $1 AND activity_date = $2',
        [userId, todayStr]
      );
      return finalRes.rows;
    }
    
    return insertedTasks;
  } catch (error) {
    console.error('Error in getOrCreateDailyTasks:', error);
    return [];
  }
}

export async function incrementTaskProgress(userId: number, taskType: string, incrementValue: number) {
  try {
    const todayStr = getVietnamDateString(new Date());
    
    // First, ensure tasks exist for today
    await getOrCreateDailyTasks(userId);
    
    // Increment the progress
    const res = await db.query(
      `UPDATE user_daily_tasks
       SET current_value = LEAST(current_value + $1, target_value)
       WHERE user_id = $2 AND activity_date = $3 AND task_type = $4
       RETURNING *`,
      [incrementValue, userId, todayStr, taskType]
    );
    
    if (res.rows.length > 0) {
      const task = res.rows[0];
      // If completed, update completed
      if (task.current_value >= task.target_value && !task.completed) {
        const completedRes = await db.query(
          `UPDATE user_daily_tasks
           SET completed = true
           WHERE id = $1
           RETURNING *`,
          [task.id]
        );
        return { task: completedRes.rows[0], justCompleted: true };
      }
      return { task, justCompleted: false };
    }
  } catch (error) {
    console.error('Error in incrementTaskProgress:', error);
  }
  return null;
}


// ==========================================
// TASKS & FRIENDS ENDPOINTS
// ==========================================

// Get all tasks for today
router.get('/tasks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const tasks = await getOrCreateDailyTasks(userId);
    res.status(200).json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update progress of a task manually (e.g. from quiz)
router.post('/tasks/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { task_type, increment } = req.body;
    const userId = req.user!.id;
    
    const result = await incrementTaskProgress(userId, task_type, increment || 1);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get connected friends
router.get('/friends', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.education, u.address, u.avatar_url, u.streak
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'accepted'
       ORDER BY u.name ASC`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get another user's public/restricted profile
router.get('/users/:targetUserId/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const viewerId = req.user!.id;
    const targetUserId = parseInt(req.params.targetUserId, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Mã người dùng không hợp lệ' });
    }

    // Fetch target user info
    const userResult = await db.query(
      'SELECT id, name, email, phone, education, address, website, created_at, avatar_url, streak, privacy_setting FROM users WHERE id = $1',
      [targetUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const targetUser = userResult.rows[0];

    // Determine access allowance
    let isAllowed = false;
    if (viewerId === targetUserId) {
      isAllowed = true;
    } else if (targetUser.privacy_setting === 'public') {
      isAllowed = true;
    } else if (targetUser.privacy_setting === 'friends') {
      // Check if they are accepted friends
      const friendshipResult = await db.query(
        `SELECT 1 FROM friendships 
         WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
         AND status = 'accepted'`,
        [viewerId, targetUserId]
      );
      if (friendshipResult.rows.length > 0) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return res.status(200).json({
        isRestricted: true,
        privacy: targetUser.privacy_setting,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          avatar_url: targetUser.avatar_url,
          privacy_setting: targetUser.privacy_setting
        }
      });
    }

    // Full profile retrieval
    // 1. Study dates
    const studyDatesResult = await db.query(
      'SELECT study_date FROM user_study_dates WHERE user_id = $1 ORDER BY study_date ASC',
      [targetUserId]
    );
    const studyDates = studyDatesResult.rows.map(row => row.study_date);

    // 2. Public flashcard decks
    const decksResult = await db.query(
      'SELECT * FROM flashcard_decks WHERE user_id = $1 AND is_public = true ORDER BY created_at DESC',
      [targetUserId]
    );

    // 3. Documents
    const documentsResult = await db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [targetUserId]
    );

    // 4. Friends list (only accepted friends, excluding themselves)
    const friendsResult = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.education, u.address, u.avatar_url, u.streak
       FROM friendships f
       JOIN users u ON (f.friend_id = u.id AND f.user_id = $1) OR (f.user_id = u.id AND f.friend_id = $1)
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted' AND u.id != $1
       ORDER BY u.name ASC`,
      [targetUserId]
    );

    return res.status(200).json({
      isRestricted: false,
      user: {
        ...targetUser,
        study_dates: studyDates,
        friends: friendsResult.rows,
        decks: decksResult.rows,
        documents: documentsResult.rows
      }
    });

  } catch (error: any) {
    console.error('Error fetching target user profile:', error);
    return res.status(500).json({ error: error.message });
  }
});


// ==========================================
// DOCUMENTS ENDPOINTS
// ==========================================

// Get all documents
router.get('/documents', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await db.query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID
router.get('/documents/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Log study activity and update streak
    await updateUserStreak(userId);
    await incrementTaskProgress(userId, 'read_document', 1);
    
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create document
router.post('/documents', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, doc_url, solution_text, solution_url, category } = req.body;
    const userId = req.user!.id;

    const result = await db.query(
      `INSERT INTO documents (user_id, title, description, doc_url, solution_text, solution_url, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, title, description || '', doc_url || '', solution_text || '', solution_url || '', category || 'Khác']
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update document (Rename / Edit)
router.put('/documents/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, description, category } = req.body;

    // Check ownership before updating
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    if (docCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa tài liệu này hoặc tài liệu không tồn tại' });
    }

    const result = await db.query(
      `UPDATE documents 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           category = COALESCE($3, category) 
       WHERE id = $4 AND user_id = $5 
       RETURNING *`,
      [title, description, category, id, userId]
    );

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/documents/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership before deleting
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    if (docCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa tài liệu này hoặc tài liệu không tồn tại' });
    }

    await db.query('DELETE FROM documents WHERE id = $1', [id]);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// STUDY SESSIONS ENDPOINTS
// ==========================================

router.get('/study-sessions/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    // Get aggregate statistics
    const totalTimeResult = await db.query('SELECT SUM(duration_seconds) as total_seconds FROM study_sessions WHERE user_id = $1', [userId]);
    const sessionsCountResult = await db.query('SELECT COUNT(*) as count FROM study_sessions WHERE user_id = $1', [userId]);
    const documentCountResult = await db.query('SELECT COUNT(*) as count FROM documents WHERE user_id = $1', [userId]);
    const flashcardsCountResult = await db.query(
      `SELECT COUNT(*) as count FROM flashcards f
       JOIN flashcard_decks d ON f.deck_id = d.id
       WHERE d.user_id = $1`, [userId]
    );
    const userRes = await db.query('SELECT streak FROM users WHERE id = $1', [userId]);
    const streak = userRes.rows[0]?.streak || 0;
    
    // Additional real-time stats
    const totalReviewsResult = await db.query(
      `SELECT COALESCE(SUM(repetitions), 0) as count FROM flashcards f
       JOIN flashcard_decks d ON f.deck_id = d.id
       WHERE d.user_id = $1`, [userId]
    );
    const totalNotesResult = await db.query('SELECT COUNT(*) as count FROM notes WHERE user_id = $1', [userId]);
    
    // Past 7 days calculation in VN timezone from user_daily_activity table
    const chartData = [];
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() + 7 * 60 * 60 * 1000); // VN time (UTC+7)
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      
      const activityRes = await db.query(
        'SELECT active_seconds FROM user_daily_activity WHERE user_id = $1 AND activity_date = $2',
        [userId, dateStr]
      );
      
      const activeSeconds = activityRes.rows[0]?.active_seconds || 0;
      const minutes = Math.round(activeSeconds / 60);
      const dayName = dayNames[d.getUTCDay()];
      
      chartData.push({
        day: dayName,
        minutes: minutes
      });
    }

    res.status(200).json({
      total_study_minutes: Math.round(Number(totalTimeResult.rows[0].total_seconds || 0) / 60),
      total_sessions: Number(sessionsCountResult.rows[0].count || 0),
      total_documents: Number(documentCountResult.rows[0].count || 0),
      total_flashcards: Number(flashcardsCountResult.rows[0].count || 0),
      streak: streak,
      total_reviews: Number(totalReviewsResult.rows[0].count || 0),
      total_notes: Number(totalNotesResult.rows[0].count || 0),
      chart_data: chartData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/study-sessions/active-ping', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { seconds } = req.body;
    const userId = req.user!.id;
    
    if (!seconds || typeof seconds !== 'number' || seconds <= 0) {
      return res.status(400).json({ error: 'Số giây không hợp lệ' });
    }

    // Determine VN timezone date (UTC+7)
    const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    const result = await db.query(
      `INSERT INTO user_daily_activity (user_id, activity_date, active_seconds)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, activity_date)
       DO UPDATE SET active_seconds = user_daily_activity.active_seconds + $3
       RETURNING active_seconds`,
      [userId, dateStr, seconds]
    );

    const taskResult = await incrementTaskProgress(userId, 'study_time', seconds);

    res.status(200).json({ 
      active_seconds: result.rows[0].active_seconds,
      task_update: taskResult 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/study-sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { document_id, duration_seconds } = req.body;
    const userId = req.user!.id;
    const result = await db.query(
      'INSERT INTO study_sessions (user_id, document_id, duration_seconds) VALUES ($1, $2, $3) RETURNING *',
      [userId, document_id, duration_seconds]
    );
    const updatedStreak = await updateUserStreak(userId);
    res.status(201).json({ ...result.rows[0], updated_streak: updatedStreak });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// NOTES ENDPOINTS
// ==========================================

// Get notes by document ID
router.get('/notes/document/:docId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { docId } = req.params;
    const userId = req.user!.id;

    // Ensure document belongs to user
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [docId, userId]);
    if (docCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      'SELECT * FROM notes WHERE document_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [docId, userId]
    );
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upsert note (creates if not exists, updates if exists)
router.post('/notes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { document_id, title, content } = req.body;
    const userId = req.user!.id;

    // Ensure document belongs to user
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1 AND user_id = $2', [document_id, userId]);
    if (docCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if a note already exists for this document and user
    const checkExist = await db.query(
      'SELECT id FROM notes WHERE user_id = $1 AND document_id = $2',
      [userId, document_id]
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
        [userId, document_id, title || 'Ghi chú học tập', content]
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
router.get('/flashcards/decks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await db.query('SELECT * FROM flashcard_decks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single deck by ID
router.get('/flashcards/decks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM flashcard_decks WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ bài' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get flashcards in a deck
router.get('/flashcards/decks/:deckId/cards', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deckId } = req.params;
    const userId = req.user!.id;

    // Ensure the deck belongs to this user
    const deckCheck = await db.query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deckId, userId]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại' });
    }

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
router.get('/flashcards/decks/:deckId/review', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deckId } = req.params;
    const userId = req.user!.id;

    // Ensure the deck belongs to this user
    const deckCheck = await db.query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deckId, userId]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại' });
    }

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
router.post('/flashcards/decks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, is_public } = req.body;
    const userId = req.user!.id;
    const result = await db.query(
      'INSERT INTO flashcard_decks (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, name, description || '', is_public || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a deck (Rename, Update description, or set Public/Private)
router.put('/flashcards/decks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, is_public } = req.body;

    const deckCheck = await db.query('SELECT * FROM flashcard_decks WHERE id = $1', [id]);
    if (deckCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ bài' });
    }

    const currentDeck = deckCheck.rows[0];
    const newName = name !== undefined ? name : currentDeck.name;
    const newDesc = description !== undefined ? description : currentDeck.description;
    const newIsPublic = is_public !== undefined ? is_public : currentDeck.is_public;

    const result = await db.query(
      'UPDATE flashcard_decks SET name = $1, description = $2, is_public = $3 WHERE id = $4 RETURNING *',
      [newName, newDesc, newIsPublic, id]
    );
    
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a deck
router.delete('/flashcards/decks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM flashcard_decks WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bộ bài để xóa' });
    }
    res.status(200).json({ message: 'Đã xóa bộ bài thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a flashcard
router.post('/flashcards', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deck_id, document_id, front, back } = req.body;
    const userId = req.user!.id;

    if (!front || !back || front.trim() === '' || back.trim() === '') {
      return res.status(400).json({ error: 'Nội dung Front và Back không được để trống' });
    }

    // Ensure the deck belongs to this user
    const deckCheck = await db.query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deck_id, userId]);
    if (deckCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại' });
    }
    const result = await db.query(
      'INSERT INTO flashcards (deck_id, document_id, front, back) VALUES ($1, $2, $3, $4) RETURNING *',
      [deck_id, document_id || null, front, back]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a flashcard
router.put('/flashcards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { front, back } = req.body;
    
    if (!front || !back || front.trim() === '' || back.trim() === '') {
      return res.status(400).json({ error: 'Nội dung Front và Back không được để trống' });
    }

    const result = await db.query(
      'UPDATE flashcards SET front = $1, back = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [front, back, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard không tồn tại' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a flashcard
router.delete('/flashcards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM flashcards WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard không tồn tại' });
    }
    
    res.status(200).json({ message: 'Đã xóa thẻ thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle star status of a flashcard
router.put('/flashcards/:id/star', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_starred } = req.body;
    
    const result = await db.query(
      'UPDATE flashcards SET is_starred = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_starred, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard không tồn tại' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all public decks for the Community Library
router.get('/flashcards/community/decks', async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT d.*, u.username as author_name, u.avatar_url,
             (SELECT COUNT(*) FROM flashcards WHERE deck_id = d.id) as card_count,
             (SELECT COUNT(*) FROM flashcard_decks WHERE forked_from_id = d.id) as fork_count
      FROM flashcard_decks d
      JOIN users u ON d.user_id = u.id
      WHERE d.is_public = true
      ORDER BY d.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fork a public or purchased deck
router.post('/flashcards/decks/:deckId/fork', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deckId } = req.params;
    const userId = req.user!.id;
    
    // Check if deck exists
    const deckResult = await db.query('SELECT * FROM card_decks WHERE id = $1', [deckId]);
    if (deckResult.rows.length === 0) {
      // Fallback check old table name if user used flashcard_decks
      const fallbackCheck = await db.query('SELECT * FROM flashcard_decks WHERE id = $1', [deckId]);
      if (fallbackCheck.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy bộ thẻ' });
      deckResult.rows = fallbackCheck.rows;
    }
    
    const originalDeck = deckResult.rows[0];
    
    // Authorization logic
    let isAuthorized = false;
    
    // 1. Is owner
    if (originalDeck.user_id === userId) isAuthorized = true;
    
    // 2. Is public and free
    if (originalDeck.visibility === 'public' && (originalDeck.price === 0 || originalDeck.price === null)) isAuthorized = true;
    if (originalDeck.is_public && (originalDeck.price === 0 || originalDeck.price === null)) isAuthorized = true; // backward compat
    
    // 3. Has purchased
    if (!isAuthorized) {
      const purchaseCheck = await db.query(
        'SELECT id FROM purchased_resources WHERE user_id = $1 AND deck_id = $2',
        [userId, deckId]
      );
      if (purchaseCheck.rows.length > 0) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Bạn cần mở khóa bộ thẻ này trên chợ cộng đồng trước khi sao chép' });
    }
    
    // Create new deck
    // Note: use the correct table name based on what's available
    const insertTable = originalDeck.visibility !== undefined ? 'card_decks' : 'flashcard_decks';
    
    const newDeckResult = await db.query(
      `INSERT INTO ${insertTable} (user_id, name, description, forked_from_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, originalDeck.name || originalDeck.title + ' (Copy)', originalDeck.description, deckId]
    );
    const newDeck = newDeckResult.rows[0];
    
    // Copy cards
    const cardsResult = await db.query('SELECT * FROM flashcards WHERE deck_id = $1', [deckId]);
    for (let card of cardsResult.rows) {
      await db.query(
        'INSERT INTO flashcards (deck_id, front, back) VALUES ($1, $2, $3)',
        [newDeck.id, card.front, card.back]
      );
    }
    
    res.status(201).json(newDeck);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Match game leaderboard
router.get('/flashcards/decks/:deckId/match-leaderboard', async (req: Request, res: Response) => {
  try {
    const { deckId } = req.params;
    const result = await db.query(`
      SELECT m.id, m.time_ms, m.played_at, u.name, u.avatar_url 
      FROM match_game_leaderboards m
      JOIN users u ON m.user_id = u.id
      WHERE m.deck_id = $1
      ORDER BY m.time_ms ASC
      LIMIT 5
    `, [deckId]);
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/flashcards/decks/:deckId/match-leaderboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { deckId } = req.params;
    const { time_ms } = req.body;
    const userId = req.user!.id;
    
    const result = await db.query(
      'INSERT INTO match_game_leaderboards (deck_id, user_id, time_ms) VALUES ($1, $2, $3) RETURNING *',
      [deckId, userId, time_ms]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Review flashcard (Spaced Repetition Algorithm)
router.post('/flashcards/review/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { difficulty } = req.body; // 'easy', 'good', 'hard'
    const userId = req.user!.id;
    
    // Fetch the flashcard and verify ownership
    const cardResult = await db.query(
      `SELECT f.* FROM flashcards f 
       JOIN flashcard_decks d ON f.deck_id = d.id 
       WHERE f.id = $1 AND d.user_id = $2`, 
      [id, userId]
    );
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flashcard not found or access denied' });
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

    const updatedStreak = await updateUserStreak(userId);
    const taskResult = await incrementTaskProgress(userId, 'study_flashcards', 1);
    
    res.status(200).json({
      message: 'Flashcard reviewed successfully',
      card: updateResult.rows[0],
      next_review_days: interval_days,
      updated_streak: updatedStreak,
      task_update: taskResult
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// AI ASSISTANT ENDPOINTS (Gemini AI Integration / Premium Simulation)
// ==========================================

// Chat with AI about document
router.post('/ai/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { document_id, message, history } = req.body;
    const userId = req.user!.id;
    
    // Fetch document to extract context and verify ownership
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [document_id, userId]);
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
router.post('/ai/generate-quiz', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { document_id } = req.body;
    const userId = req.user!.id;
    
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [document_id, userId]);
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
router.post('/ai/generate-flashcards', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { document_id, deck_id } = req.body;
    const userId = req.user!.id;
    
    const docResult = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [document_id, userId]);
    const document = docResult.rows[0];
    
    if (deck_id) {
      const deckCheck = await db.query('SELECT id FROM flashcard_decks WHERE id = $1 AND user_id = $2', [deck_id, userId]);
      if (deckCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập bộ thẻ này hoặc bộ thẻ không tồn tại' });
      }
    }
    
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

// AI automatically generates flashcards from note content
router.post('/ai/generate-flashcards-from-note', async (req: Request, res: Response) => {
  try {
    const { note_content, deck_id, document_id } = req.body;
    
    if (!note_content || note_content.trim() === '') {
      return res.status(400).json({ error: 'Nội dung ghi chú không được để trống.' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    let cards: {front: string, back: string}[] = [];

    // Prompt for generating flashcards with Universal Standardization
    const prompt = `Bạn là một chuyên gia giáo dục thiết kế thẻ ghi nhớ (Flashcards). Nhiệm vụ của bạn là đọc đoạn văn bản dưới đây và trích xuất ra các cặp thông tin quan trọng nhất để làm Flashcard.

QUY TẮC CHUẨN HOÁ (Áp dụng cho TẤT CẢ các môn học và ngành nghề):
Cho dù đoạn văn bản có lộn xộn hay không rõ ràng, hãy cố gắng bóc tách các ý chính thành dạng Thẻ (Front - Back).
- "front": [Từ khóa / Khái niệm / Câu hỏi ngắn / Tên riêng / Công thức]
- "back": [Định nghĩa / Giải thích súc tích / Ý nghĩa] + [Ví dụ thực tế / Ứng dụng nếu có].

MỘT SỐ VÍ DỤ CHUẨN:
- {"front": "Học máy (Machine Learning)", "back": "Là lĩnh vực AI cho phép hệ thống tự học từ dữ liệu. VD: Phân loại email rác."}
- {"front": "Đạo hàm của sin(x)", "back": "Là cos(x). VD: Tính vận tốc từ phương trình ly độ."}
- {"front": "Lạm phát (Inflation)", "back": "Sự tăng mức giá chung của hàng hóa/dịch vụ theo thời gian."}

YÊU CẦU BẮT BUỘC:
- Nếu văn bản quá ngắn, hãy suy luận để tạo ra ít nhất 1-2 thẻ hợp lý nhất có thể.
- Chỉ trả về ĐÚNG MỘT MẢNG JSON thuần túy (không chứa markdown, không có \`\`\`json).
- Object bên trong mảng chỉ được phép có 2 trường "front" và "back".

Văn bản cần xử lý:
"""
${note_content}
"""`;

    if (groqApiKey && !groqApiKey.includes('your_')) {
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
      });
      const responseText = completion.choices[0]?.message?.content || "[]";
      try {
        let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIdx = cleaned.indexOf('[');
        const endIdx = cleaned.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleaned = cleaned.substring(startIdx, endIdx + 1);
        } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
          cleaned = `[${cleaned}]`; // Wrap single object
        }
        cards = JSON.parse(cleaned);
      } catch (e) {
        console.error("Groq JSON Parse Error:", e, responseText);
      }
    } else if (geminiApiKey && !geminiApiKey.includes('your_')) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      try {
        let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIdx = cleaned.indexOf('[');
        const endIdx = cleaned.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          cleaned = cleaned.substring(startIdx, endIdx + 1);
        } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
          cleaned = `[${cleaned}]`; // Wrap single object
        }
        cards = JSON.parse(cleaned);
      } catch (e) {
        console.error("Gemini JSON Parse Error:", e, responseText);
      }
    } else {
      // Fallback if no API key
      cards = [
        { front: "Làm thế nào để tạo flashcard thực sự từ ghi chú?", back: "Bạn cần cung cấp GROQ_API_KEY hoặc GEMINI_API_KEY trong file .env" },
        { front: "Mẫu câu hỏi (Mock)", back: "Đây là câu trả lời mẫu do hệ thống không có AI Key." }
      ];
    }
    
    // Normalize keys just in case AI returns 'Front' or 'question' instead of 'front'
    cards = cards.map((c: any) => ({
      front: c.front || c.Front || c.question || c.Question || c.q || 'Không có câu hỏi',
      back: c.back || c.Back || c.answer || c.Answer || c.a || 'Không có câu trả lời',
    }));

    const insertedCards = [];
    if (deck_id && cards.length > 0) {
      for (const card of cards) {
        const insertRes = await db.query(
          'INSERT INTO flashcards (deck_id, document_id, front, back) VALUES ($1, $2, $3, $4) RETURNING *',
          [deck_id, document_id || null, card.front, card.back]
        );
        insertedCards.push(insertRes.rows[0]);
      }
    }
    
    res.status(201).json({
      message: deck_id ? `Đã tạo và thêm ${cards.length} thẻ vào bộ bài!` : 'Tạo thẻ thành công!',
      cards: deck_id ? insertedCards : cards
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AI FLASHCARD LAB ENDPOINT
// ==========================================
const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validMimes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (validMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Định dạng không được hỗ trợ.'));
  }
});

router.post('/ai/generate-flashcards-from-file', uploadMem.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn file' });

    let extractedText = '';
    const { mimetype, buffer } = req.file;

    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ buffer: buffer });
      extractedText = data.value;
    } else if (mimetype === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else if (mimetype.includes('spreadsheetml') || mimetype.includes('excel') || mimetype === 'text/csv') {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      extractedText = xlsx.utils.sheet_to_csv(sheet);
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Không tìm thấy chữ trong tài liệu này.' });
    }

    const truncatedText = extractedText.substring(0, 20000);

    const systemPrompt = `Bạn là một chuyên gia học thuật. Hãy đọc đoạn văn bản sau đây và trích xuất ra các khái niệm quan trọng nhất để tạo thành bộ thẻ Flashcard ghi nhớ. 
Yêu cầu đầu ra BẮT BUỘC phải là một mảng JSON có cấu trúc chính xác như sau, không được chứa thêm bất kỳ đoạn text giải thích nào khác bên ngoài JSON, KHÔNG BỌC TRONG \`\`\`json:
[
  { "front": "Thuật ngữ hoặc câu hỏi ngắn bằng ngôn ngữ gốc của tài liệu", "back": "Định nghĩa hoặc câu trả lời chi tiết bằng Tiếng Việt hoặc cùng ngôn ngữ" }
]`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `NỘI DUNG TÀI LIỆU:\n${truncatedText}` }
      ],
      model: "llama-3.3-70b-versatile", // Use latest supported Groq model
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    const cleanedJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
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
});

export default router;
