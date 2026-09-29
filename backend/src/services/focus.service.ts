import { db } from '../db';
import { AppError } from '../utils/AppError';
import { streakService } from './streak.service';
import { getVietnamDateString } from '../utils/date.util';

export interface StartFocusParams {
  targetDurationSeconds?: number;
  documentId?: number | null;
  quizId?: number | null;
  learningGoalId?: number | null;
}

export interface RecordDistractionParams {
  eventType: 'TAB_SWITCH' | 'PAGE_BLUR' | 'PAGE_HIDDEN' | 'IDLE' | 'RETURNED';
  durationSeconds?: number;
  details?: Record<string, any>;
}

export interface FinishFocusParams {
  status: 'COMPLETED' | 'INTERRUPTED' | 'CANCELLED';
  actualDurationSeconds: number;
}

export class FocusService {
  /**
   * Bắt đầu một phiên tập trung (Focus Session).
   * Có 2 entry point: từ trang /focus hoặc từ Document Viewer / Quiz.
   */
  async startSession(userId: number, params: StartFocusParams) {
    const {
      targetDurationSeconds = 1500,
      documentId = null,
      quizId = null,
      learningGoalId = null,
    } = params;

    let subject: string | null = null;

    // 1. Kiểm tra tài liệu nếu được gắn vào
    if (documentId) {
      const docRes = await db.query(
        'SELECT id, user_id, title, category, visibility FROM documents WHERE id = $1',
        [documentId]
      );
      if (docRes.rows.length === 0) {
        throw new AppError('Tài liệu gắn vào phiên tập trung không tồn tại', 404);
      }
      const doc = docRes.rows[0];
      if (doc.user_id !== userId && doc.visibility !== 'public') {
        throw new AppError('Bạn không có quyền truy cập vào tài liệu riêng tư này', 403);
      }
      subject = doc.category || null;
    }

    // 2. Kiểm tra bộ đề nếu được gắn vào
    if (quizId) {
      const quizRes = await db.query(
        'SELECT id, name FROM test_sets WHERE id = $1',
        [quizId]
      );
      if (quizRes.rows.length === 0) {
        throw new AppError('Bộ đề thi gắn vào phiên tập trung không tồn tại', 404);
      }
    }

    // 3. Kiểm tra mục tiêu học tập nếu được gắn vào
    if (learningGoalId) {
      const goalRes = await db.query(
        'SELECT id, user_id, subject FROM learning_goals WHERE id = $1 AND user_id = $2',
        [learningGoalId, userId]
      );
      if (goalRes.rows.length === 0) {
        throw new AppError('Mục tiêu học tập không tồn tại hoặc không thuộc sở hữu của bạn', 404);
      }
      if (!subject && goalRes.rows[0].subject) {
        subject = goalRes.rows[0].subject;
      }
    }

    // 4. Nếu có phiên tập trung đang chạy dở dang, đánh dấu là INTERRUPTED trước khi mở phiên mới
    await db.query(
      `UPDATE study_sessions
       SET status = 'INTERRUPTED', ended_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'IN_PROGRESS'`,
      [userId]
    );

    // 5. Khởi tạo phiên tập trung mới
    const sessionRes = await db.query(
      `INSERT INTO study_sessions (
         user_id, document_id, quiz_id, learning_goal_id,
         target_duration_seconds, actual_duration_seconds, duration_seconds,
         status, started_at, distraction_count, focus_score
       )
       VALUES ($1, $2, $3, $4, $5, 0, 0, 'IN_PROGRESS', CURRENT_TIMESTAMP, 0, 100.00)
       RETURNING *`,
      [userId, documentId, quizId, learningGoalId, targetDurationSeconds]
    );

    return sessionRes.rows[0];
  }

  /**
   * Ghi nhận sự kiện mất tập trung từ các tín hiệu trình duyệt (Browser signals only).
   * Tuyệt đối không dùng Camera, Microphone hay AI cảm xúc.
   */
  async recordDistraction(userId: number, sessionId: number, params: RecordDistractionParams) {
    const { eventType, durationSeconds = 0, details = {} } = params;

    const sessionCheck = await db.query(
      'SELECT id, user_id, status, distraction_count FROM study_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new AppError('Phiên tập trung không tồn tại', 404);
    }

    const session = sessionCheck.rows[0];
    if (session.user_id !== userId) {
      throw new AppError('Bạn không có quyền thao tác trên phiên tập trung này', 403);
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new AppError('Phiên tập trung đã kết thúc, không thể ghi nhận thêm sự kiện', 400);
    }

    // Ghi nhận sự kiện vào bảng focus_distraction_events
    await db.query(
      `INSERT INTO focus_distraction_events (session_id, event_type, duration_seconds, details)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, eventType, durationSeconds, JSON.stringify(details)]
    );

    // Tăng distraction_count trong study_sessions
    const updateRes = await db.query(
      `UPDATE study_sessions
       SET distraction_count = distraction_count + 1
       WHERE id = $1
       RETURNING distraction_count`,
      [sessionId]
    );

    return {
      sessionId,
      eventType,
      distractionCount: updateRes.rows[0].distraction_count,
    };
  }

  /**
   * Ping tích lũy thời gian học tập trong phiên
   */
  async pingActive(userId: number, sessionId: number, seconds: number) {
    const sessionCheck = await db.query(
      'SELECT id, user_id, status FROM study_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0 || sessionCheck.rows[0].user_id !== userId) {
      throw new AppError('Phiên tập trung không tồn tại hoặc không có quyền', 404);
    }

    if (sessionCheck.rows[0].status !== 'IN_PROGRESS') {
      return { active_seconds: 0, status: sessionCheck.rows[0].status };
    }

    // Cập nhật actual_duration_seconds trong study_sessions
    await db.query(
      `UPDATE study_sessions
       SET actual_duration_seconds = actual_duration_seconds + $1,
           duration_seconds = duration_seconds + $1
       WHERE id = $2`,
      [seconds, sessionId]
    );

    // Đồng bộ user_daily_activity và user_study_dates
    const todayStr = getVietnamDateString(new Date());
    await db.query(
      `INSERT INTO user_daily_activity (user_id, activity_date, active_seconds)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, activity_date)
       DO UPDATE SET active_seconds = user_daily_activity.active_seconds + $3`,
      [userId, todayStr, seconds]
    );

    await db.query(
      `INSERT INTO user_study_dates (user_id, study_date)
       VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
       ON CONFLICT (user_id, study_date) DO NOTHING`,
      [userId]
    );

    return { active_seconds: seconds, status: 'IN_PROGRESS' };
  }

  /**
   * Kết thúc phiên tập trung (COMPLETED, INTERRUPTED, CANCELLED)
   * Tính toán Focus Score, tự động log vào learning_activities và cập nhật Streak.
   */
  async finishSession(userId: number, sessionId: number, params: FinishFocusParams) {
    const { status, actualDurationSeconds } = params;

    const sessionCheck = await db.query(
      `SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new AppError('Phiên tập trung không tồn tại hoặc không thuộc quyền sở hữu của bạn', 404);
    }

    const session = sessionCheck.rows[0];
    const targetDuration = session.target_duration_seconds || 1500;
    const finalActualDuration = Math.max(0, Math.round(actualDurationSeconds));
    const distractionCount = session.distraction_count || 0;

    // Tính toán Điểm tập trung (Focus Score): 0 - 100
    let focusScore = 100.0;
    if (status === 'CANCELLED') {
      focusScore = 0.0;
    } else {
      // Tỷ lệ hoàn thành thời gian: tối đa 100 điểm
      const timeRatio = Math.min(1.0, finalActualDuration / targetDuration);
      let baseScore = Math.round(timeRatio * 100);

      // Trừ điểm dựa trên số lần xao nhãng trình duyệt (mỗi lần trừ 5 điểm, tối đa trừ 40 điểm)
      const distractionPenalty = Math.min(40, distractionCount * 5);
      focusScore = Math.max(0, baseScore - distractionPenalty);
    }

    // 1. Cập nhật bảng study_sessions
    const updateRes = await db.query(
      `UPDATE study_sessions
       SET status = $1,
           actual_duration_seconds = $2,
           duration_seconds = $2,
           ended_at = CURRENT_TIMESTAMP,
           focus_score = $3
       WHERE id = $4
       RETURNING *`,
      [status, finalActualDuration, focusScore, sessionId]
    );

    const updatedSession = updateRes.rows[0];

    // 2. Tự động ghi nhận vào learning_activities nếu có thời gian tập trung thực tế
    if (finalActualDuration > 0 && status !== 'CANCELLED') {
      try {
        const entityType = session.document_id ? 'document' : (session.quiz_id ? 'test_set' : 'session');
        const entityId = session.document_id || session.quiz_id || sessionId;

        // 2.1. CHỐNG TÍNH TRÙNG THỜI GIAN (Deduplication between read_doc & focus_session):
        // Nếu user bắt đầu focus từ viewer cho tài liệu X, xóa/hủy các bản ghi read_doc bị trùng lặp
        // cho cùng tài liệu phát sinh trong thời gian phiên focus này đang chạy
        if (session.document_id) {
          await db.query(
            `DELETE FROM learning_activities
             WHERE user_id = $1
               AND activity_type = 'read_doc'
               AND entity_id = $2
               AND created_at >= $3`,
            [userId, session.document_id, session.started_at]
          );
        }

        await db.query(
          `INSERT INTO learning_activities (
             user_id, activity_type, entity_type, entity_id, duration_seconds, details, idempotency_key
           )
           VALUES ($1, 'focus_session', $2, $3, $4, $5, $6)
           ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`,
          [
            userId,
            entityType,
            entityId,
            finalActualDuration,
            JSON.stringify({
              sessionId,
              status,
              targetDuration,
              actualDuration: finalActualDuration,
              distractionCount,
              focusScore,
              documentId: session.document_id,
              quizId: session.quiz_id,
            }),
            `focus_session:${sessionId}`,
          ]
        );

        // Cập nhật ngày học theo múi giờ UTC+7
        await db.query(
          `INSERT INTO user_study_dates (user_id, study_date)
           VALUES ($1, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)
           ON CONFLICT (user_id, study_date) DO NOTHING`,
          [userId]
        );
      } catch (actErr) {
        console.warn('Focus session auto-log non-fatal error:', actErr);
      }
    }

    // 3. Tính toán streak mới nhất
    const streakInfo = await streakService.calculateUserStreak(userId);

    // 4. Trả về kết quả tổng kết (Focus Summary)
    return {
      session: updatedSession,
      summary: {
        sessionId,
        status,
        targetDurationSeconds: targetDuration,
        actualFocusSeconds: finalActualDuration,
        actualFocusMinutes: Math.round(finalActualDuration / 60),
        distractionCount,
        focusScore,
        streak: streakInfo.currentStreak,
        documentId: session.document_id,
        quizId: session.quiz_id,
        learningGoalId: session.learning_goal_id,
      },
    };
  }

  /**
   * Đánh dấu ngắt quãng phiên tập trung tức thì (dành cho pagehide/beforeunload hoặc sendBeacon khi đóng tab)
   */
  async interruptSession(sessionId: number, userId: number, actualDurationSeconds?: number) {
    const sessionCheck = await db.query(
      `SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new AppError('Phiên tập trung không tồn tại hoặc không thuộc quyền sở hữu của bạn', 404);
    }

    const session = sessionCheck.rows[0];
    if (session.status !== 'IN_PROGRESS') {
      return { session, message: 'Phiên đã kết thúc trước đó' };
    }

    // Ghi nhận sự kiện xao nhãng PAGE_HIDDEN do đóng tab/rời trang
    await db.query(
      `INSERT INTO focus_distraction_events (session_id, event_type, occurred_at, details)
       VALUES ($1, 'PAGE_HIDDEN', CURRENT_TIMESTAMP, $2)`,
      [sessionId, JSON.stringify({ reason: 'beacon_unload_interrupt' })]
    );

    const duration = actualDurationSeconds !== undefined
      ? Math.max(session.actual_duration_seconds || 0, Math.round(actualDurationSeconds))
      : (session.actual_duration_seconds || 0);

    return this.finishSession(userId, sessionId, {
      status: 'INTERRUPTED',
      actualDurationSeconds: duration,
    });
  }

  /**
   * Lấy phiên tập trung đang chạy dở dang (nếu có)
   */
  async getActiveSession(userId: number) {
    const res = await db.query(
      `SELECT ss.*, d.title as document_title, ts.name as quiz_title
       FROM study_sessions ss
       LEFT JOIN documents d ON ss.document_id = d.id
       LEFT JOIN test_sets ts ON ss.quiz_id = ts.id
       WHERE ss.user_id = $1 AND ss.status = 'IN_PROGRESS'
       ORDER BY ss.started_at DESC
       LIMIT 1`,
      [userId]
    );

    return res.rows[0] || null;
  }

  /**
   * Lấy báo cáo chi tiết tổng kết phiên tập trung
   */
  async getSessionSummary(userId: number, sessionId: number) {
    const sessionRes = await db.query(
      `SELECT ss.*, d.title as document_title, ts.name as quiz_title
       FROM study_sessions ss
       LEFT JOIN documents d ON ss.document_id = d.id
       LEFT JOIN test_sets ts ON ss.quiz_id = ts.id
       WHERE ss.id = $1 AND ss.user_id = $2`,
      [sessionId, userId]
    );

    if (sessionRes.rows.length === 0) {
      throw new AppError('Phiên tập trung không tồn tại', 404);
    }

    const session = sessionRes.rows[0];

    const eventsRes = await db.query(
      `SELECT * FROM focus_distraction_events WHERE session_id = $1 ORDER BY occurred_at ASC`,
      [sessionId]
    );

    return {
      session,
      events: eventsRes.rows,
      summary: {
        sessionId,
        status: session.status,
        targetDurationSeconds: session.target_duration_seconds,
        actualFocusSeconds: session.actual_duration_seconds,
        actualFocusMinutes: Math.round(session.actual_duration_seconds / 60),
        distractionCount: session.distraction_count,
        focusScore: Number(session.focus_score),
        documentTitle: session.document_title,
        quizTitle: session.quiz_title,
      },
    };
  }
}

export const focusService = new FocusService();
