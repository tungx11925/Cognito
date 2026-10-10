import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminService } from '../services/admin.service';

/**
 * 1. Get Dashboard Platform Analytics & Overview
 */
export const getAdminStats = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await adminService.getAdminStats();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu thống kê quản trị' });
  }
};

/**
 * 2. Get Users List with Search, Filter & Pagination
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const data = await adminService.getUsers(req.query);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách người dùng' });
  }
};

/**
 * 3. Delete a User
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.deleteUser(req.params.id);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi máy chủ khi xóa người dùng',
    });
  }
};

/**
 * 4. Create a User
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.createUser(req.body);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi máy chủ khi tạo người dùng',
    });
  }
};

/**
 * 5. Update a User
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.updateUser(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi máy chủ khi cập nhật thông tin',
    });
  }
};

/**
 * 6. Warn User via Email & Increment Warning Count
 */
export const warnUser = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.warnUser(req.params.id, req.body.message);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error sending warning to user:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi máy chủ khi gửi cảnh báo',
    });
  }
};

/**
 * 7. Suspend / Unsuspend User
 */
export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const targetUserId = Number(req.params.id);
    const { reason, notes } = req.body;
    const result = await adminService.suspendUser(adminId, targetUserId, reason, notes);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi đình chỉ người dùng',
    });
  }
};

export const unsuspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const targetUserId = Number(req.params.id);
    const result = await adminService.unsuspendUser(adminId, targetUserId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi khôi phục người dùng',
    });
  }
};

/**
 * 8. Get Safe User Details
 */
export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.getUserDetails(req.params.id);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi máy chủ khi tải chi tiết thông tin người dùng',
    });
  }
};

/**
 * 9. Get Documents List (Safe Metadata Only)
 */
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.getDocuments(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tài liệu' });
  }
};

/**
 * 10. Delete a Document
 */
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.id;
    const result = await adminService.deleteDocument(req.params.id, adminId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi máy chủ khi xóa tài liệu',
    });
  }
};

/**
 * 11. Get Subscriptions List
 */
export const getAdminSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.getSubscriptions(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách gói cước' });
  }
};

/**
 * 12. Get Payment Orders List
 */
export const getAdminOrders = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.getPaymentOrders(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách đơn thanh toán' });
  }
};

/**
 * 13. Trigger Manual Subscription Cron Sweep
 */
export const syncSubscriptionsCron = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.syncSubscriptions();
    return res.status(200).json({
      success: true,
      message: 'Đã hoàn tất quét và đồng bộ trạng thái gói cước toàn hệ thống',
      data: result,
    });
  } catch (error: any) {
    console.error('Error syncing subscriptions cron:', error);
    return res.status(500).json({ error: error.message || 'Lỗi quét nền đồng bộ gói cước' });
  }
};

/**
 * 14. Admin Cancel Subscription
 */
export const cancelAdminSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.cancelSubscription(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Lỗi khi hủy gói đăng ký',
    });
  }
};


/**
 * 16. AI Cost & Budget Metrics
 */
export const getAICostStats = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.getAICostStats();
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching AI cost stats:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi máy chủ khi lấy thống kê chi phí AI' });
  }
};
