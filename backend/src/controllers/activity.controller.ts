import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { activityService } from '../services/activity.service';
import { profileService } from '../services/profile.service';
import { sseService } from '../utils/sse.service';

export const getTasks = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const tasks = await activityService.getOrCreateDailyTasks(userId);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export const updateTaskProgress = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { task_type, increment } = req.body;
    const userId = req.user!.id;
    
    const result = await activityService.incrementTaskProgress(userId, task_type, increment || 1);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFriends = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const userId = req.user!.id;
    const friends = await profileService.getFriends(userId);
    res.status(200).json(friends);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const viewerId = req.user!.id;
    const targetUserId = parseInt(req.params.targetUserId, 10);
    
    const profile = await profileService.getTargetUserProfile(viewerId, targetUserId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REAL-TIME NOTIFICATIONS (SSE)
// ==========================================

// Real-time Server-Sent Events stream for tasks, streak & live notifications
export const streamNotifications = async (req: Request, res: Response) => {
  let token = req.headers.authorization?.split(' ')[1] || (req.query.token as string);
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing token for SSE' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here') as any;
    const userId = decoded.id;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    sseService.addClient(userId, res);

    req.on('close', () => {
      sseService.removeClient(res);
    });
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// ==========================================
// SYSTEM-WIDE LEADERBOARD
// ==========================================
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { category = 'streak', period = 'weekly', limit = 50 } = req.query;
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));

    // Optional auth extraction to identify current user's rank
    let currentUserId: number | null = null;
    let authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'your_64_character_secret_key_here') as any;
        currentUserId = decoded.id;
      } catch {}
    }

    let items: any[] = [];

    if (category === 'study_time') {
      let dateFilter = '';
      if (period === 'weekly') {
        dateFilter = "AND uda.activity_date >= CURRENT_DATE - INTERVAL '7 days'";
      } else if (period === 'monthly') {
        dateFilter = "AND uda.activity_date >= CURRENT_DATE - INTERVAL '30 days'";
      }

      const query = `
        SELECT 
          u.id, 
          u.name, 
          u.avatar_url, 
          u.role, 
          u.streak,
          u.created_at,
          COALESCE(SUM(uda.active_seconds), 0)::int as score_seconds,
          ROUND(COALESCE(SUM(uda.active_seconds), 0) / 60.0, 1)::float as score_minutes
        FROM users u
        LEFT JOIN user_daily_activity uda ON u.id = uda.user_id ${dateFilter}
        WHERE u.privacy_setting != 'private'
        GROUP BY u.id, u.name, u.avatar_url, u.role, u.streak, u.created_at
        ORDER BY score_seconds DESC, u.streak DESC, u.id ASC
        LIMIT $1
      `;
      const result = await db.query(query, [limitNum]);
      items = result.rows.map((row, idx) => ({
        rank: idx + 1,
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url,
        role: row.role,
        streak: row.streak,
        score: row.score_minutes,
        unit: 'phút',
        isCurrentUser: currentUserId === row.id
      }));
    } else if (category === 'quiz') {
      let dateFilterTasks = '';
      let dateFilterTestSets = '';
      if (period === 'weekly') {
        dateFilterTasks = "AND activity_date >= CURRENT_DATE - INTERVAL '7 days'";
        dateFilterTestSets = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
      } else if (period === 'monthly') {
        dateFilterTasks = "AND activity_date >= CURRENT_DATE - INTERVAL '30 days'";
        dateFilterTestSets = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
      }

      const query = `
        SELECT 
          u.id, 
          u.name, 
          u.avatar_url, 
          u.role, 
          u.streak,
          u.created_at,
          (
            COALESCE((SELECT COUNT(*) * 50 FROM user_daily_tasks WHERE user_id = u.id AND completed = true ${dateFilterTasks}), 0) +
            COALESCE((SELECT COUNT(*) * 100 FROM test_sets WHERE created_by = u.id ${dateFilterTestSets}), 0) +
            COALESCE((SELECT COUNT(*) * 10 FROM flashcards f JOIN flashcard_decks d ON f.deck_id = d.id WHERE d.user_id = u.id), 0)
          )::int as score,
          COALESCE((SELECT COUNT(*) FROM user_daily_tasks WHERE user_id = u.id AND completed = true ${dateFilterTasks}), 0)::int as tasks_completed,
          COALESCE((SELECT COUNT(*) FROM test_sets WHERE created_by = u.id ${dateFilterTestSets}), 0)::int as test_sets_count
        FROM users u
        WHERE u.privacy_setting != 'private'
        ORDER BY score DESC, u.streak DESC, u.id ASC
        LIMIT $1
      `;
      const result = await db.query(query, [limitNum]);
      items = result.rows.map((row, idx) => ({
        rank: idx + 1,
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url,
        role: row.role,
        streak: row.streak,
        score: row.score,
        unit: 'điểm',
        tasks_completed: row.tasks_completed,
        test_sets_count: row.test_sets_count,
        isCurrentUser: currentUserId === row.id
      }));
    } else {
      // Default: 'streak'
      let dateFilterStudyDates = '';
      let dateFilterActivity = '';
      if (period === 'weekly') {
        dateFilterStudyDates = "AND study_date >= CURRENT_DATE - INTERVAL '7 days'";
        dateFilterActivity = "AND activity_date >= CURRENT_DATE - INTERVAL '7 days'";
      } else if (period === 'monthly') {
        dateFilterStudyDates = "AND study_date >= CURRENT_DATE - INTERVAL '30 days'";
        dateFilterActivity = "AND activity_date >= CURRENT_DATE - INTERVAL '30 days'";
      }

      const query = `
        SELECT 
          u.id, 
          u.name, 
          u.avatar_url, 
          u.role, 
          u.streak,
          u.created_at,
          COALESCE((SELECT COUNT(*) FROM user_study_dates WHERE user_id = u.id ${dateFilterStudyDates}), 0)::int as total_days_studied,
          COALESCE((SELECT SUM(active_seconds) FROM user_daily_activity WHERE user_id = u.id ${dateFilterActivity}), 0)::int as total_active_seconds
        FROM users u
        WHERE u.privacy_setting != 'private'
        ORDER BY u.streak DESC, total_days_studied DESC, u.id ASC
        LIMIT $1
      `;
      const result = await db.query(query, [limitNum]);
      items = result.rows.map((row, idx) => ({
        rank: idx + 1,
        id: row.id,
        name: row.name,
        avatar_url: row.avatar_url,
        role: row.role,
        streak: row.streak,
        score: row.streak,
        unit: 'ngày',
        total_days_studied: row.total_days_studied,
        isCurrentUser: currentUserId === row.id
      }));
    }

    // Find current user's entry in items or compute their rank
    let currentUserRank = items.find(item => item.isCurrentUser) || null;
    if (!currentUserRank && currentUserId) {
      const userRes = await db.query('SELECT id, name, avatar_url, role, streak FROM users WHERE id = $1', [currentUserId]);
      if (userRes.rows[0]) {
        const u = userRes.rows[0];
        currentUserRank = {
          rank: 99,
          id: u.id,
          name: u.name,
          avatar_url: u.avatar_url,
          role: u.role,
          streak: u.streak,
          score: category === 'study_time' ? 0 : u.streak,
          unit: category === 'study_time' ? 'phút' : (category === 'quiz' ? 'điểm' : 'ngày'),
          isCurrentUser: true
        };
      }
    }

    res.status(200).json({
      category,
      period,
      totalParticipants: items.length,
      leaderboard: items,
      currentUserRank
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
};
