import { db } from '../db';
import { AppError } from '../utils/AppError';
import { sendWarningEmail } from '../utils/mailer';
import {
  ReportContentInput,
  ModerationActionInput,
  ModerationReportsQuery,
} from '../schemas/safety.schema';
import { notificationService } from './notification.service';

export class SafetyService {
  /**
   * 1. BLOCK USER SYSTEM
   */
  async blockUser(blockerId: number, targetUserId: number, reason?: string) {
    if (blockerId === targetUserId) {
      throw new AppError('Bạn không thể tự chặn tài khoản của chính mình', 400);
    }

    const targetCheck = await db.query('SELECT id, role, name FROM users WHERE id = $1', [targetUserId]);
    if (targetCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy người dùng cần chặn', 404);
    }

    if (targetCheck.rows[0].role === 'admin') {
      throw new AppError('Không thể chặn tài khoản Quản trị viên hệ thống', 400);
    }

    await db.query(
      `INSERT INTO user_blocks (blocker_id, blocked_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, targetUserId, reason || null]
    );

    return { success: true, message: `Đã chặn người dùng ${targetCheck.rows[0].name}` };
  }

  async unblockUser(blockerId: number, targetUserId: number) {
    const res = await db.query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING id',
      [blockerId, targetUserId]
    );

    if (res.rows.length === 0) {
      throw new AppError('Người dùng này không nằm trong danh sách chặn của bạn', 404);
    }

    return { success: true, message: 'Đã bỏ chặn người dùng thành công' };
  }

  async getBlockedUsers(blockerId: number) {
    const res = await db.query(
      `SELECT ub.id as block_id, ub.blocked_id, ub.reason, ub.created_at,
              u.name, u.avatar_url, u.email
       FROM user_blocks ub
       JOIN users u ON u.id = ub.blocked_id
       WHERE ub.blocker_id = $1
       ORDER BY ub.created_at DESC`,
      [blockerId]
    );
    return res.rows;
  }

  async hasBlockRelationship(userId1: number, userId2: number): Promise<boolean> {
    if (!userId1 || !userId2 || userId1 === userId2) return false;
    const res = await db.query(
      `SELECT 1 FROM user_blocks 
       WHERE (blocker_id = $1 AND blocked_id = $2) 
          OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userId1, userId2]
    );
    return res.rows.length > 0;
  }

  /**
   * 2. RATE LIMIT & ANTI-SPAM PROTECTION
   */
  async checkPublishRateLimit(userId: number) {
    // Max 5 publishes in last 10 minutes
    const res = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM community_resources 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '10 minutes'`,
      [userId]
    );
    if (res.rows[0]?.count >= 5) {
      throw new AppError(
        'Bạn đã đăng quá nhiều tài nguyên trong 10 phút qua (tối đa 5 bài/10 phút). Vui lòng thử lại sau.',
        429
      );
    }
  }

  async checkCommentSpamAndRateLimit(userId: number, resourceId: number, content: string) {
    // 1. Cooldown check: minimum 3 seconds between comments
    const lastComment = await db.query(
      `SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) as diff_sec FROM community_comments 
       WHERE user_id = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (lastComment.rows.length > 0) {
      const diffSec = Number(lastComment.rows[0].diff_sec);
      if (diffSec < 3) {
        throw new AppError('Vui lòng đợi ít nhất 3 giây trước khi gửi bình luận tiếp theo.', 429);
      }
    }

    // 2. Frequency limit: max 15 comments per 5 minutes
    const recentCount = await db.query(
      `SELECT COUNT(*)::int as count FROM community_comments 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '5 minutes'`,
      [userId]
    );
    if (recentCount.rows[0]?.count >= 15) {
      throw new AppError('Bạn đã gửi quá nhiều bình luận. Vui lòng tạm nghỉ trong vài phút.', 429);
    }

    // 3. Duplicate content check: exact duplicate on same resource within 60s
    const duplicate = await db.query(
      `SELECT id FROM community_comments 
       WHERE user_id = $1 AND resource_id = $2 AND content = $3 AND created_at >= NOW() - INTERVAL '60 seconds'
       LIMIT 1`,
      [userId, resourceId, content.trim()]
    );
    if (duplicate.rows.length > 0) {
      throw new AppError('Bình luận trùng lặp. Vui lòng không gửi liên tục cùng một nội dung.', 400);
    }
  }

  async checkReportRateLimit(userId: number) {
    // Max 10 reports in last 10 minutes
    const res = await db.query(
      `SELECT COUNT(*)::int as count 
       FROM content_reports 
       WHERE reporter_id = $1 AND created_at >= NOW() - INTERVAL '10 minutes'`,
      [userId]
    );
    if (res.rows[0]?.count >= 10) {
      throw new AppError('Bạn đã gửi quá nhiều báo cáo trong thời gian ngắn. Vui lòng thử lại sau.', 429);
    }
  }

  /**
   * 3. CONTENT REPORTING SYSTEM
   */
  async reportContent(reporterId: number, input: ReportContentInput) {
    await this.checkReportRateLimit(reporterId);

    let targetAuthorId: number | null = null;
    let targetTitle: string = '';

    // Verify target existence and self-reporting
    if (input.targetType === 'resource') {
      const res = await db.query('SELECT user_id, title FROM community_resources WHERE id = $1', [input.targetId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy tài nguyên để báo cáo', 404);
      targetAuthorId = res.rows[0].user_id;
      targetTitle = res.rows[0].title;
      if (targetAuthorId === reporterId) {
        throw new AppError('Bạn không thể tự tố cáo bài đăng của chính mình', 400);
      }
    } else if (input.targetType === 'comment') {
      const res = await db.query('SELECT user_id, content FROM community_comments WHERE id = $1', [input.targetId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy bình luận để báo cáo', 404);
      targetAuthorId = res.rows[0].user_id;
      targetTitle = res.rows[0].content.substring(0, 50);
      if (targetAuthorId === reporterId) {
        throw new AppError('Bạn không thể tự tố cáo bình luận của chính mình', 400);
      }
    } else if (input.targetType === 'user') {
      const res = await db.query('SELECT id, name FROM users WHERE id = $1', [input.targetId]);
      if (res.rows.length === 0) throw new AppError('Không tìm thấy người dùng để báo cáo', 404);
      targetAuthorId = res.rows[0].id;
      targetTitle = res.rows[0].name;
      if (targetAuthorId === reporterId) {
        throw new AppError('Bạn không thể tự tố cáo chính bản thân mình', 400);
      }
    } else if (input.targetType === 'message') {
      const res = await db.query(
        `SELECT m.id, m.sender_id, m.content, m.conversation_id 
         FROM messages m 
         WHERE m.id = $1`,
        [input.targetId]
      );
      if (res.rows.length === 0) throw new AppError('Không tìm thấy tin nhắn để báo cáo', 404);
      targetAuthorId = res.rows[0].sender_id;
      targetTitle = res.rows[0].content.substring(0, 50);
      if (targetAuthorId === reporterId) {
        throw new AppError('Bạn không thể tự tố cáo tin nhắn của chính mình', 400);
      }

      // IDOR Protection: Reporter MUST be a participant/member in the conversation
      const convMemberCheck = await db.query(
        `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2 LIMIT 1`,
        [res.rows[0].conversation_id, reporterId]
      );
      if (convMemberCheck.rows.length === 0) {
        throw new AppError('Bạn không có quyền báo cáo tin nhắn trong cuộc trò chuyện mà bạn không tham gia', 403);
      }
    }

    // Check duplicate pending report
    const existing = await db.query(
      `SELECT id FROM content_reports 
       WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND status = 'PENDING'`,
      [reporterId, input.targetType, input.targetId]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Bạn đã gửi một báo cáo cho nội dung này và đang chờ quản trị viên xử lý', 400);
    }

    // Insert Report
    const insertRes = await db.query(
      `INSERT INTO content_reports (
        reporter_id, target_type, target_id, reason, details, status
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *`,
      [reporterId, input.targetType, input.targetId, input.reason, input.details?.trim() || null]
    );

    // GAP-05: Chống brigading (tấn công ẩn bài bằng acc ảo mới tạo).
    // Chỉ tính điều kiện auto-hide cho báo cáo từ tài khoản có tuổi đời tối thiểu
    // (Mặc định: 24h trên Production hoặc theo biến môi trường MIN_REPORTER_AGE_HOURS; 0h trong môi trường test/dev).
    const minAgeHours = process.env.MIN_REPORTER_AGE_HOURS !== undefined
      ? Number(process.env.MIN_REPORTER_AGE_HOURS)
      : (process.env.NODE_ENV === 'production' ? 24 : 0);

    let isEligibleForAutoHide = true;
    if (minAgeHours > 0) {
      const matureUserCheck = await db.query(
        `SELECT id FROM users 
         WHERE id = $1 AND created_at <= CURRENT_TIMESTAMP - ($2 || ' hours')::interval`,
        [reporterId, minAgeHours]
      );
      if (matureUserCheck.rows.length === 0) {
        isEligibleForAutoHide = false;
      }
    }

    // Increment report counter on target and auto-hide if report_count + 1 >= 5 and reporter is eligible
    if (input.targetType === 'resource') {
      const updateRes = await db.query(
        `UPDATE community_resources 
         SET report_count = report_count + 1,
             is_hidden = CASE WHEN (report_count + 1 >= 5 AND $2::boolean = true) THEN true ELSE is_hidden END,
             is_public = CASE WHEN (report_count + 1 >= 5 AND $2::boolean = true) THEN false ELSE is_public END
         WHERE id = $1
         RETURNING resource_type, resource_id, is_reshare, is_hidden`,
        [input.targetId, isEligibleForAutoHide]
      );
      if (updateRes.rows.length > 0 && updateRes.rows[0].is_hidden) {
        const { resource_type, resource_id, is_reshare } = updateRes.rows[0];
        if (!is_reshare && resource_type === 'document') {
          await db.query(
            `UPDATE documents SET is_community_published = false WHERE id = $1`,
            [resource_id]
          );
        }
      }
    } else if (input.targetType === 'comment') {
      await db.query(
        `UPDATE community_comments 
         SET report_count = report_count + 1,
             is_hidden = CASE WHEN (report_count + 1 >= 5 AND $2::boolean = true) THEN true ELSE is_hidden END
         WHERE id = $1`,
        [input.targetId, isEligibleForAutoHide]
      );
    }

    return {
      message: 'Báo cáo của bạn đã được ghi nhận. Đội ngũ kiểm duyệt sẽ xử lý trong thời gian sớm nhất.',
      report: insertRes.rows[0],
    };
  }

  async getUserReports(reporterId: number) {
    const res = await db.query(
      `SELECT cr.*, 
              CASE 
                WHEN cr.target_type = 'resource' THEN (SELECT title FROM community_resources WHERE id = cr.target_id)
                WHEN cr.target_type = 'comment' THEN (SELECT content FROM community_comments WHERE id = cr.target_id)
                WHEN cr.target_type = 'user' THEN (SELECT name FROM users WHERE id = cr.target_id)
              END as target_title
       FROM content_reports cr
       WHERE cr.reporter_id = $1
       ORDER BY cr.created_at DESC`,
      [reporterId]
    );
    return res.rows;
  }

  /**
   * 4. ADMIN MODERATION WORKFLOW
   * Actions: KEEP, HIDE, REMOVE, WARN, SUSPEND
   */
  async listReports(query: ModerationReportsQuery) {
    const { status, targetType, page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;

    const params: any[] = [];
    let whereClauses: string[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      whereClauses.push(`cr.status = $${params.length}`);
    }

    if (targetType && targetType !== 'ALL') {
      params.push(targetType);
      whereClauses.push(`cr.target_type = $${params.length}`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*)::int as total FROM content_reports cr ${whereSQL}`;
    const countRes = await db.query(countQuery, params);
    const total = countRes.rows[0]?.total || 0;

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataQuery = `
      SELECT 
        cr.*,
        u_rep.name as reporter_name,
        u_rep.email as reporter_email,
        u_adm.name as reviewer_name,
        CASE 
          WHEN cr.target_type = 'resource' THEN (
            SELECT json_build_object(
              'title', c_res.title,
              'author_id', c_res.user_id,
              'author_name', u_author.name,
              'author_email', u_author.email,
              'is_hidden', c_res.is_hidden,
              'report_count', c_res.report_count
            )
            FROM community_resources c_res
            JOIN users u_author ON u_author.id = c_res.user_id
            WHERE c_res.id = cr.target_id
          )
          WHEN cr.target_type = 'comment' THEN (
            SELECT json_build_object(
              'content', c_comm.content,
              'author_id', c_comm.user_id,
              'author_name', u_author.name,
              'author_email', u_author.email,
              'is_hidden', c_comm.is_hidden,
              'report_count', c_comm.report_count
            )
            FROM community_comments c_comm
            JOIN users u_author ON u_author.id = c_comm.user_id
            WHERE c_comm.id = cr.target_id
          )
          WHEN cr.target_type = 'user' THEN (
            SELECT json_build_object(
              'name', u_target.name,
              'email', u_target.email,
              'is_suspended', u_target.is_suspended,
              'warning_count', u_target.warning_count
            )
            FROM users u_target
            WHERE u_target.id = cr.target_id
          )
        END as target_details
      FROM content_reports cr
      JOIN users u_rep ON u_rep.id = cr.reporter_id
      LEFT JOIN users u_adm ON u_adm.id = cr.reviewed_by
      ${whereSQL}
      ORDER BY cr.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await db.query(dataQuery, params);

    return {
      reports: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async applyModerationAction(adminId: number, reportId: number, input: ModerationActionInput) {
    const reportRes = await db.query('SELECT * FROM content_reports WHERE id = $1', [reportId]);
    if (reportRes.rows.length === 0) {
      throw new AppError('Không tìm thấy báo cáo vi phạm', 404);
    }

    const report = reportRes.rows[0];
    const { action, reason, notes } = input;

    let targetUserId: number | null = null;

    // 1. Determine target author
    if (report.target_type === 'resource') {
      const res = await db.query('SELECT user_id FROM community_resources WHERE id = $1', [report.target_id]);
      if (res.rows.length > 0) targetUserId = res.rows[0].user_id;
    } else if (report.target_type === 'comment') {
      const res = await db.query('SELECT user_id FROM community_comments WHERE id = $1', [report.target_id]);
      if (res.rows.length > 0) targetUserId = res.rows[0].user_id;
    } else if (report.target_type === 'user') {
      targetUserId = report.target_id;
    }

    let reportNewStatus = 'RESOLVED';

    // 2. Execute Action
    switch (action) {
      case 'KEEP':
        // No violation found, dismiss report
        reportNewStatus = 'DISMISSED';
        break;

      case 'HIDE':
        // Soft hide content from feed & public lists and sync with original resource
        if (report.target_type === 'resource') {
          const commRes = await db.query(
            'SELECT resource_type, resource_id, is_reshare FROM community_resources WHERE id = $1',
            [report.target_id]
          );
          if (commRes.rows.length > 0) {
            const { resource_type, resource_id, is_reshare } = commRes.rows[0];
            await db.query(
              `UPDATE community_resources SET is_hidden = true, is_public = false WHERE id = $1`,
              [report.target_id]
            );
            if (!is_reshare && resource_type === 'document') {
              await db.query(
                `UPDATE documents SET is_community_published = false WHERE id = $1`,
                [resource_id]
              );
            }
          }
        } else if (report.target_type === 'comment') {
          await db.query(
            `UPDATE community_comments SET is_hidden = true WHERE id = $1`,
            [report.target_id]
          );
        }
        break;

      case 'REMOVE':
        // Permanently remove content from Community ONLY (NEVER deletes original assets in documents/test_sets)
        if (report.target_type === 'resource') {
          const commRes = await db.query(
            'SELECT resource_type, resource_id, is_reshare FROM community_resources WHERE id = $1',
            [report.target_id]
          );
          if (commRes.rows.length > 0) {
            const { resource_type, resource_id, is_reshare } = commRes.rows[0];
            // 1. Delete from community_resources only
            await db.query('DELETE FROM community_resources WHERE id = $1', [report.target_id]);
            // 2. Sync is_community_published = false on primary document
            if (!is_reshare && resource_type === 'document') {
              await db.query(
                `UPDATE documents SET is_community_published = false WHERE id = $1`,
                [resource_id]
              );
            }
          }
        } else if (report.target_type === 'comment') {
          const commRes = await db.query(
            'SELECT resource_id FROM community_comments WHERE id = $1',
            [report.target_id]
          );
          if (commRes.rows.length > 0) {
            const resId = commRes.rows[0].resource_id;
            await db.query('DELETE FROM community_comments WHERE id = $1', [report.target_id]);
            // Decrement comment_count on the target resource
            await db.query(
              'UPDATE community_resources SET comment_count = GREATEST(0, comment_count - 1) WHERE id = $1',
              [resId]
            );
          }
        }
        break;

      case 'WARN':
        if (targetUserId) {
          await db.query(
            `UPDATE users 
             SET warning_count = warning_count + 1, status = 'WARNED' 
             WHERE id = $1`,
            [targetUserId]
          );
          // Send warning email in background
          const authorRes = await db.query('SELECT email, name FROM users WHERE id = $1', [targetUserId]);
          if (authorRes.rows.length > 0) {
            sendWarningEmail(authorRes.rows[0].email, authorRes.rows[0].name, reason).catch((err: any) =>
              console.error('Warning email error:', err)
            );
          }
        }
        break;

      case 'SUSPEND':
        if (targetUserId) {
          // 1. Suspend user account
          await db.query(
            `UPDATE users 
             SET is_suspended = true, status = 'SUSPENDED', suspension_reason = $1 
             WHERE id = $2`,
            [reason, targetUserId]
          );
          // 2. Sync is_community_published = false on all this user's primary published documents
          await db.query(
            `UPDATE documents SET is_community_published = false 
             WHERE id IN (
               SELECT resource_id FROM community_resources 
               WHERE user_id = $1 AND resource_type = 'document' AND is_reshare = false
             )`,
            [targetUserId]
          );
          // 3. Hide all published community resources by this user
          await db.query(
            `UPDATE community_resources 
             SET is_hidden = true, is_public = false 
             WHERE user_id = $1`,
            [targetUserId]
          );
          // 4. Hide all comments posted by this user
          await db.query(
            `UPDATE community_comments 
             SET is_hidden = true 
             WHERE user_id = $1`,
            [targetUserId]
          );
        }
        break;
    }

    // 3. Update Report
    const updatedReportRes = await db.query(
      `UPDATE content_reports 
       SET status = $1, action_taken = $2, reviewed_by = $3, reviewed_at = NOW(), moderation_notes = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [reportNewStatus, action, adminId, notes?.trim() || null, reportId]
    );

    // 4. Log into Moderation History
    const logRes = await db.query(
      `INSERT INTO moderation_logs (
        admin_id, action, target_type, target_id, report_id, reason, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [adminId, action, report.target_type, report.target_id, reportId, reason, notes?.trim() || null]
    );

    // 5. Trigger Notifications
    try {
      // A. Notify reporter
      if (report.reporter_id) {
        await notificationService.createNotification({
          userId: report.reporter_id,
          type: 'report_resolved',
          title: 'Báo cáo vi phạm đã được xử lý',
          content: `Báo cáo của bạn về nội dung vi phạm đã được Ban Quản trị xử lý (Hành động: ${action}).`,
          link: '/community',
        });
      }

      // B. Notify target author/user if applicable
      if (targetUserId) {
        if (action === 'REMOVE' || action === 'HIDE') {
          await notificationService.createNotification({
            userId: targetUserId,
            type: 'resource_removed',
            title: 'Nội dung bị gỡ bỏ hoặc ẩn',
            content: `Nội dung của bạn đã bị gỡ bỏ/ẩn do vi phạm tiêu chuẩn cộng đồng: ${reason || 'Vi phạm chính sách'}`,
            link: '/community',
          });
        } else if (action === 'WARN') {
          await notificationService.createNotification({
            userId: targetUserId,
            type: 'account_warned',
            title: 'Cảnh báo vi phạm tiêu chuẩn cộng đồng',
            content: `Bạn nhận được cảnh báo từ Ban Quản trị: ${reason || 'Vi phạm quy tắc cộng đồng'}`,
            link: '/profile',
          });
        } else if (action === 'SUSPEND') {
          await notificationService.createNotification({
            userId: targetUserId,
            type: 'account_suspended',
            title: 'Tài khoản bị đình chỉ',
            content: `Tài khoản của bạn đã bị tạm khóa do vi phạm: ${reason || 'Vi phạm nghiêm trọng quy tắc cộng đồng'}`,
            link: '/profile',
          });
        }
      }
    } catch (err) {
      console.error('Error creating moderation notifications:', err);
    }

    return {
      success: true,
      message: `Đã thực hiện hành động ${action} thành công`,
      report: updatedReportRes.rows[0],
      log: logRes.rows[0],
    };
  }

  async listModerationHistory(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const countRes = await db.query('SELECT COUNT(*)::int as total FROM moderation_logs');
    const total = countRes.rows[0]?.total || 0;

    const result = await db.query(
      `SELECT ml.*, u_adm.name as admin_name, u_adm.email as admin_email
       FROM moderation_logs ml
       JOIN users u_adm ON u_adm.id = ml.admin_id
       ORDER BY ml.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      history: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async suspendUserDirect(adminId: number, targetUserId: number, reason: string, notes?: string) {
    const userCheck = await db.query('SELECT id, name, role FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }
    if (userCheck.rows[0].role === 'admin') {
      throw new AppError('Không thể đình chỉ tài khoản Quản trị viên', 400);
    }

    // 1. Suspend user
    await db.query(
      `UPDATE users 
       SET is_suspended = true, status = 'SUSPENDED', suspension_reason = $1 
       WHERE id = $2`,
      [reason, targetUserId]
    );

    // 2. Sync is_community_published = false on all this user's primary published documents
    await db.query(
      `UPDATE documents SET is_community_published = false 
       WHERE id IN (
         SELECT resource_id FROM community_resources 
         WHERE user_id = $1 AND resource_type = 'document' AND is_reshare = false
       )`,
      [targetUserId]
    );

    // 3. Hide all published community resources
    await db.query(
      `UPDATE community_resources 
       SET is_hidden = true, is_public = false 
       WHERE user_id = $1`,
      [targetUserId]
    );

    // 4. Hide all comments posted by this user
    await db.query(
      `UPDATE community_comments 
       SET is_hidden = true 
       WHERE user_id = $1`,
      [targetUserId]
    );

    await db.query(
      `INSERT INTO moderation_logs (admin_id, action, target_type, target_id, reason, notes)
       VALUES ($1, 'SUSPEND', 'user', $2, $3, $4)`,
      [adminId, targetUserId, reason, notes || null]
    );

    // Notify suspended user
    try {
      await notificationService.createNotification({
        userId: targetUserId,
        type: 'account_suspended',
        title: 'Tài khoản bị đình chỉ',
        content: `Tài khoản của bạn đã bị tạm khóa: ${reason}`,
        link: '/profile',
      });
    } catch (err) {
      console.error('Error creating suspension notification:', err);
    }

    return { success: true, message: `Đã đình chỉ tài khoản ${userCheck.rows[0].name}` };
  }

  async unsuspendUserDirect(adminId: number, targetUserId: number) {
    const userCheck = await db.query('SELECT id, name FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    await db.query(
      `UPDATE users 
       SET is_suspended = false, status = 'ACTIVE', suspension_reason = NULL 
       WHERE id = $1`,
      [targetUserId]
    );

    await db.query(
      `INSERT INTO moderation_logs (admin_id, action, target_type, target_id, reason, notes)
       VALUES ($1, 'KEEP', 'user', $2, 'Khôi phục tài khoản người dùng', NULL)`,
      [adminId, targetUserId]
    );

    return { success: true, message: `Đã khôi phục tài khoản ${userCheck.rows[0].name}` };
  }

  async getModerationStats() {
    const [pendingReports, hiddenResources, suspendedUsers, totalLogs] = await Promise.all([
      db.query("SELECT COUNT(*)::int as count FROM content_reports WHERE status = 'PENDING'"),
      db.query('SELECT COUNT(*)::int as count FROM community_resources WHERE is_hidden = true'),
      db.query('SELECT COUNT(*)::int as count FROM users WHERE is_suspended = true'),
      db.query("SELECT COUNT(*)::int as count FROM moderation_logs WHERE created_at >= NOW() - INTERVAL '30 days'"),
    ]);

    return {
      pendingReports: pendingReports.rows[0]?.count || 0,
      pendingReportsCount: pendingReports.rows[0]?.count || 0,
      hiddenResources: hiddenResources.rows[0]?.count || 0,
      hiddenResourcesCount: hiddenResources.rows[0]?.count || 0,
      suspendedUsers: suspendedUsers.rows[0]?.count || 0,
      suspendedUsersCount: suspendedUsers.rows[0]?.count || 0,
      recentActions: totalLogs.rows[0]?.count || 0,
      recentActionsCount: totalLogs.rows[0]?.count || 0,
    };
  }
}

export const safetyService = new SafetyService();
