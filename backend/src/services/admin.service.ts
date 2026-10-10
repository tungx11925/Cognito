import { adminRepository } from '../repositories/admin.repository';
import { subscriptionService } from './subscription.service';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { safetyService } from './safety.service';
import { hashPassword } from '../utils/hash';
import { sendWarningEmail } from '../utils/mailer';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/AppError';

export class AdminService {
  // GAP-09: Bộ đệm in-memory cho admin dashboard metrics (TTL: 15 giây)
  private cachedStats: { data: any; timestamp: number } | null = null;
  private readonly STATS_CACHE_TTL_MS = 15_000;

  /**
   * Xóa bộ đệm cache metrics khi có sự kiện thay đổi dữ liệu quan trọng
   */
  clearStatsCache(): void {
    this.cachedStats = null;
  }

  /**
   * 1. Get Dashboard Platform Analytics & Overview
   */
  async getAdminStats(forceRefresh: boolean = false) {
    const now = Date.now();
    if (!forceRefresh && this.cachedStats && now - this.cachedStats.timestamp < this.STATS_CACHE_TTL_MS) {
      return this.cachedStats.data;
    }

    // A. Freshness Guarantee: Synchronize any expired subscriptions & timed out orders
    try {
      await subscriptionService.syncAllSubscriptionsBatch();
    } catch (syncErr) {
      console.warn('[AdminStats] Cron sweep warning prior to stats calculation:', syncErr);
    }

    const raw = await adminRepository.getDashboardMetricsRaw();

    // Calculate MRR: Active Monthly Plan Revenue + (Active Yearly Plan Revenue / 12)
    let calculatedMrr = 0;
    for (const planRow of raw.plansBreakdown) {
      const price = parseFloat(planRow.price) || 0;
      const count = parseInt(planRow.active_count) || 0;
      if (planRow.interval === 'year') {
        calculatedMrr += (price / 12) * count;
      } else if (planRow.interval === 'month') {
        calculatedMrr += price * count;
      }
    }
    calculatedMrr = Math.round(calculatedMrr);

    const totalRevenue = Math.round(parseFloat(raw.ordersRevenue.orders_total) || 0);

    const result = {
      stats: {
        totalUsers: raw.userMetrics.total_users,
        activeUsers: raw.userMetrics.active_users,
        suspendedUsers: raw.userMetrics.suspended_users,
        premiumUsers: raw.userMetrics.premium_users,
        freeUsers: raw.userMetrics.free_users,
        newUsersLast7Days: raw.userMetrics.new_users_7d,
        newUsersLast30Days: raw.userMetrics.new_users_30d,

        // Subscription & Revenue
        activeSubscriptions: raw.subMetrics.active_subs,
        pastDueSubscriptions: raw.subMetrics.past_due_subs,
        cancelledSubscriptions: raw.subMetrics.cancelled_subs,
        expiredSubscriptions: raw.subMetrics.expired_subs,
        mrr: calculatedMrr,
        totalRevenue: totalRevenue,
        completedOrdersCount: raw.ordersRevenue.completed_orders_count,

        // Platform Learning
        totalDocuments: raw.contentStats.total_docs,
        publicDocuments: raw.contentStats.public_docs,
        privateDocuments: raw.contentStats.private_docs,
        totalStorageBytes: raw.contentStats.total_storage_bytes,
        totalDecks: raw.contentStats.total_decks,
        totalTestSets: raw.contentStats.total_test_sets,
        totalStudySessions: raw.contentStats.total_study_sessions,
        totalMindmaps: raw.contentStats.total_mindmaps,

        // AI Usage
        totalQuestionGens: raw.aiUsage.total_question_gens,
        totalChatMessages: raw.aiUsage.total_chat_messages,
        totalDocsUploaded: raw.aiUsage.total_docs_uploaded,
        totalStorageBytesUsed: raw.aiUsage.total_storage_bytes_used,

        // Moderation
        pendingReports: raw.modStats.pending_reports,
        resolvedReports: raw.modStats.resolved_reports,
        dismissedReports: raw.modStats.dismissed_reports,
        totalModerationLogs: raw.modStats.total_moderation_logs,
      },
      charts: {
        monthlyRevenue: raw.monthlyRevenue,
        subscriptionsByPlan: raw.plansBreakdown,
        recentOrders: raw.recentOrders,
      },
    };

    this.cachedStats = { data: result, timestamp: now };
    return result;
  }

  /**
   * 2. Get Users List with Search, Filter & Pagination
   */
  async getUsers(query: {
    search?: string;
    role?: string;
    status?: string;
    tier?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));

    const result = await adminRepository.getUsers({
      search: query.search,
      role: query.role,
      status: query.status,
      tier: query.tier,
      page,
      limit,
    });

    return {
      users: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 3. Delete a User
   */
  async deleteUser(id: string | number) {
    const user = await adminRepository.findUserById(id);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }
    if (user.email === 'admin') {
      throw new AppError('Không thể xóa tài khoản Admin hệ thống', 400);
    }

    await adminRepository.deleteUser(id);
    return { message: 'Đã xóa người dùng thành công' };
  }

  /**
   * 4. Create a User
   */
  async createUser(data: {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: string;
  }) {
    const { name, email, password, phone, role } = data;
    if (!name || !email || !password) {
      throw new AppError('Họ tên, email và mật khẩu là bắt buộc', 400);
    }

    const existingUser = await adminRepository.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('Email này đã được sử dụng', 400);
    }

    const hashedPassword = await hashPassword(password);
    const createdUser = await adminRepository.createUser({
      name,
      email,
      passwordHash: hashedPassword,
      phone: phone || null,
      role: role || 'user',
    });

    return {
      message: 'Tạo tài khoản thành viên thành công',
      user: createdUser,
    };
  }

  /**
   * 5. Update a User
   */
  async updateUser(
    id: string | number,
    data: {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      role?: string;
    }
  ) {
    const { name, email, password, phone, role } = data;
    if (!name || !email) {
      throw new AppError('Họ tên và email là bắt buộc', 400);
    }

    const user = await adminRepository.findUserById(id);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }
    if (user.email === 'admin') {
      throw new AppError('Không thể chỉnh sửa tài khoản Admin hệ thống qua trang này', 400);
    }

    const emailInUse = await adminRepository.checkEmailInUseByOther(email, id);
    if (emailInUse) {
      throw new AppError('Email này đã được sử dụng bởi người dùng khác', 400);
    }

    let passwordHash: string | undefined;
    if (password && password.trim() !== '') {
      passwordHash = await hashPassword(password);
    }

    const updatedUser = await adminRepository.updateUser(id, {
      name,
      email,
      passwordHash,
      phone: phone || null,
      role: role || 'user',
    });

    return {
      message: 'Cập nhật thông tin thành viên thành công',
      user: updatedUser,
    };
  }

  /**
   * 6. Warn User via Email & Increment Warning Count
   */
  async warnUser(id: string | number, message: string) {
    if (!message || message.trim() === '') {
      throw new AppError('Nội dung cảnh báo không được bỏ trống', 400);
    }

    const user = await adminRepository.findUserById(id);
    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404);
    }

    await adminRepository.incrementWarningCount(id);

    // Send email asynchronously
    sendWarningEmail(user.email, user.name, message)
      .then((mailResult) => {
        if (mailResult.success) {
          console.log(`[WARN MAIL] Gửi email cảnh báo thành công tới ${user.email}`);
        }
      })
      .catch((err) => {
        console.error(`[WARN MAIL] Lỗi khi gửi email cảnh báo tới ${user.email}:`, err);
      });

    return {
      message: 'Đã yêu cầu gửi email cảnh báo thành công (Hệ thống đang xử lý ở nền)',
    };
  }

  /**
   * 7. Suspend / Unsuspend User (delegates to safetyService)
   */
  async suspendUser(adminId: number, targetUserId: number, reason: string, notes?: string) {
    if (!reason || reason.trim().length < 3) {
      throw new AppError('Lý do đình chỉ phải có ít nhất 3 ký tự', 400);
    }
    return safetyService.suspendUserDirect(adminId, targetUserId, reason.trim(), notes);
  }

  async unsuspendUser(adminId: number, targetUserId: number) {
    return safetyService.unsuspendUserDirect(adminId, targetUserId);
  }

  /**
   * 8. Get Safe User Details
   */
  async getUserDetails(id: string | number) {
    const details = await adminRepository.getUserDetails(id);
    if (!details) {
      throw new AppError('Người dùng không tồn tại', 404);
    }
    return details;
  }

  /**
   * 9. Get Documents List
   */
  async getDocuments(query: {
    search?: string;
    visibility?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));

    const result = await adminRepository.getDocuments({
      search: query.search,
      visibility: query.visibility,
      page,
      limit,
    });

    return {
      documents: result.documents,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 10. Delete a Document
   */
  async deleteDocument(id: string | number, adminId: number) {
    const doc = await adminRepository.findDocumentForDelete(id);
    if (!doc) {
      throw new AppError('Tài liệu không tồn tại', 404);
    }

    await adminRepository.deleteDocumentTransaction(id, adminId, doc.title, doc.user_id);

    // Best-effort Cloudinary cleanup (non-blocking)
    const cloudinaryPublicId = doc.cloudinary_public_id;
    if (cloudinaryPublicId) {
      const isImage = (doc.file_type || '').startsWith('image/');
      cloudinary.uploader
        .destroy(cloudinaryPublicId, { resource_type: isImage ? 'image' : 'raw' })
        .catch(() =>
          cloudinary.uploader
            .destroy(cloudinaryPublicId, { resource_type: 'raw' })
            .catch((err) => console.error('Cloudinary delete error (non-fatal):', err))
        );
    }

    return { message: 'Đã xóa tài liệu thành công' };
  }

  /**
   * 11. Get Subscriptions List
   */
  async getSubscriptions(query: {
    search?: string;
    status?: string;
    plan?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));

    const result = await adminRepository.getSubscriptions({
      search: query.search,
      status: query.status,
      plan: query.plan,
      page,
      limit,
    });

    return {
      subscriptions: result.subscriptions,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 12. Get Payment Orders List
   */
  async getPaymentOrders(query: {
    search?: string;
    status?: string;
    gateway?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));

    const result = await adminRepository.getPaymentOrders({
      search: query.search,
      status: query.status,
      gateway: query.gateway,
      page,
      limit,
    });

    return {
      orders: result.orders,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 13. Sync Subscriptions Cron Sweep
   */
  async syncSubscriptions() {
    return subscriptionService.syncAllSubscriptionsBatch();
  }

  /**
   * 14. Cancel Subscription
   */
  async cancelSubscription(id: string | number) {
    const sub = await adminRepository.findSubscriptionById(id);
    if (!sub) {
      throw new AppError('Gói đăng ký không tồn tại', 404);
    }

    await subscriptionRepository.updateSubscriptionStatus(sub.id, 'CANCELLED', {
      cancelled_at: new Date(),
      auto_renew: false,
    });

    return {
      message: `Đã hủy tự động gia hạn gói #${id} thành công. Người dùng vẫn giữ quyền truy cập đến ${new Date(sub.end_date).toLocaleDateString('vi-VN')}.`,
    };
  }


  /**
   * 16. Get AI Cost & Budget Health
   */
  async getAICostStats() {
    const metrics = await adminRepository.getAICostMetrics();
    const dailyBudgetCap = parseFloat(process.env.SYSTEM_AI_DAILY_BUDGET_USD || '10.0');
    const todayCost = Number(metrics.today.today_cost || 0);
    const budgetRemaining = Math.max(0, dailyBudgetCap - todayCost);
    const budgetPercentUsed = Math.min(100, (todayCost / dailyBudgetCap) * 100);

    return {
      dailyBudgetCap,
      todayCost: Number(todayCost.toFixed(4)),
      budgetRemaining: Number(budgetRemaining.toFixed(4)),
      budgetPercentUsed: Number(budgetPercentUsed.toFixed(2)),
      isBudgetExceeded: todayCost >= dailyBudgetCap,
      todayTokens: {
        input: Number(metrics.today.today_input_tokens || 0),
        output: Number(metrics.today.today_output_tokens || 0),
        total: Number(metrics.today.today_input_tokens || 0) + Number(metrics.today.today_output_tokens || 0),
      },
      todayRequests: {
        total: metrics.today.today_requests,
        success: metrics.today.today_success,
        failed: metrics.today.today_failed,
        timeout: metrics.today.today_timeout,
      },
      monthCost: Number((metrics.month.month_cost || 0).toFixed(4)),
      monthTokens: Number(metrics.month.month_input_tokens || 0) + Number(metrics.month.month_output_tokens || 0),
      byProvider: metrics.byProvider,
      byTaskType: metrics.byTaskType,
    };
  }
}

export const adminService = new AdminService();
