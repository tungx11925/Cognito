import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { safetyService } from '../services/safety.service';
import {
  reportContentSchema,
  blockUserSchema,
  moderationActionSchema,
  moderationReportsQuerySchema,
} from '../schemas/safety.schema';

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.id;
    const targetUserId = Number(req.params.userId);
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID người dùng không hợp lệ' });
    }
    const validatedBody = blockUserSchema.parse(req.body);
    const result = await safetyService.blockUser(blockerId, targetUserId, validatedBody.reason);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError' || error.issues) {
      const msg = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Dữ liệu không hợp lệ';
      return res.status(400).json({ error: msg });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi chặn người dùng' });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.id;
    const targetUserId = Number(req.params.userId);
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({ error: 'ID người dùng không hợp lệ' });
    }
    const result = await safetyService.unblockUser(blockerId, targetUserId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi bỏ chặn người dùng' });
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const blockerId = req.user!.id;
    const blockedUsers = await safetyService.getBlockedUsers(blockerId);
    return res.status(200).json({ blocks: blockedUsers, blockedUsers });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lấy danh sách chặn' });
  }
};

export const reportContent = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user!.id;
    const validatedBody = reportContentSchema.parse(req.body);
    const result = await safetyService.reportContent(reporterId, validatedBody);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError' || error.issues) {
      const msg = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Dữ liệu báo cáo không hợp lệ';
      return res.status(400).json({ error: msg });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khi gửi báo cáo' });
  }
};

export const getUserReports = async (req: AuthRequest, res: Response) => {
  try {
    const reporterId = req.user!.id;
    const reports = await safetyService.getUserReports(reporterId);
    return res.status(200).json({ reports });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi lấy danh sách báo cáo' });
  }
};

/**
 * ADMIN CONTROLLERS
 */
export const getModerationReports = async (req: AuthRequest, res: Response) => {
  try {
    const validatedQuery = moderationReportsQuerySchema.parse(req.query);
    const result = await safetyService.listReports(validatedQuery);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError' || error.issues) {
      const msg = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Dữ liệu truy vấn không hợp lệ';
      return res.status(400).json({ error: msg });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi tải danh sách báo cáo' });
  }
};

export const applyModerationAction = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const reportId = Number(req.params.id);
    if (!reportId || isNaN(reportId)) {
      return res.status(400).json({ error: 'ID báo cáo không hợp lệ' });
    }
    const validatedBody = moderationActionSchema.parse(req.body);
    const result = await safetyService.applyModerationAction(adminId, reportId, validatedBody);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError' || error.issues) {
      const msg = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Dữ liệu xử lý không hợp lệ';
      return res.status(400).json({ error: msg });
    }
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi xử lý kiểm duyệt' });
  }
};

export const getModerationHistory = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await safetyService.listModerationHistory(page, limit);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi tải lịch sử kiểm duyệt' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const targetUserId = Number(req.params.id);
    const { reason, notes } = req.body;
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ error: 'Lý do đình chỉ phải có ít nhất 3 ký tự' });
    }
    const result = await safetyService.suspendUserDirect(adminId, targetUserId, reason.trim(), notes);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi đình chỉ người dùng' });
  }
};

export const unsuspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const targetUserId = Number(req.params.id);
    const result = await safetyService.unsuspendUserDirect(adminId, targetUserId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi khôi phục người dùng' });
  }
};

export const getModerationStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await safetyService.getModerationStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi tải thống kê kiểm duyệt' });
  }
};
