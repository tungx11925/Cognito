"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, DollarSign, Search, Trash2, 
  Loader2, ArrowLeft, ShieldAlert, TrendingUp, BookOpen, 
  Layers, Clock, RefreshCw, ChevronRight, CheckCircle,
  AlertTriangle, UserPlus, Edit, X, Mail, Lock, Phone, Eye,
  Flag, UserX, UserCheck, CreditCard, HardDrive, Sparkles, Check,
  Calendar, Zap, Shield, AlertCircle, Unlock,
  MessageSquareHeart, Star, ThumbsUp, Filter, Lightbulb, CheckCircle2, MessageSquare, LogOut, Plus
} from "lucide-react";
import { useStudy } from "@/context/StudyContext";
import { 
  getAdminStats, 
  getAdminUsers, 
  createAdminUser,
  updateAdminUser,
  deleteAdminUser, 
  getAdminDocuments, 
  deleteAdminDocument,
  warnAdminUser,
  suspendAdminUser,
  unsuspendAdminUser,
  getAdminUserDetails,
  getAdminSubscriptions,
  getAdminOrders,
  syncAdminSubscriptions,
  cancelAdminSubscription
} from "@/services/admin.service";
import {
  safetyService,
  ContentReportItem,
  ModerationStats,
  ModerationHistoryItem,
  ModerationAction,
} from "@/services/safety.service";
import {
  getAdminFeedbacks,
  deleteAdminFeedback,
  FeedbackItem,
  FeedbackStats
} from "@/services/feedback.service";

type ActiveTab = "dashboard" | "users" | "subscriptions" | "documents" | "moderation" | "feedbacks";

export default function AdminPage() {
  const router = useRouter();
  const { activeUser, loading: authLoading, logout } = useStudy();
  
  // Navigation & UI states
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const triggerNotification = (msg: string, type: "success" | "error" = "success") => {
    setActionSuccess(type === "error" ? `❌ ${msg}` : `✅ ${msg}`);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  // Dashboard Stats & Charts
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [isSyncingCron, setIsSyncingCron] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [feedbackFilterRating, setFeedbackFilterRating] = useState<number | "all">("all");
  const [feedbackFilterCategory, setFeedbackFilterCategory] = useState<string | "all">("all");
  const [feedbackSearch, setFeedbackSearch] = useState("");

  // Users Tab states
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userTierFilter, setUserTierFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [userLimit] = useState(10);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const lastUserSearchRef = React.useRef("");

  // Subscriptions & Revenue Tab states
  const [subViewMode, setSubViewMode] = useState<"subscriptions" | "orders">("subscriptions");
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [subStatusFilter, setSubStatusFilter] = useState("ALL");
  const [subPlanFilter, setSubPlanFilter] = useState("ALL");
  const [subSearch, setSubSearch] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [subPagination, setSubPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderGatewayFilter, setOrderGatewayFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Documents Tab states
  const [documents, setDocuments] = useState<any[]>([]);
  const [docSearch, setDocSearch] = useState("");
  const [docVisibilityFilter, setDocVisibilityFilter] = useState("all");
  const [docPage, setDocPage] = useState(1);
  const [docPagination, setDocPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const lastDocSearchRef = React.useRef("");

  // Modals / Actions
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<"user" | "document" | "feedback" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User CRUD states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "user"
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Warning Modal states
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [warningUser, setWarningUser] = useState<any | null>(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [isSendingWarning, setIsSendingWarning] = useState(false);

  // Suspend Modal states
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<any | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionNotes, setSuspensionNotes] = useState("");
  const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

  // User Details Modal states (Safe Privacy Preservation)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<any | null>(null);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<"profile" | "subs" | "learning" | "docs" | "reports">("profile");

  // Moderation Tab states
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);
  const [moderationReports, setModerationReports] = useState<ContentReportItem[]>([]);
  const [moderationHistory, setModerationHistory] = useState<ModerationHistoryItem[]>([]);
  const [moderationStatusFilter, setModerationStatusFilter] = useState<'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' | 'ALL'>('PENDING');
  const [moderationTypeFilter, setModerationTypeFilter] = useState<'ALL' | 'resource' | 'comment' | 'user'>('ALL');
  const [moderationSubTab, setModerationSubTab] = useState<'queue' | 'history'>('queue');
  const [moderationActionModalOpen, setModerationActionModalOpen] = useState(false);
  const [selectedReportForAction, setSelectedReportForAction] = useState<ContentReportItem | null>(null);
  const [chosenAction, setChosenAction] = useState<ModerationAction>('KEEP');
  const [moderationReason, setModerationReason] = useState('');
  const [moderationNotes, setModerationNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Load Moderation
  const loadModerationData = async (statusOverride?: string, typeOverride?: string) => {
    try {
      const currentStatus = statusOverride !== undefined ? statusOverride : moderationStatusFilter;
      const currentType = typeOverride !== undefined ? typeOverride : moderationTypeFilter;

      const [statsRes, reportsRes, historyRes] = await Promise.all([
        safetyService.getModerationStats(),
        safetyService.getModerationReports({
          status: currentStatus,
          targetType: currentType,
        }),
        safetyService.getModerationHistory(1, 40),
      ]);

      if (statsRes && !statsRes.error) {
        setModerationStats(statsRes);
      }
      if (reportsRes && Array.isArray(reportsRes.reports)) {
        setModerationReports(reportsRes.reports);
      }
      if (historyRes && Array.isArray(historyRes.history)) {
        setModerationHistory(historyRes.history);
      }
    } catch (err: any) {
      triggerNotification('Lỗi khi tải dữ liệu kiểm duyệt', 'error');
    }
  };

  const handleOpenModerationAction = (report: ContentReportItem, action: ModerationAction) => {
    setSelectedReportForAction(report);
    setChosenAction(action);
    setModerationReason(
      action === 'KEEP'
        ? 'Nội dung hợp lệ sau kiểm tra thực tế, không vi phạm chính sách.'
        : action === 'HIDE'
        ? 'Nội dung vi phạm nhẹ hoặc cần xác minh thêm, tạm ẩn khỏi bảng tin.'
        : action === 'REMOVE'
        ? 'Nội dung vi phạm nghiêm trọng tiêu chuẩn cộng đồng, xóa vĩnh viễn.'
        : action === 'WARN'
        ? 'Cảnh cáo tài khoản về hành vi không phù hợp trong cộng đồng.'
        : 'Đình chỉ tài khoản do vi phạm tiêu chuẩn cộng đồng nhiều lần.'
    );
    setModerationNotes('');
    setModerationActionModalOpen(true);
  };

  const executeModerationAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportForAction) return;
    if (!moderationReason.trim() || moderationReason.trim().length < 3) {
      triggerNotification('Lý do xử lý kiểm duyệt bắt buộc có ít nhất 3 ký tự', 'error');
      return;
    }
    setIsSubmittingAction(true);
    try {
      const res = await safetyService.applyModerationAction(
        selectedReportForAction.id,
        chosenAction,
        moderationReason.trim(),
        moderationNotes.trim() || undefined
      );
      if (res && res.error) {
        triggerNotification(res.error, 'error');
      } else {
        triggerNotification(`Đã thực thi hành động ${chosenAction} thành công`, 'success');
        setModerationActionModalOpen(false);
        setSelectedReportForAction(null);
        await loadModerationData();
      }
    } catch (err: any) {
      triggerNotification(err.message || 'Lỗi khi xử lý kiểm duyệt', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Auth Guard & Initial Load
  useEffect(() => {
    if (authLoading) return;
    if (!activeUser || activeUser.role !== "admin") {
      setLoading(false);
      setError("Unauthorized access.");
      return;
    }
    loadDashboardData();
  }, [authLoading, activeUser]);

  // Debounce User Search
  useEffect(() => {
    if (activeTab !== "users") return;
    const delay = setTimeout(() => {
      loadUsers(userSearch, 1);
      lastUserSearchRef.current = userSearch;
    }, 300);
    return () => clearTimeout(delay);
  }, [userSearch, userRoleFilter, userStatusFilter, userTierFilter, activeTab]);

  // Debounce Document Search
  useEffect(() => {
    if (activeTab !== "documents") return;
    const delay = setTimeout(() => {
      loadDocuments(docSearch, 1);
      lastDocSearchRef.current = docSearch;
    }, 300);
    return () => clearTimeout(delay);
  }, [docSearch, docVisibilityFilter, activeTab]);

  // 1. Load Dashboard Data (REAL DATA, NO MOCK FALLBACKS)
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await getAdminStats();
      if (statsRes.error) {
        throw new Error(statsRes.error);
      }
      setStats(statsRes.stats || {});
      setCharts(statsRes.charts || { monthlyRevenue: [], subscriptionsByPlan: [], recentOrders: [] });

      // Silent load feedback stats for sidebar badge
      getAdminFeedbacks().then((res) => {
        if (res && res.success) {
          setFeedbackStats(res.stats || null);
        }
      }).catch(() => {});
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || "Không thể tải dữ liệu thống kê từ hệ thống");
      setLoading(false);
    }
  };

  // Force Cron Sweep trigger
  const handleTriggerCronSweep = async () => {
    setIsSyncingCron(true);
    try {
      const res = await syncAdminSubscriptions();
      if (res.error) throw new Error(res.error);
      triggerNotification("Đã hoàn tất quét và đồng bộ trạng thái gói cước toàn hệ thống!", "success");
      await loadDashboardData();
      if (activeTab === "subscriptions") {
        await loadSubscriptionsData();
      }
    } catch (err: any) {
      triggerNotification(err.message || "Lỗi đồng bộ gói cước", "error");
    } finally {
      setIsSyncingCron(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      const res = await getAdminFeedbacks();
      if (res && res.success) {
        setFeedbacks(res.feedbacks || []);
        setFeedbackStats(res.stats || null);
      }
    } catch (err: any) {
      triggerNotification("Lỗi tải danh sách phản hồi & đánh giá", "error");
    }
  };

  // 2. Load Users List
  const loadUsers = async (searchVal?: string, pageNum?: number) => {
    try {
      const pageToLoad = pageNum !== undefined ? pageNum : userPage;
      const res = await getAdminUsers({
        search: searchVal !== undefined ? searchVal : userSearch,
        page: pageToLoad,
        limit: userLimit,
        role: userRoleFilter,
        status: userStatusFilter,
        tier: userTierFilter,
      });
      if (res.error) throw new Error(res.error);
      setUsers(res.users || []);
      if (res.pagination) {
        setUserPagination(res.pagination);
        setUserPage(res.pagination.page);
      }
    } catch (err: any) {
      triggerNotification("Lỗi tải danh sách người dùng", "error");
    }
  };

  // 3. Load Subscriptions & Orders
  const loadSubscriptionsData = async (pageSub?: number, pageOrd?: number) => {
    try {
      const [subsRes, ordsRes] = await Promise.all([
        getAdminSubscriptions({
          page: pageSub || subPage,
          limit: 10,
          status: subStatusFilter,
          plan: subPlanFilter,
          search: subSearch,
        }),
        getAdminOrders({
          page: pageOrd || orderPage,
          limit: 10,
          status: orderStatusFilter,
          gateway: orderGatewayFilter,
          search: orderSearch,
        }),
      ]);

      if (subsRes.subscriptions) {
        setSubscriptionsList(subsRes.subscriptions);
        if (subsRes.pagination) setSubPagination(subsRes.pagination);
      }
      if (ordsRes.orders) {
        setOrdersList(ordsRes.orders);
        if (ordsRes.pagination) setOrderPagination(ordsRes.pagination);
      }
    } catch (err: any) {
      triggerNotification("Lỗi tải dữ liệu gói cước & đơn hàng", "error");
    }
  };

  // 4. Load Documents List
  const loadDocuments = async (searchVal?: string, pageNum?: number) => {
    try {
      const pageToLoad = pageNum !== undefined ? pageNum : docPage;
      const res = await getAdminDocuments(
        searchVal !== undefined ? searchVal : docSearch,
        pageToLoad,
        10,
        docVisibilityFilter
      );
      if (res.error) throw new Error(res.error);
      setDocuments(res.documents || []);
      if (res.pagination) {
        setDocPagination(res.pagination);
        setDocPage(res.pagination.page);
      }
    } catch (err: any) {
      triggerNotification("Lỗi tải danh sách tài liệu", "error");
    }
  };

  // Handle active tab changes
  const handleTabChange = async (tab: ActiveTab) => {
    setActiveTab(tab);
    setLoading(true);
    try {
      if (tab === "dashboard") {
        await loadDashboardData();
      } else if (tab === "users") {
        setUserPage(1);
        await loadUsers("", 1);
      } else if (tab === "subscriptions") {
        await loadSubscriptionsData(1, 1);
      } else if (tab === "documents") {
        setDocPage(1);
        await loadDocuments("", 1);
      } else if (tab === "moderation") {
        await loadModerationData();
      } else if (tab === "feedbacks") {
        await loadFeedbacks();
      }
      setLoading(false);
    } catch (err) {
      setError("Lỗi khi tải dữ liệu phân mục");
      setLoading(false);
    }
  };

  // Delete handles
  const confirmDelete = (id: number, type: "user" | "document" | "feedback") => {
    setDeletingId(id);
    setDeleteType(type);
  };

  const executeDelete = async () => {
    if (!deletingId || !deleteType) return;
    setIsDeleting(true);
    try {
      let res;
      if (deleteType === "user") {
        res = await deleteAdminUser(deletingId);
      } else if (deleteType === "document") {
        res = await deleteAdminDocument(deletingId);
      } else if (deleteType === "feedback") {
        res = await deleteAdminFeedback(deletingId);
      }

      if (res.error) throw new Error(res.error);

      triggerNotification(
        deleteType === "user" 
          ? "Đã xóa người dùng thành công" 
          : deleteType === "document" 
          ? "Đã xóa tài liệu thành công" 
          : "Đã xóa đánh giá thành công",
        "success"
      );
      
      if (deleteType === "user") await loadUsers();
      else if (deleteType === "document") await loadDocuments();
      else if (deleteType === "feedback") await loadFeedbacks();

      await loadDashboardData();
    } catch (err: any) {
      triggerNotification(err.message || "Lỗi khi xóa đối tượng", "error");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setDeleteType(null);
    }
  };

  // Handlers for User CRUD Modal
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "user"
    });
    setUserFormError(null);
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role: user.role || "user"
    });
    setUserFormError(null);
    setUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserFormError("Họ và tên, Email là thông tin bắt buộc");
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      setUserFormError("Mật khẩu ban đầu là bắt buộc đối với tài khoản mới");
      return;
    }

    setIsSubmittingUser(true);
    try {
      let res;
      if (editingUser) {
        res = await updateAdminUser(editingUser.id, userForm);
      } else {
        res = await createAdminUser(userForm);
      }

      if (res.error) {
        throw new Error(res.error);
      }

      triggerNotification(
        editingUser ? "Cập nhật tài khoản thành viên thành công" : "Tạo mới tài khoản thành viên thành công",
        "success"
      );
      setUserModalOpen(false);
      await loadUsers();
      await loadDashboardData();
    } catch (err: any) {
      setUserFormError(err.message || "Lỗi xử lý tài khoản người dùng");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Warning Modal
  const openWarnModal = (user: any) => {
    setWarningUser(user);
    setWarningMessage("");
    setWarnModalOpen(true);
  };

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningUser) return;
    if (!warningMessage.trim()) {
      triggerNotification("Nội dung cảnh báo không được để trống", "error");
      return;
    }

    setIsSendingWarning(true);
    try {
      const res = await warnAdminUser(warningUser.id, warningMessage);
      if (res.error) throw new Error(res.error);

      triggerNotification(`Đã gửi email cảnh báo tới ${warningUser.email} thành công!`, "success");
      setWarnModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      triggerNotification(err.message || "Lỗi gửi email cảnh báo", "error");
    } finally {
      setIsSendingWarning(false);
    }
  };

  // Suspend User Handlers
  const openSuspendModal = (user: any) => {
    setSuspendingUser(user);
    setSuspensionReason("");
    setSuspensionNotes("");
    setSuspendModalOpen(true);
  };

  const handleExecuteSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;
    if (!suspensionReason.trim() || suspensionReason.trim().length < 3) {
      triggerNotification("Lý do đình chỉ phải có ít nhất 3 ký tự", "error");
      return;
    }

    setIsSubmittingSuspend(true);
    try {
      const res = await suspendAdminUser(suspendingUser.id, suspensionReason.trim(), suspensionNotes.trim() || undefined);
      if (res.error) throw new Error(res.error);

      triggerNotification(`Đã đình chỉ tài khoản ${suspendingUser.name} thành công`, "success");
      setSuspendModalOpen(false);
      setSuspendingUser(null);
      await loadUsers();
      await loadDashboardData();
    } catch (err: any) {
      triggerNotification(err.message || "Lỗi khi đình chỉ người dùng", "error");
    } finally {
      setIsSubmittingSuspend(false);
    }
  };

  const handleExecuteUnsuspend = async (user: any) => {
    try {
      const res = await unsuspendAdminUser(user.id);
      if (res.error) throw new Error(res.error);
      triggerNotification(`Đã mở khóa tài khoản ${user.name} thành công`, "success");
      await loadUsers();
      await loadDashboardData();
    } catch (err: any) {
      triggerNotification(err.message || "Lỗi khi mở khóa người dùng", "error");
    }
  };

  // User Details Modal (Safe view)
  const openDetailsModal = async (user: any) => {
    setDetailsUser(user);
    setDetailsData(null);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetailsTab("profile");
    setDetailsModalOpen(true);

    try {
      const res = await getAdminUserDetails(user.id);
      if (res.error) throw new Error(res.error);
      setDetailsData(res);
      if (res.user) {
        setDetailsUser(res.user);
      }
    } catch (err: any) {
      setDetailsError(err.message || "Không thể tải chi tiết thông tin người dùng");
    } finally {
      setDetailsLoading(false);
    }
  };

  // Admin Cancel Subscription
  const handleCancelSub = async (subId: number) => {
    if (!confirm("Bạn có chắc chắn muốn hủy tự động gia hạn gói đăng ký này không?")) return;
    try {
      const res = await cancelAdminSubscription(subId);
      if (res.error) throw new Error(res.error);
      triggerNotification("Đã hủy tự động gia hạn gói cước thành công", "success");
      await loadSubscriptionsData();
      await loadDashboardData();
    } catch (err: any) {
      triggerNotification(err.message || "Lỗi hủy gói cước", "error");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // 1. Auth check loading state
  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0F17]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0D2B24] dark:text-emerald-400" />
        <p className="mt-3 text-sm text-[#0D2B24] dark:text-zinc-200 font-semibold">Đang xác thực quyền Admin...</p>
      </div>
    );
  }

  // 2. Access Denied Screen
  if (!activeUser || activeUser.role !== "admin") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#0B0F17] p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-rose-950/40 flex items-center justify-center border-2 border-red-200 dark:border-rose-800 mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-rose-400 animate-pulse" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-zinc-100 mb-2">Quyền Truy Cập Bị Từ Chối</h1>
        <p className="text-gray-500 dark:text-zinc-400 max-w-md text-sm leading-relaxed mb-8">
          Trang quản trị chỉ dành riêng cho Quản trị viên hệ thống (role: admin). Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-700 font-bold text-sm text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Quay lại Trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F4F3EF] dark:bg-[#0B0F17] text-gray-800 dark:text-zinc-100 antialiased overflow-x-hidden font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#0D2B24] text-white flex flex-col shrink-0 border-r border-[#153e34] shadow-xl z-20">
        
        {/* Brand / Logo */}
        <div className="p-6 border-b border-[#153e34] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white shadow-md text-base">
            C
          </div>
          <div>
            <h2 className="font-extrabold text-base leading-none tracking-tight">Cognito Admin</h2>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 block">
              Bảng Quản Trị Hệ Thống
            </span>
          </div>
        </div>

        {/* Current Admin User */}
        <div className="p-4 border-b border-[#153e34] bg-[#091f1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-black text-sm shadow-inner text-white border border-emerald-500">
              {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate leading-tight text-white">{activeUser.name}</p>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-700/50 mt-1 inline-block">
                Quản trị viên
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-300 hover:bg-[#153e34] hover:text-white"
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Tổng quan & Analytics</span>
          </button>
          
          <button
            onClick={() => handleTabChange("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "users"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-300 hover:bg-[#153e34] hover:text-white"
            }`}
          >
            <Users size={18} />
            <span>Quản lý Người dùng</span>
          </button>

          <button
            onClick={() => handleTabChange("subscriptions")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "subscriptions"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-300 hover:bg-[#153e34] hover:text-white"
            }`}
          >
            <CreditCard size={18} />
            <span>Gói cước & Doanh thu</span>
          </button>

          <button
            onClick={() => handleTabChange("documents")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "documents"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-300 hover:bg-[#153e34] hover:text-white"
            }`}
          >
            <FileText size={18} />
            <span>Tài liệu & Lưu trữ</span>
          </button>

          <button
            onClick={() => handleTabChange("moderation")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "moderation"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-300 hover:bg-[#153e34] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} />
              <span>Kiểm duyệt vi phạm</span>
            </div>
            {stats && stats.pendingReports > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-500 text-white animate-pulse">
                {stats.pendingReports}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("feedbacks")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "feedbacks"
                ? "bg-emerald-500 text-white shadow-md"
                : "text-gray-300 hover:bg-[#153e34] hover:text-white"
            }`}
          >
            <MessageSquareHeart size={18} />
            <div className="flex items-center justify-between flex-1">
              <span>Đánh giá & Góp ý</span>
              {feedbackStats && feedbackStats.totalFeedbacks > 0 && (
                <span className="text-[10px] bg-emerald-700/80 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  {feedbackStats.totalFeedbacks}
                </span>
              )}
            </div>
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#153e34] space-y-2">
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#1d4d40] text-xs font-bold text-gray-300 hover:bg-[#153e34] hover:text-white transition-all"
          >
            <ArrowLeft size={14} /> Xem Trang Chủ
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/15 border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-600 hover:text-white transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200/80 dark:border-zinc-800 px-8 flex justify-between items-center shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-[#0D2B24] dark:text-zinc-100 uppercase tracking-wide">
              {activeTab === "dashboard" && "Hệ Thống Thống Kê & Phân Tích Tổng Quan"}
              {activeTab === "users" && "Quản Lý Người Dùng & Phân Quyền"}
              {activeTab === "subscriptions" && "Quản Lý Gói Cước & Doanh Thu Hệ Thống"}
              {activeTab === "documents" && "Quản Lý Tài Liệu Học Tập & Dung Lượng"}
              {activeTab === "moderation" && "Kiểm Duyệt Nội Dung & An Toàn Cộng Đồng"}
              {activeTab === "feedbacks" && "Ý Kiến Đóng Góp & Đánh Giá Trải Nghiệm"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Cron Sweep Button */}
            <button
              onClick={handleTriggerCronSweep}
              disabled={isSyncingCron}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              title="Quét và đồng bộ gói cước hết hạn, đơn PENDING quá hạn ngay lập tức"
            >
              <RefreshCw size={14} className={`${isSyncingCron ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""}`} />
              <span>{isSyncingCron ? "Đang đồng bộ..." : "Đồng bộ gói cước"}</span>
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />

            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sẵn sàng
            </span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#F4F3EF] dark:bg-[#0B0F17]">
          
          {/* Toast Notification */}
          <AnimatePresence>
            {actionSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-md flex items-center gap-3 text-sm font-semibold z-30"
                style={{
                  borderColor: actionSuccess.startsWith("❌") ? "#fecaca" : "#a7f3d0",
                  color: actionSuccess.startsWith("❌") ? "#991b1b" : "#065f46"
                }}
              >
                {actionSuccess}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Screen */}
          {loading ? (
            <div className="h-[400px] w-full flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#0D2B24] dark:text-emerald-400" />
              <p className="mt-3 text-sm text-[#0D2B24] dark:text-zinc-300 font-bold">Đang tải dữ liệu thực tế từ cơ sở dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border-2 border-dashed border-red-200 dark:border-rose-900/60 bg-red-50 dark:bg-rose-950/30 text-center max-w-md mx-auto my-12">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-rose-400 mx-auto mb-3" />
              <h3 className="font-extrabold text-red-900 dark:text-rose-300 mb-1 text-sm">Lỗi Tải Dữ Liệu</h3>
              <p className="text-red-700 dark:text-rose-400 text-xs mb-4">{error}</p>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* TAB 1: DASHBOARD OVERVIEW & ANALYTICS                     */}
              {/* ======================================================== */}
              {activeTab === "dashboard" && stats && (
                <div className="space-y-8">
                  
                  {/* Primary KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    
                    {/* 1. Total Users */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shrink-0">
                        <Users size={22} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Tổng người dùng</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-gray-900 dark:text-zinc-100">
                            {stats.totalUsers?.toLocaleString() || 0}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            +{stats.newUsersLast7Days || 0} (7 ngày)
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-400 block mt-0.5">
                          {stats.activeUsers || 0} hoạt động • {stats.suspendedUsers || 0} tạm khóa
                        </span>
                      </div>
                    </div>

                    {/* 2. Premium Pro Conversion */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 shrink-0">
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Gói Premium Pro</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                            {stats.premiumUsers?.toLocaleString() || 0}
                          </span>
                          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">
                            ({stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%)
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-400 block mt-0.5">
                          {stats.activeSubscriptions || 0} gói Active • {stats.pastDueSubscriptions || 0} Ân hạn
                        </span>
                      </div>
                    </div>

                    {/* 3. Monthly Recurring Revenue (MRR) */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shrink-0">
                        <TrendingUp size={22} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Doanh thu định kỳ (MRR)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-[#0D2B24] dark:text-zinc-100">
                            {stats.mrr?.toLocaleString() || 0}
                          </span>
                          <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">đ/tháng</span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-400 block mt-0.5">
                          Tổng thu: {(stats.totalRevenue || 0).toLocaleString()} đ
                        </span>
                      </div>
                    </div>

                    {/* 4. Platform Learning Storage */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 shrink-0">
                        <HardDrive size={22} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">Tài liệu & Dung lượng</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-gray-900 dark:text-zinc-100">
                            {stats.totalDocuments?.toLocaleString() || 0}
                          </span>
                          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                            {(stats.totalStorageBytes ? (stats.totalStorageBytes / (1024 * 1024)).toFixed(1) : 0)} MB
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-400 block mt-0.5">
                          {stats.publicDocuments || 0} công khai • {stats.privateDocuments || 0} cá nhân
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Secondary Learning & AI Usage Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 p-4 text-center">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Flashcard Decks</span>
                      <p className="text-xl font-black text-gray-800 dark:text-zinc-100 mt-1">{stats.totalDecks?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 p-4 text-center">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Bộ đề trắc nghiệm</span>
                      <p className="text-xl font-black text-gray-800 dark:text-zinc-100 mt-1">{stats.totalTestSets?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 p-4 text-center">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Sơ đồ Mindmap</span>
                      <p className="text-xl font-black text-gray-800 dark:text-zinc-100 mt-1">{stats.totalMindmaps?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800 p-4 text-center">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Lượt tạo câu hỏi AI</span>
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.totalQuestionGens?.toLocaleString() || 0}</p>
                    </div>
                  </div>

                  {/* Charts & Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Monthly Revenue Trend */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-extrabold text-sm text-[#0D2B24] dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-500" /> Doanh thu 6 tháng gần nhất
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Theo đơn hoàn tất (VNĐ)</span>
                      </div>

                      {charts.monthlyRevenue.length === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 dark:text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                          <DollarSign size={28} className="mb-2 opacity-40" />
                          <p className="text-xs font-semibold">Chưa phát sinh giao dịch thanh toán hoàn tất</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {charts.monthlyRevenue.map((row: any, idx: number) => {
                            const maxVal = Math.max(...charts.monthlyRevenue.map((r: any) => parseFloat(r.revenue)));
                            const percentage = maxVal > 0 ? (parseFloat(row.revenue) / maxVal) * 100 : 0;
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-gray-600 dark:text-zinc-300">Tháng {row.month}</span>
                                  <span className="text-[#0D2B24] dark:text-zinc-100">{parseFloat(row.revenue).toLocaleString()} VNĐ</span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Subscription Breakdown by Plan */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-extrabold text-sm text-[#0D2B24] dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                          <CreditCard size={16} className="text-emerald-500" /> Cơ cấu gói cước đang kích hoạt
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Trạng thái ACTIVE</span>
                      </div>

                      <div className="space-y-4">
                        {charts.subscriptionsByPlan && charts.subscriptionsByPlan.map((plan: any) => (
                          <div key={plan.plan_id} className="p-4 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/60 flex items-center justify-between">
                            <div>
                              <p className="font-black text-gray-900 dark:text-zinc-100 text-sm">{plan.plan_name}</p>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                                Mã: <code className="bg-gray-200/60 dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 px-1 py-0.5 rounded text-[10px]">{plan.plan_code}</code> • {parseFloat(plan.price).toLocaleString()} đ / {plan.interval === "year" ? "Năm" : plan.interval === "month" ? "Tháng" : "Vĩnh viễn"}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{plan.active_count}</span>
                              <span className="text-xs text-gray-400 dark:text-zinc-500 block font-semibold">đang dùng</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Recent Payment Orders Table */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-extrabold text-sm text-[#0D2B24] dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-emerald-500" /> Đơn thanh toán gần đây
                      </h3>
                      <button
                        onClick={() => handleTabChange("subscriptions")}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                      >
                        Xem tất cả <ChevronRight size={14} />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-100 dark:border-zinc-700/60 text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                            <th className="py-3 px-4">Mã đơn</th>
                            <th className="py-3 px-4">Người mua</th>
                            <th className="py-3 px-4">Gói cước</th>
                            <th className="py-3 px-4">Số tiền</th>
                            <th className="py-3 px-4">Cổng</th>
                            <th className="py-3 px-4">Trạng thái</th>
                            <th className="py-3 px-4">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                          {charts.recentOrders && charts.recentOrders.length > 0 ? (
                            charts.recentOrders.map((ord: any) => (
                              <tr key={ord.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                                <td className="py-3 px-4 font-mono font-bold text-gray-700 dark:text-zinc-300">#{ord.order_code}</td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-gray-900 dark:text-zinc-100">{ord.user_name}</div>
                                  <div className="text-[10px] text-gray-400 dark:text-zinc-400">{ord.user_email}</div>
                                </td>
                                <td className="py-3 px-4 font-semibold text-gray-800 dark:text-zinc-200">{ord.plan_name || "Gói Pro"}</td>
                                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{parseFloat(ord.amount).toLocaleString()} đ</td>
                                <td className="py-3 px-4 font-mono text-[10px] text-gray-500 dark:text-zinc-400 uppercase">{ord.payment_gateway}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" :
                                    ord.status === "PENDING" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" :
                                    "bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 border border-red-200 dark:border-rose-800"
                                  }`}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-400 dark:text-zinc-400 text-[11px]">
                                  {new Date(ord.created_at).toLocaleString("vi-VN")}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-400 dark:text-zinc-400">Chưa có đơn hàng nào được ghi nhận</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: USER MANAGEMENT                                   */}
              {/* ======================================================== */}
              {activeTab === "users" && (
                <div className="space-y-6">
                  
                  {/* Filters & Actions Bar */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs">
                    
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Tìm người dùng theo tên, email, SĐT..."
                        className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 bg-gray-50/50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      />
                    </div>

                    {/* Filter Selects */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">Tất cả vai trò</option>
                        <option value="user">Thành viên</option>
                        <option value="admin">Quản trị viên</option>
                      </select>

                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="suspended">Đã tạm khóa</option>
                      </select>

                      <select
                        value={userTierFilter}
                        onChange={(e) => setUserTierFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">Tất cả gói</option>
                        <option value="premium">Gói Pro Premium</option>
                        <option value="free">Gói Miễn phí</option>
                      </select>

                      <button
                        onClick={openCreateUserModal}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                      >
                        <UserPlus size={14} /> Thêm thành viên
                      </button>
                    </div>

                  </div>

                  {/* Users Table */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#0D2B24] text-[10px] font-bold text-white/90 uppercase tracking-wider">
                            <th className="py-3.5 px-5">ID</th>
                            <th className="py-3.5 px-5">Họ tên & Email</th>
                            <th className="py-3.5 px-5">Gói cước</th>
                            <th className="py-3.5 px-5">Vai trò</th>
                            <th className="py-3.5 px-5">Trạng thái</th>
                            <th className="py-3.5 px-5">Cảnh báo</th>
                            <th className="py-3.5 px-5">Ngày tạo</th>
                            <th className="py-3.5 px-5 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-12 text-gray-400 dark:text-zinc-500 font-semibold">
                                Không tìm thấy người dùng nào phù hợp với bộ lọc
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => {
                              const isPrem = u.is_premium && (!u.premium_until || new Date(u.premium_until) > new Date());
                              return (
                                <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-500 font-mono">#{u.id}</td>
                                  <td className="py-3.5 px-5">
                                    <div className="font-extrabold text-gray-900 dark:text-zinc-100">{u.name}</div>
                                    <div className="text-[10px] text-gray-400 dark:text-zinc-400 font-mono">{u.email}</div>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    {isPrem ? (
                                      <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                                        <Sparkles size={11} className="text-amber-600 dark:text-amber-400" /> Pro
                                        {u.premium_until && (
                                          <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 font-normal">
                                            (đến {new Date(u.premium_until).toLocaleDateString("vi-VN")})
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                                        Free
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                      u.role === "admin" ? "bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 border-red-200 dark:border-rose-800" : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                    }`}>
                                      {u.role === "admin" ? "Admin" : "User"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    {u.is_suspended ? (
                                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-red-100 dark:bg-rose-950/50 text-red-800 dark:text-rose-300 border border-red-200 dark:border-rose-800">
                                        Tạm khóa
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                        Hoạt động
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                                      (u.warning_count || 0) > 0 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                                    }`}>
                                      {u.warning_count || 0} lần
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-400 text-[11px]">
                                    {new Date(u.created_at).toLocaleDateString("vi-VN")}
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                    <div className="flex justify-end items-center gap-1.5">
                                      <button
                                        onClick={() => openDetailsModal(u)}
                                        className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Xem chi tiết an toàn"
                                      >
                                        <Eye size={15} />
                                      </button>
                                      <button
                                        onClick={() => openWarnModal(u)}
                                        className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Gửi email cảnh báo"
                                      >
                                        <Mail size={15} />
                                      </button>
                                      {u.is_suspended ? (
                                        <button
                                          onClick={() => handleExecuteUnsuspend(u)}
                                          className="p-1.5 text-red-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                          title="Mở khóa tài khoản"
                                        >
                                          <Unlock size={15} />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => openSuspendModal(u)}
                                          className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                          title="Đình chỉ / Tạm khóa tài khoản"
                                        >
                                          <Lock size={15} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openEditUserModal(u)}
                                        className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Chỉnh sửa thông tin"
                                      >
                                        <Edit size={15} />
                                      </button>
                                      <button
                                        onClick={() => confirmDelete(u.id, "user")}
                                        className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                        title="Xóa tài khoản"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {userPagination.totalPages > 1 && (
                      <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-zinc-400">
                          Hiển thị trang {userPagination.page} / {userPagination.totalPages} (Tổng {userPagination.total} người dùng)
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadUsers(userSearch, userPage - 1)}
                            disabled={userPage <= 1}
                            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-gray-700 dark:text-zinc-300 disabled:opacity-40"
                          >
                            Trước
                          </button>
                          <button
                            onClick={() => loadUsers(userSearch, userPage + 1)}
                            disabled={userPage >= userPagination.totalPages}
                            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-gray-700 dark:text-zinc-300 disabled:opacity-40"
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: SUBSCRIPTIONS & REVENUE MANAGEMENT                */}
              {/* ======================================================== */}
              {activeTab === "subscriptions" && (
                <div className="space-y-6">
                  
                  {/* View Mode Toggle & Summary Bar */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSubViewMode("subscriptions")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          subViewMode === "subscriptions"
                            ? "bg-[#0D2B24] text-white shadow-xs"
                            : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Gói đăng ký người dùng ({subPagination.total})
                      </button>
                      <button
                        onClick={() => setSubViewMode("orders")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          subViewMode === "orders"
                            ? "bg-[#0D2B24] text-white shadow-xs"
                            : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Lịch sử đơn thanh toán ({orderPagination.total})
                      </button>
                    </div>

                    <button
                      onClick={handleTriggerCronSweep}
                      disabled={isSyncingCron}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncingCron ? "animate-spin" : ""} />
                      <span>Quét & đồng bộ gói cước ngay</span>
                    </button>
                  </div>

                  {/* Subscriptions Table */}
                  {subViewMode === "subscriptions" && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <Search size={14} className="text-gray-400 dark:text-zinc-400" />
                          <input
                            value={subSearch}
                            onChange={(e) => setSubSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && loadSubscriptionsData(1)}
                            placeholder="Tìm theo email, tên, mã đơn..."
                            className="w-full text-xs py-1.5 px-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none text-gray-900 dark:text-zinc-100"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <select
                            value={subStatusFilter}
                            onChange={(e) => {
                              setSubStatusFilter(e.target.value);
                              loadSubscriptionsData(1);
                            }}
                            className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-200"
                          >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="ACTIVE">ACTIVE (Đang hoạt động)</option>
                            <option value="PAST_DUE">PAST_DUE (Ân hạn)</option>
                            <option value="CANCELLED">CANCELLED (Đã hủy gia hạn)</option>
                            <option value="EXPIRED">EXPIRED (Đã hết hạn)</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#0D2B24] text-[10px] font-bold text-white/90 uppercase tracking-wider">
                              <th className="py-3.5 px-5">ID</th>
                              <th className="py-3.5 px-5">Người dùng</th>
                              <th className="py-3.5 px-5">Gói cước</th>
                              <th className="py-3.5 px-5">Trạng thái</th>
                              <th className="py-3.5 px-5">Bắt đầu</th>
                              <th className="py-3.5 px-5">Hết hạn</th>
                              <th className="py-3.5 px-5">Tự động gia hạn</th>
                              <th className="py-3.5 px-5 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                            {subscriptionsList.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                                  Không có bản ghi gói đăng ký nào
                                </td>
                              </tr>
                            ) : (
                              subscriptionsList.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-500 font-mono">#{sub.id}</td>
                                  <td className="py-3.5 px-5">
                                    <div className="font-bold text-gray-900 dark:text-zinc-100">{sub.user_name}</div>
                                    <div className="text-[10px] text-gray-400 dark:text-zinc-400">{sub.user_email}</div>
                                  </td>
                                  <td className="py-3.5 px-5 font-bold text-gray-800 dark:text-zinc-200">
                                    {sub.plan_name || sub.plan}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                      sub.status === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
                                      sub.status === "PAST_DUE" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse" :
                                      sub.status === "CANCELLED" ? "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800" :
                                      "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700"
                                    }`}>
                                      {sub.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-500 dark:text-zinc-400 text-[11px]">
                                    {new Date(sub.start_date).toLocaleDateString("vi-VN")}
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-900 dark:text-zinc-100 font-bold text-[11px]">
                                    {new Date(sub.end_date).toLocaleDateString("vi-VN")}
                                    {sub.past_due_until && sub.status === "PAST_DUE" && (
                                      <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-normal">
                                        Ân hạn đến: {new Date(sub.past_due_until).toLocaleDateString("vi-VN")}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                      sub.auto_renew ? "bg-green-50 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400"
                                    }`}>
                                      {sub.auto_renew ? "Bật" : "Tắt"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                    {sub.status === "ACTIVE" && (
                                      <button
                                        onClick={() => handleCancelSub(sub.id)}
                                        className="px-2.5 py-1 bg-red-50 dark:bg-rose-950/40 text-red-600 dark:text-rose-400 hover:bg-red-100 dark:hover:bg-rose-900/50 rounded-lg text-[10px] font-bold transition-all"
                                      >
                                        Hủy gia hạn
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Payment Orders Table */}
                  {subViewMode === "orders" && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <Search size={14} className="text-gray-400 dark:text-zinc-400" />
                          <input
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && loadSubscriptionsData(undefined, 1)}
                            placeholder="Tìm theo mã đơn, email..."
                            className="w-full text-xs py-1.5 px-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none text-gray-900 dark:text-zinc-100"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <select
                            value={orderStatusFilter}
                            onChange={(e) => {
                              setOrderStatusFilter(e.target.value);
                              loadSubscriptionsData(undefined, 1);
                            }}
                            className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-200"
                          >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="COMPLETED">COMPLETED (Thành công)</option>
                            <option value="PENDING">PENDING (Chờ thanh toán)</option>
                            <option value="FAILED">FAILED (Thất bại / Hết hạn)</option>
                          </select>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#0D2B24] text-[10px] font-bold text-white/90 uppercase tracking-wider">
                              <th className="py-3.5 px-5">Mã đơn (#OrderCode)</th>
                              <th className="py-3.5 px-5">Người mua</th>
                              <th className="py-3.5 px-5">Gói cước</th>
                              <th className="py-3.5 px-5">Số tiền</th>
                              <th className="py-3.5 px-5">Cổng</th>
                              <th className="py-3.5 px-5">Trạng thái</th>
                              <th className="py-3.5 px-5">Thời gian tạo</th>
                              <th className="py-3.5 px-5">Thời gian trả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                            {ordersList.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                                  Chưa ghi nhận đơn thanh toán nào
                                </td>
                              </tr>
                            ) : (
                              ordersList.map((ord) => (
                                <tr key={ord.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                                  <td className="py-3.5 px-5 font-mono font-bold text-gray-800 dark:text-zinc-200">#{ord.order_code}</td>
                                  <td className="py-3.5 px-5">
                                    <div className="font-bold text-gray-900 dark:text-zinc-100">{ord.user_name}</div>
                                    <div className="text-[10px] text-gray-400 dark:text-zinc-400 font-mono">{ord.user_email}</div>
                                  </td>
                                  <td className="py-3.5 px-5 font-bold text-gray-700 dark:text-zinc-300">{ord.plan_name || "Gói Pro"}</td>
                                  <td className="py-3.5 px-5 font-extrabold text-emerald-600 dark:text-emerald-400">
                                    {parseFloat(ord.amount).toLocaleString()} đ
                                  </td>
                                  <td className="py-3.5 px-5 font-mono text-[10px] text-gray-500 dark:text-zinc-400 uppercase">{ord.payment_gateway}</td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                      ord.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" :
                                      ord.status === "PENDING" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800" :
                                      "bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 border border-red-200 dark:border-rose-800"
                                    }`}>
                                      {ord.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-400 text-[11px]">
                                    {new Date(ord.created_at).toLocaleString("vi-VN")}
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-400 text-[11px]">
                                    {ord.paid_at ? new Date(ord.paid_at).toLocaleString("vi-VN") : "—"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: DOCUMENTS MANAGEMENT                              */}
              {/* ======================================================== */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  
                  {/* Search & Visibility Filter */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400" />
                      <input
                        value={docSearch}
                        onChange={(e) => setDocSearch(e.target.value)}
                        placeholder="Tìm tài liệu theo tiêu đề, tác giả, danh mục..."
                        className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 bg-gray-50/50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <select
                        value={docVisibilityFilter}
                        onChange={(e) => setDocVisibilityFilter(e.target.value)}
                        className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-none"
                      >
                        <option value="all">Tất cả chế độ xem</option>
                        <option value="public">Công khai (Public / Community)</option>
                        <option value="private">Cá nhân (Private)</option>
                      </select>
                    </div>
                  </div>

                  {/* Documents Table */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0D2B24] text-[10px] font-bold text-white/90 uppercase tracking-wider">
                            <th className="py-3.5 px-5">ID</th>
                            <th className="py-3.5 px-5">Tiêu đề tài liệu</th>
                            <th className="py-3.5 px-5">Tác giả</th>
                            <th className="py-3.5 px-5">Danh mục</th>
                            <th className="py-3.5 px-5">Chế độ</th>
                            <th className="py-3.5 px-5">Dung lượng</th>
                            <th className="py-3.5 px-5">Ngày tạo</th>
                            <th className="py-3.5 px-5 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                          {documents.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                                Không tìm thấy tài liệu nào
                              </td>
                            </tr>
                          ) : (
                            documents.map((d) => {
                              const isPublic = d.visibility === "public" || d.is_community_published;
                              const sizeInMb = d.file_size ? (d.file_size / (1024 * 1024)).toFixed(2) : "0.0";
                              return (
                                <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-500 font-mono">#{d.id}</td>
                                  <td className="py-3.5 px-5">
                                    <p className="font-bold text-gray-900 dark:text-zinc-100 max-w-[240px] truncate" title={d.title}>
                                      {d.title}
                                    </p>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-mono">{d.file_type || "PDF"}</span>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <div className="font-bold text-gray-800 dark:text-zinc-200">{d.author_name}</div>
                                    <div className="text-[10px] text-gray-400 dark:text-zinc-400 font-mono">{d.author_email}</div>
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-600 dark:text-zinc-300">{d.category || "Học tập"}</td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isPublic ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
                                    }`}>
                                      {isPublic ? "Công khai" : "Cá nhân"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-5 text-gray-500 dark:text-zinc-400 font-mono text-[11px]">{sizeInMb} MB</td>
                                  <td className="py-3.5 px-5 text-gray-400 dark:text-zinc-400 text-[11px]">
                                    {new Date(d.created_at).toLocaleDateString("vi-VN")}
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                    <button
                                      onClick={() => confirmDelete(d.id, "document")}
                                      className="p-1.5 text-gray-400 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                      title="Xóa tài liệu vi phạm"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 5: CONTENT MODERATION & SAFETY (PHASE 13)            */}
              {/* ======================================================== */}
              {activeTab === "moderation" && (
                <div className="space-y-6">
                  
                  {/* Moderation Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-rose-950/40 flex items-center justify-center text-red-600 dark:text-rose-400">
                        <Flag size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Chờ xử lý</span>
                        <p className="text-xl font-black text-red-600 dark:text-rose-400">
                          {moderationStats?.pendingReports ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Check size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Đã giải quyết</span>
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                          {stats?.resolvedReports ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <UserX size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Tài khoản bị khóa</span>
                        <p className="text-xl font-black text-purple-700 dark:text-purple-400">
                          {moderationStats?.suspendedUsers ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Clock size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Nhật ký kiểm duyệt</span>
                        <p className="text-xl font-black text-gray-800 dark:text-zinc-100">
                          {moderationHistory?.length ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SubTabs: Queue vs History */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModerationSubTab("queue")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          moderationSubTab === "queue" ? "bg-[#0D2B24] text-white" : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Hàng đợi báo cáo ({moderationReports.length})
                      </button>
                      <button
                        onClick={() => setModerationSubTab("history")}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          moderationSubTab === "history" ? "bg-[#0D2B24] text-white" : "text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        Nhật ký kiểm duyệt ({moderationHistory.length})
                      </button>
                    </div>

                    <select
                      value={moderationStatusFilter}
                      onChange={(e) => {
                        const s = e.target.value as any;
                        setModerationStatusFilter(s);
                        loadModerationData(s, moderationTypeFilter);
                      }}
                      className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-zinc-200"
                    >
                      <option value="PENDING">Chờ xử lý</option>
                      <option value="RESOLVED">Đã giải quyết</option>
                      <option value="DISMISSED">Đã bác bỏ</option>
                      <option value="ALL">Tất cả</option>
                    </select>
                  </div>

                  {/* Queue Table */}
                  {moderationSubTab === "queue" && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0D2B24] text-white uppercase text-[10px] font-extrabold tracking-wider">
                            <tr>
                              <th className="py-3 px-4">ID</th>
                              <th className="py-3 px-4">Đối tượng</th>
                              <th className="py-3 px-4">Lý do</th>
                              <th className="py-3 px-4">Chi tiết</th>
                              <th className="py-3 px-4">Người báo cáo</th>
                              <th className="py-3 px-4">Trạng thái</th>
                              <th className="py-3 px-4 text-right">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                            {moderationReports.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                                  Hàng đợi kiểm duyệt hiện đang trống!
                                </td>
                              </tr>
                            ) : (
                              moderationReports.map((rep) => (
                                <tr key={rep.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                                  <td className="py-3 px-4 font-mono font-bold text-gray-500 dark:text-zinc-400">#{rep.id}</td>
                                  <td className="py-3 px-4">
                                    <span className="font-bold text-gray-900 dark:text-zinc-100 block">{rep.target_type} #{rep.target_id}</span>
                                    <span className="text-[10px] text-gray-400 dark:text-zinc-400">{rep.target_title || ""}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 border border-red-200 dark:border-rose-800">
                                      {rep.reason}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600 dark:text-zinc-300 max-w-[200px] truncate">{rep.details || "—"}</td>
                                  <td className="py-3 px-4">
                                    <p className="font-bold text-gray-800 dark:text-zinc-200">{rep.reporter_name || `User #${rep.reporter_id}`}</p>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      rep.status === "PENDING" ? "bg-red-100 dark:bg-rose-950/50 text-red-800 dark:text-rose-300" : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                                    }`}>
                                      {rep.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {rep.status === "PENDING" && (
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => handleOpenModerationAction(rep, "KEEP")}
                                          className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded text-[10px] font-bold"
                                        >
                                          Giữ lại
                                        </button>
                                        <button
                                          onClick={() => handleOpenModerationAction(rep, "HIDE")}
                                          className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded text-[10px] font-bold"
                                        >
                                          Ẩn
                                        </button>
                                        <button
                                          onClick={() => handleOpenModerationAction(rep, "REMOVE")}
                                          className="px-2 py-1 bg-red-50 dark:bg-rose-950/40 text-red-700 dark:text-rose-400 hover:bg-red-100 dark:hover:bg-rose-900/50 rounded text-[10px] font-bold"
                                        >
                                          Xóa
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* History Table */}
                  {moderationSubTab === "history" && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#0D2B24] text-white uppercase text-[10px] font-extrabold tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Thời gian</th>
                              <th className="py-3 px-4">Admin</th>
                              <th className="py-3 px-4">Hành động</th>
                              <th className="py-3 px-4">Mục tiêu</th>
                              <th className="py-3 px-4">Lý do</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 font-medium">
                            {moderationHistory.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                                  Chưa ghi nhận lịch sử kiểm duyệt
                                </td>
                              </tr>
                            ) : (
                              moderationHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                                  <td className="py-3 px-4 text-gray-400 dark:text-zinc-400 text-[11px]">
                                    {new Date(item.created_at).toLocaleString("vi-VN")}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-zinc-100">{item.admin_name}</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200">
                                      {item.action}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-300">{item.target_type} #{item.target_id}</td>
                                  <td className="py-3 px-4 text-gray-800 dark:text-zinc-200">{item.reason}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION 5: FEEDBACKS MANAGEMENT & ANALYTICS */}
              {activeTab === "feedbacks" && (
                <div className="space-y-8">
                  {/* Top Analytics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Average Rating */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shrink-0">
                          <Star size={24} className="fill-amber-400" />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Điểm đánh giá TB
                          </span>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-extrabold text-gray-900">
                              {feedbackStats ? feedbackStats.averageRating.toFixed(1) : '5.0'}
                            </span>
                            <span className="text-xs font-semibold text-gray-400">/ 5.0</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={`${
                              star <= Math.round(feedbackStats?.averageRating || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] text-gray-500 font-medium ml-1.5">
                          {feedbackStats?.totalFeedbacks || 0} lượt đánh giá
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Satisfaction Rate */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                          <ThumbsUp size={22} />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Tỉ lệ hài lòng
                          </span>
                          <span className="text-2xl font-extrabold text-emerald-700 mt-0.5 block">
                            {feedbackStats ? feedbackStats.satisfactionRate : 100}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${feedbackStats ? feedbackStats.satisfactionRate : 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Đánh giá 4 sao và 5 sao</p>
                      </div>
                    </div>

                    {/* Card 3: Total Feedbacks */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                          <MessageSquareHeart size={22} />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Tổng ý kiến gửi về
                          </span>
                          <span className="text-2xl font-extrabold text-gray-900 mt-0.5 block">
                            {feedbackStats?.totalFeedbacks || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-3">
                        Từ người dùng & khách trải nghiệm web
                      </p>
                    </div>

                    {/* Card 4: Top Feedback Category / Feature Proposals */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-300" />
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                          <Lightbulb size={22} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Đề xuất tính năng mới
                          </span>
                          <span className="text-2xl font-extrabold text-purple-700 mt-0.5 block">
                            {feedbackStats?.categoryCounts?.['Đề xuất tính năng mới'] || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-3 truncate">
                        Gợi ý nâng cấp hệ thống thực tế
                      </p>
                    </div>
                  </div>

                  {/* Rating Breakdown & Category Stats Banner */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Star Rating Breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-4 flex items-center justify-between">
                        <span>Phân bổ số sao</span>
                        <span className="text-[11px] text-emerald-600 font-semibold lowercase">
                          (bấm sao để lọc nhanh)
                        </span>
                      </h3>
                      <div className="space-y-2.5">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const count = feedbackStats?.distribution?.[s] || 0;
                          const total = feedbackStats?.totalFeedbacks || 1;
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          const isSelected = feedbackFilterRating === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setFeedbackFilterRating(isSelected ? 'all' : s)}
                              className={`w-full flex items-center gap-3 text-xs p-1.5 rounded-xl transition-all ${
                                isSelected ? 'bg-amber-50 ring-1 ring-amber-400' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-1 w-14 shrink-0 font-bold text-gray-700">
                                <span>{s}</span>
                                <Star size={12} className="text-amber-400 fill-amber-400" />
                              </div>
                              <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    s >= 4 ? 'bg-emerald-500' : s === 3 ? 'bg-amber-400' : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="w-16 text-right font-mono text-[11px] text-gray-500 shrink-0">
                                {count} <span className="text-gray-400">({pct}%)</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-4 flex items-center justify-between">
                          <span>Chủ đề người dùng phản hồi</span>
                          <span className="text-[11px] text-gray-400 font-normal">
                            Tổng cộng {feedbackStats?.totalFeedbacks || 0} đóng góp
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'Giao diện & Trải nghiệm', label: '🎨 Giao diện & Trải nghiệm', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
                            { id: 'Tốc độ AI & Trợ lý', label: '⚡ Tốc độ AI & Trợ lý', color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
                            { id: 'Flashcards & Ôn tập', label: '🎴 Flashcards & Ôn tập', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
                            { id: 'Trắc nghiệm & Đề thi', label: '📝 Trắc nghiệm & Đề thi', color: 'border-cyan-200 bg-cyan-50/50 text-cyan-700' },
                            { id: 'Đề xuất tính năng mới', label: '💡 Đề xuất tính năng mới', color: 'border-purple-200 bg-purple-50/50 text-purple-700' },
                            { id: 'Báo lỗi (Bug)', label: '🐞 Báo lỗi hệ thống', color: 'border-rose-200 bg-rose-50/50 text-rose-700' },
                          ].map((cat) => {
                            const count = feedbackStats?.categoryCounts?.[cat.id] || 0;
                            const isSelected = feedbackFilterCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setFeedbackFilterCategory(isSelected ? 'all' : cat.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'ring-2 ring-emerald-500 bg-emerald-50 font-bold border-emerald-400'
                                    : `${cat.color} hover:shadow-sm`
                                }`}
                              >
                                <span className="block text-[11px] font-bold truncate">{cat.label}</span>
                                <span className="text-lg font-black mt-1 block">
                                  {count} <span className="text-[10px] font-normal opacity-70">ý kiến</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <span>💡 Dùng dữ liệu này để quyết định lộ trình phát triển (Roadmap) tiếp theo của Cognito.</span>
                        {(feedbackFilterRating !== 'all' || feedbackFilterCategory !== 'all' || feedbackSearch) && (
                          <button
                            onClick={() => {
                              setFeedbackFilterRating('all');
                              setFeedbackFilterCategory('all');
                              setFeedbackSearch('');
                            }}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                          >
                            Xóa bộ lọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-96">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={feedbackSearch}
                        onChange={(e) => setFeedbackSearch(e.target.value)}
                        placeholder="Tìm theo tên, email, nội dung góp ý..."
                        className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 font-medium"
                      />
                      {feedbackSearch && (
                        <button
                          onClick={() => setFeedbackSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {/* Rating Filter Dropdown */}
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500">Sao:</span>
                        <select
                          value={feedbackFilterRating}
                          onChange={(e) =>
                            setFeedbackFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))
                          }
                          className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="all">Tất cả sao</option>
                          <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                          <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                          <option value="3">⭐⭐⭐ (3 sao)</option>
                          <option value="2">⭐⭐ (2 sao)</option>
                          <option value="1">⭐ (1 sao)</option>
                        </select>
                      </div>

                      {/* Category Filter Dropdown */}
                      <select
                        value={feedbackFilterCategory}
                        onChange={(e) => setFeedbackFilterCategory(e.target.value)}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">Tất cả chủ đề</option>
                        <option value="Giao diện & Trải nghiệm">🎨 Giao diện & Trải nghiệm</option>
                        <option value="Tốc độ AI & Trợ lý">⚡ Tốc độ AI & Trợ lý</option>
                        <option value="Flashcards & Ôn tập">🎴 Flashcards & Ôn tập</option>
                        <option value="Trắc nghiệm & Đề thi">📝 Trắc nghiệm & Đề thi</option>
                        <option value="Đề xuất tính năng mới">💡 Đề xuất tính năng mới</option>
                        <option value="Báo lỗi (Bug)">🐞 Báo lỗi hệ thống</option>
                      </select>

                      <button
                        onClick={loadFeedbacks}
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-gray-200 transition-colors"
                        title="Làm mới danh sách đánh giá"
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Feedback List */}
                  {(() => {
                    const filtered = feedbacks.filter((fb) => {
                      if (feedbackFilterRating !== 'all' && fb.rating !== feedbackFilterRating) return false;
                      if (feedbackFilterCategory !== 'all' && fb.category !== feedbackFilterCategory) return false;
                      if (feedbackSearch.trim()) {
                        const q = feedbackSearch.toLowerCase();
                        const matchName = fb.user_name?.toLowerCase().includes(q);
                        const matchEmail = fb.user_email?.toLowerCase().includes(q);
                        const matchComment = fb.comment?.toLowerCase().includes(q);
                        const matchCat = fb.category?.toLowerCase().includes(q);
                        if (!matchName && !matchEmail && !matchComment && !matchCat) return false;
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="p-12 rounded-3xl border border-dashed border-gray-300 bg-white text-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100">
                            <MessageSquareHeart size={28} />
                          </div>
                          <h4 className="font-extrabold text-gray-800 text-sm">
                            {feedbacks.length === 0
                              ? 'Chưa có đánh giá nào từ người dùng'
                              : 'Không tìm thấy đánh giá phù hợp bộ lọc'}
                          </h4>
                          <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                            {feedbacks.length === 0
                              ? 'Nút đánh giá trải nghiệm đang hiển thị ở góc phải người dùng. Mọi ý kiến đóng góp sẽ được lưu tự động tại đây.'
                              : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-gray-500">
                            Hiển thị {filtered.length} / {feedbacks.length} đánh giá
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filtered.map((item) => {
                            const isFeatureProposal = item.category === 'Đề xuất tính năng mới';
                            const isBug = item.category === 'Báo lỗi (Bug)';

                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative ${
                                  isFeatureProposal
                                    ? 'border-purple-200/80 bg-gradient-to-b from-purple-50/20 to-white'
                                    : isBug
                                    ? 'border-rose-200/80 bg-gradient-to-b from-rose-50/20 to-white'
                                    : 'border-gray-200/80'
                                }`}
                              >
                                <div>
                                  {/* Card Header */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                                          item.user_id
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}
                                      >
                                        {(item.user_name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-extrabold text-sm text-gray-900 truncate">
                                            {item.user_name || 'Khách truy cập'}
                                          </h4>
                                          {item.user_id ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                              Thành viên #{item.user_id}
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gray-100 text-gray-500 shrink-0">
                                              Chưa đăng nhập
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                          {item.user_email || 'Chưa cung cấp email'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => confirmDelete(item.id, 'feedback')}
                                      className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                      title="Xóa đánh giá này"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>

                                  {/* Star Rating & Category Badges */}
                                  <div className="flex flex-wrap items-center gap-2 mt-3.5">
                                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/70">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          size={12}
                                          className={`${
                                            s <= item.rating
                                              ? 'text-amber-400 fill-amber-400'
                                              : 'text-gray-200'
                                          }`}
                                        />
                                      ))}
                                      <span className="text-[11px] font-extrabold text-amber-700 ml-1">
                                        {item.rating}/5
                                      </span>
                                    </div>

                                    <span
                                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                                        isFeatureProposal
                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                          : isBug
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      }`}
                                    >
                                      {item.category}
                                    </span>

                                    {item.page_url && (
                                      <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 font-mono truncate max-w-[140px]" title={`Trang gửi: ${item.page_url}`}>
                                        {item.page_url}
                                      </span>
                                    )}
                                  </div>

                                  {/* Comment Quote Content */}
                                  <div className="mt-3.5 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 text-xs text-gray-800 leading-relaxed font-normal whitespace-pre-wrap">
                                    "{item.comment}"
                                  </div>
                                </div>

                                {/* Card Footer Timestamp */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                                  <span className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(item.created_at).toLocaleString('vi-VN')}
                                  </span>
                                  {isFeatureProposal && (
                                    <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1">
                                      <Lightbulb size={11} /> Đề xuất tính năng
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: USER DETAILS (ZERO-LEAKAGE PRIVACY)             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {detailsModalOpen && detailsUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF8F5] dark:bg-zinc-900 rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col text-left font-sans"
            >
              {/* Header */}
              <div className="bg-[#0D2B24] text-white px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-lg border border-white/10">
                    {detailsUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2">
                      {detailsUser.name}
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${
                        detailsUser.role === "admin" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      }`}>
                        {detailsUser.role === "admin" ? "Quản trị viên" : "Thành viên"}
                      </span>
                      {detailsUser.is_suspended && (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-red-600 text-white">
                          Đã tạm khóa
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-bold text-emerald-300/80 mt-0.5">{detailsUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sub-Header Metrics */}
              <div className="bg-white dark:bg-zinc-900/90 border-b border-gray-200 dark:border-zinc-800 px-6 py-3.5 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0 text-left text-xs">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Gói cước</span>
                  <p className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                    {detailsUser.is_premium ? "Pro Premium" : "Free"}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Trạng thái</span>
                  <p className="font-extrabold mt-0.5">
                    {detailsUser.is_suspended ? (
                      <span className="text-red-600 dark:text-red-400">Tạm khóa</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">Hoạt động</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Cảnh báo</span>
                  <p className="font-extrabold text-gray-700 dark:text-zinc-300 mt-0.5">{detailsUser.warning_count || 0} lần</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Ngày tham gia</span>
                  <p className="font-bold text-gray-700 dark:text-zinc-300 mt-0.5">{new Date(detailsUser.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>

              {/* Tabs inside modal */}
              <div className="bg-white dark:bg-zinc-900/90 border-b border-gray-200 dark:border-zinc-800 px-6 flex gap-4 shrink-0 overflow-x-auto">
                <button
                  onClick={() => setDetailsTab("profile")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all ${
                    detailsTab === "profile" ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400" : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                >
                  Thông tin tài khoản
                </button>
                <button
                  onClick={() => setDetailsTab("subs")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all ${
                    detailsTab === "subs" ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400" : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                >
                  Gói cước & Đơn thanh toán ({detailsData?.subscriptions?.length || 0})
                </button>
                <button
                  onClick={() => setDetailsTab("learning")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all ${
                    detailsTab === "learning" ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400" : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                >
                  Thống kê học tập
                </button>
                <button
                  onClick={() => setDetailsTab("docs")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all ${
                    detailsTab === "docs" ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400" : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                >
                  Tài liệu công khai ({detailsData?.publicDocuments?.length || 0})
                </button>
                <button
                  onClick={() => setDetailsTab("reports")}
                  className={`py-3 text-xs font-bold border-b-2 transition-all ${
                    detailsTab === "reports" ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400" : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
                  }`}
                >
                  Báo cáo vi phạm ({detailsData?.reports?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6">
                {detailsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <p className="mt-2 text-xs font-bold text-gray-400 dark:text-zinc-500">Đang tải thông tin chi tiết...</p>
                  </div>
                ) : detailsError ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-red-500 dark:text-red-400">
                    <AlertTriangle className="w-8 h-8" />
                    <p className="mt-2 text-xs font-bold">{detailsError}</p>
                  </div>
                ) : detailsData ? (
                  <>
                    {/* TAB: PROFILE */}
                    {detailsTab === "profile" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 space-y-3">
                          <h4 className="font-extrabold text-[#0D2B24] dark:text-emerald-400 uppercase text-[11px] border-b border-gray-100 dark:border-zinc-700 pb-2">Hồ sơ cá nhân</h4>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Họ và tên:</span><span className="font-bold text-gray-900 dark:text-zinc-100">{detailsUser.name}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Email:</span><span className="font-mono text-gray-900 dark:text-zinc-200">{detailsUser.email}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Số điện thoại:</span><span className="text-gray-800 dark:text-zinc-200">{detailsUser.phone || "Chưa cập nhật"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Học vấn:</span><span className="text-gray-800 dark:text-zinc-200">{detailsUser.education || "Chưa cập nhật"}</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Địa chỉ:</span><span className="text-gray-800 dark:text-zinc-200">{detailsUser.address || "Chưa cập nhật"}</span></div>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/80 p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 space-y-3">
                          <h4 className="font-extrabold text-[#0D2B24] dark:text-emerald-400 uppercase text-[11px] border-b border-gray-100 dark:border-zinc-700 pb-2">Trạng thái an toàn</h4>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Trạng thái tài khoản:</span><span className="font-bold text-gray-900 dark:text-zinc-100">{detailsUser.is_suspended ? "Đang bị khóa" : "Bình thường"}</span></div>
                          {detailsUser.suspension_reason && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-700 dark:text-red-300 text-[11px] border border-red-100 dark:border-red-900/50">
                              Lý do khóa: {detailsUser.suspension_reason}
                            </div>
                          )}
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Số lần bị cảnh cáo:</span><span className="font-bold text-gray-900 dark:text-zinc-100">{detailsUser.warning_count || 0} lần</span></div>
                          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-400">Hạn dùng Premium:</span><span className="text-gray-800 dark:text-zinc-200">{detailsUser.premium_until ? new Date(detailsUser.premium_until).toLocaleDateString("vi-VN") : "Không có"}</span></div>
                        </div>
                      </div>
                    )}

                    {/* TAB: SUBSCRIPTIONS & ORDERS */}
                    {detailsTab === "subs" && (
                      <div className="space-y-6 text-xs">
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-zinc-200 mb-2">Lịch sử đăng ký gói</h4>
                          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-400">
                                <tr>
                                  <th className="p-3">Gói</th>
                                  <th className="p-3">Trạng thái</th>
                                  <th className="p-3">Bắt đầu</th>
                                  <th className="p-3">Kết thúc</th>
                                  <th className="p-3">Tự động gia hạn</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60 font-medium">
                                {detailsData.subscriptions && detailsData.subscriptions.length > 0 ? (
                                  detailsData.subscriptions.map((s: any) => (
                                    <tr key={s.id}>
                                      <td className="p-3 font-bold text-gray-900 dark:text-zinc-100">{s.plan_name || s.plan}</td>
                                      <td className="p-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">{s.status}</span>
                                      </td>
                                      <td className="p-3 text-gray-500 dark:text-zinc-400">{new Date(s.start_date).toLocaleDateString("vi-VN")}</td>
                                      <td className="p-3 text-gray-800 dark:text-zinc-200 font-bold">{new Date(s.end_date).toLocaleDateString("vi-VN")}</td>
                                      <td className="p-3 text-gray-700 dark:text-zinc-300">{s.auto_renew ? "Bật" : "Tắt"}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr><td colSpan={5} className="p-6 text-center text-gray-400 dark:text-zinc-500">Người dùng chưa đăng ký gói nào</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-zinc-200 mb-2">Lịch sử đơn thanh toán</h4>
                          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-400">
                                <tr>
                                  <th className="p-3">Mã đơn</th>
                                  <th className="p-3">Số tiền</th>
                                  <th className="p-3">Cổng</th>
                                  <th className="p-3">Trạng thái</th>
                                  <th className="p-3">Ngày tạo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60 font-medium">
                                {detailsData.paymentOrders && detailsData.paymentOrders.length > 0 ? (
                                  detailsData.paymentOrders.map((o: any) => (
                                    <tr key={o.id}>
                                      <td className="p-3 font-mono font-bold text-gray-900 dark:text-zinc-100">#{o.order_code}</td>
                                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">{parseFloat(o.amount).toLocaleString()} đ</td>
                                      <td className="p-3 font-mono uppercase text-[10px] text-gray-700 dark:text-zinc-300">{o.payment_gateway}</td>
                                      <td className="p-3">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">{o.status}</span>
                                      </td>
                                      <td className="p-3 text-gray-400 dark:text-zinc-500">{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr><td colSpan={5} className="p-6 text-center text-gray-400 dark:text-zinc-500">Chưa có giao dịch thanh toán</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB: LEARNING STATS (SAFE AGGREGATES) */}
                    {detailsTab === "learning" && detailsData.learningMetrics && (
                      <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                          🛡️ <strong>Chính sách Bảo mật Quyền Riêng tư:</strong> Hệ thống chỉ hiển thị số lượng tổng hợp tài nguyên học tập của người dùng. Nội dung các tài liệu cá nhân, hội thoại trợ lý AI và chi tiết các câu trả lời trắc nghiệm riêng tư không được phép truy cập trái phép.
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Tổng tài liệu đã tạo</span>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100 mt-1">{detailsData.learningMetrics.docs_count || 0}</p>
                            <span className="text-[10px] text-gray-500 dark:text-zinc-400">({detailsData.learningMetrics.public_docs_count || 0} công khai)</span>
                          </div>

                          <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Bộ thẻ Flashcard</span>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100 mt-1">{detailsData.learningMetrics.decks_count || 0}</p>
                          </div>

                          <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Bộ đề kiểm tra</span>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100 mt-1">{detailsData.learningMetrics.test_sets_count || 0}</p>
                          </div>

                          <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Sơ đồ Mindmap</span>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100 mt-1">{detailsData.learningMetrics.mindmaps_count || 0}</p>
                          </div>

                          <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Số phiên tự học</span>
                            <p className="text-xl font-black text-gray-900 dark:text-zinc-100 mt-1">{detailsData.learningMetrics.study_sessions_count || 0}</p>
                          </div>

                          <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-gray-200 dark:border-zinc-700">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase">Thời gian học tập</span>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                              {Math.round((detailsData.learningMetrics.total_study_seconds || 0) / 60)} phút
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB: PUBLIC DOCUMENTS */}
                    {detailsTab === "docs" && (
                      <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-400">
                            <tr>
                              <th className="p-3">Tiêu đề</th>
                              <th className="p-3">Danh mục</th>
                              <th className="p-3">Giá</th>
                              <th className="p-3">Ngày đăng</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60 font-medium">
                            {detailsData.publicDocuments && detailsData.publicDocuments.length > 0 ? (
                              detailsData.publicDocuments.map((d: any) => (
                                <tr key={d.id}>
                                  <td className="p-3 font-bold text-gray-900 dark:text-zinc-100">{d.title}</td>
                                  <td className="p-3 text-gray-600 dark:text-zinc-300">{d.category || "Học tập"}</td>
                                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">{d.price === 0 ? "Miễn phí" : `${d.price} Xu`}</td>
                                  <td className="p-3 text-gray-400 dark:text-zinc-500">{new Date(d.created_at).toLocaleDateString("vi-VN")}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan={4} className="p-6 text-center text-gray-400 dark:text-zinc-500">Người dùng chưa xuất bản tài liệu công khai nào</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TAB: REPORTS */}
                    {detailsTab === "reports" && (
                      <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-gray-50 dark:bg-zinc-800 text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-400">
                            <tr>
                              <th className="p-3">Lý do</th>
                              <th className="p-3">Chi tiết</th>
                              <th className="p-3">Trạng thái</th>
                              <th className="p-3">Hành động đã xử lý</th>
                              <th className="p-3">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/60 font-medium">
                            {detailsData.reports && detailsData.reports.length > 0 ? (
                              detailsData.reports.map((r: any) => (
                                <tr key={r.id}>
                                  <td className="p-3 font-bold text-red-600 dark:text-red-400">{r.reason}</td>
                                  <td className="p-3 text-gray-600 dark:text-zinc-300">{r.details || "—"}</td>
                                  <td className="p-3 text-gray-700 dark:text-zinc-300">{r.status}</td>
                                  <td className="p-3 text-gray-700 dark:text-zinc-300">{r.action_taken || "Chưa xử lý"}</td>
                                  <td className="p-3 text-gray-400 dark:text-zinc-500">{new Date(r.created_at).toLocaleDateString("vi-VN")}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan={5} className="p-6 text-center text-gray-400 dark:text-zinc-500">Không có báo cáo vi phạm nào đối với người dùng này</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 px-6 py-3.5 flex justify-end shrink-0">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-xs text-gray-700 dark:text-zinc-200 rounded-xl transition-all"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 2: SUSPEND USER CONFIRMATION                       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {suspendModalOpen && suspendingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full shadow-2xl border border-red-100 dark:border-red-900/40 overflow-hidden text-left font-sans"
            >
              <div className="bg-red-50 dark:bg-red-950/40 p-6 border-b border-red-100 dark:border-red-900/40 flex items-center gap-3">
                <div className="p-2.5 bg-red-600 text-white rounded-2xl">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-zinc-100">Đình chỉ tài khoản</h3>
                  <p className="text-[10px] text-red-700 dark:text-red-300 font-medium">Khóa quyền truy cập hệ thống của người dùng</p>
                </div>
              </div>

              <form onSubmit={handleExecuteSuspend} className="p-6 space-y-4">
                <div className="text-xs text-gray-600 dark:text-zinc-300">
                  Bạn đang chuẩn bị khóa tài khoản của <strong>{suspendingUser.name}</strong> ({suspendingUser.email}).
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">
                    Lý do đình chỉ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Nhập lý do đình chỉ tài khoản (ví dụ: Vi phạm điều khoản dịch vụ nhiều lần)..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:border-red-500 bg-gray-50/50 dark:bg-zinc-800 resize-none font-semibold text-gray-800 dark:text-zinc-100"
                    disabled={isSubmittingSuspend}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Ghi chú nội bộ</label>
                  <input
                    value={suspensionNotes}
                    onChange={(e) => setSuspensionNotes(e.target.value)}
                    placeholder="Ghi chú thêm cho ban quản trị..."
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none bg-gray-50/50 dark:bg-zinc-800 font-semibold text-gray-800 dark:text-zinc-100"
                    disabled={isSubmittingSuspend}
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSuspendModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-xs text-gray-600 dark:text-zinc-300 rounded-xl"
                    disabled={isSubmittingSuspend}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 font-bold text-xs text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    disabled={isSubmittingSuspend}
                  >
                    {isSubmittingSuspend ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                    <span>Xác nhận khóa</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 3: WARNING EMAIL MODAL                             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {warnModalOpen && warningUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full shadow-2xl border border-amber-100 dark:border-amber-900/40 overflow-hidden text-left font-sans"
            >
              <div className="bg-amber-50 dark:bg-amber-950/40 px-6 py-5 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-2xl">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-zinc-100">Gửi cảnh báo thành viên</h3>
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Email cảnh cáo vi phạm</p>
                  </div>
                </div>
                <button
                  onClick={() => setWarnModalOpen(false)}
                  className="text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1.5 rounded-xl"
                  disabled={isSendingWarning}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendWarning} className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-zinc-800 p-3 rounded-xl border border-gray-100 dark:border-zinc-700 text-xs">
                  <p className="text-gray-500 dark:text-zinc-400">Gửi tới: <strong className="text-gray-800 dark:text-zinc-100">{warningUser.name}</strong> ({warningUser.email})</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">
                    Nội dung cảnh báo <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    placeholder="Nhập nội dung cảnh báo chi tiết..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:border-amber-500 bg-gray-50/50 dark:bg-zinc-800 resize-none font-semibold text-gray-800 dark:text-zinc-100"
                    disabled={isSendingWarning}
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setWarnModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-xs text-gray-600 dark:text-zinc-300 rounded-xl"
                    disabled={isSendingWarning}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    disabled={isSendingWarning}
                  >
                    {isSendingWarning ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                    <span>Gửi cảnh báo</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 4: USER CREATE / UPDATE MODAL                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden font-sans border border-gray-100 dark:border-zinc-800"
            >
              <div className="bg-[#0D2B24] p-5 text-white flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <UserPlus size={16} />
                  <span>{editingUser ? "Chỉnh sửa thành viên" : "Tạo thành viên mới"}</span>
                </h3>
                <button onClick={() => setUserModalOpen(false)} className="text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                {userFormError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100 dark:border-red-900/40">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{userFormError}</span>
                  </div>
                )}

                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 font-semibold text-gray-900 dark:text-zinc-100"
                        disabled={isSubmittingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 font-semibold text-gray-900 dark:text-zinc-100"
                        disabled={isSubmittingUser}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">
                        Mật khẩu {editingUser && "(trống nếu giữ nguyên)"} {!editingUser && "*"}
                      </label>
                      <input
                        type="password"
                        required={!editingUser}
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 font-semibold text-gray-900 dark:text-zinc-100"
                        disabled={isSubmittingUser}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 font-semibold text-gray-900 dark:text-zinc-100"
                        disabled={isSubmittingUser}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Vai trò</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 font-bold text-gray-900 dark:text-zinc-100"
                      disabled={isSubmittingUser}
                    >
                      <option value="user">User (Thành viên)</option>
                      <option value="admin">Admin (Quản trị viên)</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setUserModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-xs text-gray-600 dark:text-zinc-300 rounded-xl"
                      disabled={isSubmittingUser}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                      disabled={isSubmittingUser}
                    >
                      {isSubmittingUser ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                      <span>{editingUser ? "Cập nhật" : "Tạo tài khoản"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 5: DELETE CONFIRMATION                             */}
      {/* ======================================================== */}
      <AnimatePresence>
        {deletingId && deleteType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 text-center font-sans shadow-2xl border border-gray-100 dark:border-zinc-800"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/50 mb-4 mx-auto text-red-600 dark:text-red-400">
                <Trash2 size={22} />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-zinc-100 uppercase">Xác nhận xóa đối tượng</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Hành động này là vĩnh viễn và không thể hoàn tác. Dữ liệu đối tượng được chọn sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setDeletingId(null); setDeleteType(null); }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-xs text-gray-600 dark:text-zinc-300 rounded-xl"
                  disabled={isDeleting}
                >
                  Hủy
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 font-bold text-xs text-white rounded-xl shadow-sm flex items-center justify-center gap-1"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : "Xóa vĩnh viễn"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MODAL 6: MODERATION ACTION (PHASE 13)                    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {moderationActionModalOpen && selectedReportForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden text-left font-sans"
            >
              <div className="bg-[#0D2B24] p-5 text-white flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Shield size={16} />
                  <span>Xử lý báo cáo vi phạm #{selectedReportForAction.id}</span>
                </h3>
                <button onClick={() => setModerationActionModalOpen(false)} className="text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={executeModerationAction} className="p-6 space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 text-xs text-gray-700 dark:text-zinc-300">
                  <p>Hành động chọn: <strong className="text-emerald-700 dark:text-emerald-400">{chosenAction}</strong></p>
                  <p className="text-gray-500 dark:text-zinc-400 mt-0.5">Mục tiêu: {selectedReportForAction.target_type} #{selectedReportForAction.target_id}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Lý do xử lý *</label>
                  <textarea
                    required
                    rows={3}
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 resize-none font-semibold text-gray-800 dark:text-zinc-100"
                    disabled={isSubmittingAction}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase mb-1">Ghi chú nội bộ</label>
                  <input
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800 font-semibold text-gray-800 dark:text-zinc-100"
                    disabled={isSubmittingAction}
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModerationActionModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-xs text-gray-600 dark:text-zinc-300 rounded-xl"
                    disabled={isSubmittingAction}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    disabled={isSubmittingAction}
                  >
                    {isSubmittingAction ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                    <span>Xác nhận xử lý</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
