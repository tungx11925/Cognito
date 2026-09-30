"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStudy } from '@/context/StudyContext';
import { Navbar } from '@/components/landing/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  HelpCircle,
  GitBranch,
  Layers,
  Heart,
  Bookmark,
  Share2,
  MessageSquare,
  Eye,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
  Clock,
  User as UserIcon,
  AlertCircle,
  X,
  Send,
  CornerDownRight,
  TrendingUp,
  Sparkles,
  Filter,
  Flag,
  UserX,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import RegisterModal from '@/components/auth/RegisterModal';
import {
  safetyService,
  ReportTargetType,
  ReportReason,
  BlockedUserItem,
} from '@/services/safety.service';
import {
  getCommunityFeed,
  publishResource,
  unpublishResource,
  toggleLikeResource,
  toggleSaveResource,
  reshareCommunityResource,
  listResourceComments,
  addResourceComment,
  deleteResourceComment,
  getUserPersonalResources,
  CommunityResourceItem,
  CommunityCommentItem,
  PersonalResourcesResponse,
  ResourceType,
  FeedTab,
} from '@/services/community.service';

const CATEGORIES = [
  'Tất cả',
  'Công nghệ thông tin',
  'Ngoại ngữ',
  'Kinh tế & Quản trị',
  'Y dược & Sức khỏe',
  'Toán học & Tự nhiên',
  'Khoa học xã hội',
  'Kỹ năng mềm',
  'Khác',
];

const RESOURCE_TYPES: Array<{ key: ResourceType | ''; label: string; icon: React.ElementType; color: string }> = [
  { key: '', label: 'Tất cả loại', icon: Sparkles, color: 'text-emerald-700' },
  { key: 'document', label: 'Tài liệu', icon: BookOpen, color: 'text-blue-600' },
  { key: 'test_set', label: 'Đề trắc nghiệm', icon: HelpCircle, color: 'text-amber-600' },
  { key: 'mindmap', label: 'Sơ đồ tư duy', icon: GitBranch, color: 'text-purple-600' },
  { key: 'flashcard_deck', label: 'Thẻ ghi nhớ', icon: Layers, color: 'text-emerald-600' },
];

export default function CommunityPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    showLoginModal,
    setShowLoginModal,
    activeUser,
    triggerMessage,
  } = useStudy();

  // Feed State
  const [activeTab, setActiveTab] = useState<FeedTab>('recent');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedType, setSelectedType] = useState<ResourceType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [resources, setResources] = useState<CommunityResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [personalResources, setPersonalResources] = useState<PersonalResourcesResponse | null>(null);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [publishForm, setPublishForm] = useState<{
    resourceType: ResourceType;
    resourceId: number | '';
    title: string;
    description: string;
    category: string;
    tagsInput: string;
  }>({
    resourceType: 'document',
    resourceId: '',
    title: '',
    description: '',
    category: 'Công nghệ thông tin',
    tagsInput: '',
  });
  const [isPublishing, setIsPublishing] = useState(false);

  // Reshare Modal State
  const [reshareTarget, setReshareTarget] = useState<CommunityResourceItem | null>(null);
  const [reshareNote, setReshareNote] = useState('');
  const [isResharing, setIsResharing] = useState(false);

  // Comments Modal / Drawer State
  const [commentsTarget, setCommentsTarget] = useState<CommunityResourceItem | null>(null);
  const [commentsList, setCommentsList] = useState<CommunityCommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyParent, setReplyParent] = useState<CommunityCommentItem | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Safety: Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetType: ReportTargetType;
    targetId: number;
    title: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('INAPPROPRIATE');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Safety: Block User Modal State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockTargetUser, setBlockTargetUser] = useState<{ id: number; name: string } | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isBlockingUser, setIsBlockingUser] = useState(false);

  // Safety: Blocked Users List Modal State
  const [blockedUsersModalOpen, setBlockedUsersModalOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [isUnblockingId, setIsUnblockingId] = useState<number | null>(null);

  const handleOpenReport = (targetType: ReportTargetType, targetId: number, title: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setReportTarget({ targetType, targetId, title });
    setReportReason('INAPPROPRIATE');
    setReportDetails('');
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    setIsSubmittingReport(true);
    try {
      const res = await safetyService.reportContent(
        reportTarget.targetType,
        reportTarget.targetId,
        reportReason,
        reportDetails.trim() || undefined
      );
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || 'Báo cáo của bạn đã được gửi thành công');
        setReportModalOpen(false);
        setReportTarget(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi gửi báo cáo');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleOpenBlock = (userId: number, name: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setBlockTargetUser({ id: userId, name });
    setBlockReason('');
    setBlockModalOpen(true);
  };

  const handleConfirmBlock = async () => {
    if (!blockTargetUser) return;
    setIsBlockingUser(true);
    try {
      const res = await safetyService.blockUser(blockTargetUser.id, blockReason.trim() || undefined);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Đã chặn người dùng ${blockTargetUser.name}. Toàn bộ nội dung của người này sẽ được ẩn khỏi bảng tin.`);
        setBlockModalOpen(false);
        setBlockTargetUser(null);
        fetchFeed();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi chặn người dùng');
    } finally {
      setIsBlockingUser(false);
    }
  };

  const handleOpenBlockedUsersModal = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setBlockedUsersModalOpen(true);
    setLoadingBlockedUsers(true);
    try {
      const res = await safetyService.getBlockedUsers();
      if (res && Array.isArray(res.blockedUsers)) {
        setBlockedUsers(res.blockedUsers);
      } else if (res && Array.isArray(res.blocks)) {
        setBlockedUsers(res.blocks);
      } else {
        setBlockedUsers([]);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải danh sách chặn');
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

  const handleUnblockUser = async (userId: number, name: string) => {
    setIsUnblockingId(userId);
    try {
      const res = await safetyService.unblockUser(userId);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Đã bỏ chặn người dùng ${name}`);
        setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== userId));
        fetchFeed();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi bỏ chặn');
    } finally {
      setIsUnblockingId(null);
    }
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Community Feed
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCommunityFeed({
        tab: activeTab,
        category: selectedCategory === 'Tất cả' ? undefined : selectedCategory,
        resourceType: selectedType || undefined,
        search: debouncedSearch || undefined,
      });

      if (res && Array.isArray(res.items)) {
        setResources(res.items);
        setTotalCount(res.total || res.items.length);
      } else {
        setResources([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching community feed:', error);
      toast.error('Không thể tải bảng tin cộng đồng');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedType, debouncedSearch]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Open Publish Modal & fetch personal resources
  const handleOpenPublishModal = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setIsPublishModalOpen(true);
    setLoadingPersonal(true);
    try {
      const data = await getUserPersonalResources();
      if ('error' in data) {
        toast.error(data.error);
      } else {
        setPersonalResources(data);
        // Pre-select first document if available
        if (data.documents && data.documents.length > 0) {
          setPublishForm((prev) => ({
            ...prev,
            resourceType: 'document',
            resourceId: data.documents[0].id,
            title: data.documents[0].title,
            category: data.documents[0].category || 'Công nghệ thông tin',
          }));
        }
      }
    } catch (err) {
      toast.error('Lỗi khi tải tài nguyên cá nhân');
    } finally {
      setLoadingPersonal(false);
    }
  };

  // Change resource type in publish form
  const handleTypeChangeInPublish = (type: ResourceType) => {
    if (!personalResources) return;
    let initialId: number | '' = '';
    let initialTitle = '';

    if (type === 'document' && personalResources.documents.length > 0) {
      initialId = personalResources.documents[0].id;
      initialTitle = personalResources.documents[0].title;
    } else if (type === 'test_set' && personalResources.quizzes.length > 0) {
      initialId = personalResources.quizzes[0].id;
      initialTitle = personalResources.quizzes[0].name;
    } else if (type === 'mindmap' && personalResources.mindmaps.length > 0) {
      initialId = personalResources.mindmaps[0].id;
      initialTitle = personalResources.mindmaps[0].title;
    } else if (type === 'flashcard_deck' && personalResources.flashcardDecks.length > 0) {
      initialId = personalResources.flashcardDecks[0].id;
      initialTitle = personalResources.flashcardDecks[0].name;
    }

    setPublishForm((prev) => ({
      ...prev,
      resourceType: type,
      resourceId: initialId,
      title: initialTitle,
    }));
  };

  // Submit Publish
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishForm.resourceId) {
      toast.error('Vui lòng chọn tài nguyên cá nhân cần đăng');
      return;
    }
    if (!publishForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài đăng');
      return;
    }

    setIsPublishing(true);
    try {
      const tags = publishForm.tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      const res = await publishResource({
        resourceType: publishForm.resourceType,
        resourceId: Number(publishForm.resourceId),
        title: publishForm.title.trim(),
        description: publishForm.description.trim() || undefined,
        category: publishForm.category,
        tags: tags.length > 0 ? tags : undefined,
        visibility: 'PUBLIC',
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đã chia sẻ tài nguyên lên cộng đồng!');
        setIsPublishModalOpen(false);
        setPublishForm({
          resourceType: 'document',
          resourceId: '',
          title: '',
          description: '',
          category: 'Công nghệ thông tin',
          tagsInput: '',
        });
        fetchFeed();
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đăng tài nguyên');
    } finally {
      setIsPublishing(false);
    }
  };

  // Toggle Like
  const handleToggleLike = async (item: CommunityResourceItem) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Optimistic update
    setResources((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? {
              ...r,
              is_liked: !r.is_liked,
              likes: r.is_liked ? Math.max(0, r.likes - 1) : r.likes + 1,
            }
          : r
      )
    );

    try {
      const res = await toggleLikeResource(item.id);
      if (res.error) {
        toast.error(res.error);
        fetchFeed(); // Rollback
      }
    } catch (error) {
      fetchFeed();
    }
  };

  // Toggle Save Reference (Zero Duplication)
  const handleToggleSave = async (item: CommunityResourceItem) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Optimistic update
    setResources((prev) =>
      prev.map((r) =>
        r.id === item.id
          ? {
              ...r,
              is_saved: !r.is_saved,
              forks: r.is_saved ? Math.max(0, (r.save_count ?? r.forks ?? 0) - 1) : (r.save_count ?? r.forks ?? 0) + 1,
              save_count: r.is_saved ? Math.max(0, (r.save_count ?? r.forks ?? 0) - 1) : (r.save_count ?? r.forks ?? 0) + 1,
            }
          : r
      )
    );

    try {
      const res = await toggleSaveResource(item.id);
      if (res.error) {
        toast.error(res.error);
        fetchFeed();
      } else {
        if (res.saved) {
          toast.success('Đã lưu tài nguyên vào danh sách yêu thích!');
        } else {
          toast('Đã bỏ lưu tài nguyên', { icon: '🗑️' });
          if (activeTab === 'saved') {
            setResources((prev) => prev.filter((r) => r.id !== item.id));
          }
        }
      }
    } catch (error) {
      fetchFeed();
    }
  };

  // Open Reshare Modal
  const handleOpenReshare = (item: CommunityResourceItem) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setReshareTarget(item);
    setReshareNote('');
  };

  // Confirm Reshare
  const handleConfirmReshare = async () => {
    if (!reshareTarget) return;
    setIsResharing(true);
    try {
      const res = await reshareCommunityResource(reshareTarget.id, reshareNote);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đã chia sẻ lại bài viết lên cộng đồng!');
        setReshareTarget(null);
        setReshareNote('');
        fetchFeed();
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi chia sẻ lại bài');
    } finally {
      setIsResharing(false);
    }
  };

  // Unpublish
  const handleUnpublish = async (item: CommunityResourceItem) => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ "${item.title}" khỏi cộng đồng?`)) return;
    try {
      const res = await unpublishResource(item.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đã gỡ bài đăng khỏi cộng đồng');
        setResources((prev) => prev.filter((r) => r.id !== item.id));
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi gỡ bài');
    }
  };

  // Open Comments Drawer
  const handleOpenComments = async (item: CommunityResourceItem) => {
    setCommentsTarget(item);
    setLoadingComments(true);
    setReplyParent(null);
    setCommentInput('');
    try {
      const res = await listResourceComments(item.id);
      if (res.error) {
        toast.error(res.error);
        setCommentsList([]);
      } else {
        setCommentsList(res.comments || []);
      }
    } catch (error) {
      toast.error('Lỗi khi tải bình luận');
      setCommentsList([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!commentsTarget || !commentInput.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await addResourceComment(
        commentsTarget.id,
        commentInput.trim(),
        replyParent ? replyParent.id : undefined
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đã gửi bình luận');
        setCommentInput('');
        setReplyParent(null);
        // Refresh comments list
        const updated = await listResourceComments(commentsTarget.id);
        if (updated.comments) {
          setCommentsList(updated.comments);
        }
        // Update resource comment count in card
        setResources((prev) =>
          prev.map((r) =>
            r.id === commentsTarget.id
              ? { ...r, comment_count: (r.comment_count || 0) + 1 }
              : r
          )
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi gửi bình luận');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Xóa bình luận này?')) return;
    try {
      const res = await deleteResourceComment(commentId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đã xóa bình luận');
        if (commentsTarget) {
          const updated = await listResourceComments(commentsTarget.id);
          if (updated.comments) {
            setCommentsList(updated.comments);
          }
          setResources((prev) =>
            prev.map((r) =>
              r.id === commentsTarget.id
                ? { ...r, comment_count: Math.max(0, (r.comment_count || 1) - 1) }
                : r
            )
          );
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi xóa bình luận');
    }
  };

  // Direct study navigation
  const handleStudy = (item: CommunityResourceItem) => {
    if (!item.is_available) {
      toast.error('Tài nguyên gốc đã bị xóa hoặc không còn khả dụng!');
      return;
    }
    router.push(item.study_url);
  };

  // Format Helper for Type
  const getTypeInfo = (type: ResourceType) => {
    switch (type) {
      case 'document':
        return { label: 'Tài liệu', icon: BookOpen, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'test_set':
        return { label: 'Đề trắc nghiệm', icon: HelpCircle, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'mindmap':
        return { label: 'Sơ đồ tư duy', icon: GitBranch, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'flashcard_deck':
        return { label: 'Thẻ ghi nhớ', icon: Layers, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Học liệu', icon: BookOpen, bg: 'bg-stone-50 text-stone-700 border-stone-200' };
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#121f17] flex flex-col font-sans">
      <Navbar
        isLoggedIn={isAuthenticated}
        onSignInClick={() => setShowLoginModal(true)}
        onDashboardClick={() => router.push('/library')}
        activeUser={activeUser!}
      />

      {/* Hero Banner Header */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  Cognito Ecosystem
                </span>
                <span className="text-xs text-stone-400">• {totalCount} tài nguyên chia sẻ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0d1a14] mt-1">
                Cộng đồng Chia sẻ & Trao đổi Học tập
              </h1>
              <p className="text-sm text-stone-600 mt-0.5">
                Khám phá tài liệu, đề trắc nghiệm, sơ đồ tư duy và bộ thẻ ghi nhớ được chia sẻ công khai.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button
                  onClick={handleOpenBlockedUsersModal}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 font-medium text-sm hover:bg-stone-50 transition-all shadow-2xs"
                  title="Quản lý danh sách người dùng đã chặn"
                >
                  <UserX size={16} className="text-stone-500" />
                  <span>Danh sách chặn</span>
                </button>
              )}
              <button
                onClick={handleOpenPublishModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white font-medium text-sm hover:bg-[#12281d] shadow-sm hover:shadow transition-all"
              >
                <Plus size={18} />
                <span>Đăng tài liệu</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-stone-100 pt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'recent'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Clock size={16} />
              <span>Mới nhất</span>
            </button>

            <button
              onClick={() => setActiveTab('popular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'popular'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <TrendingUp size={16} />
              <span>Phổ biến nhất</span>
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                setActiveTab('saved');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Bookmark size={16} />
              <span>Đã lưu (Tham chiếu)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search & Filter Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-sm">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, danh mục, từ khóa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a2a] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Resource Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {RESOURCE_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedType === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setSelectedType(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : t.color} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto py-1 no-scrollbar">
          <span className="text-xs text-stone-400 flex items-center gap-1 pl-1">
            <Filter size={13} />
            <span>Chủ đề:</span>
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 border-4 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-stone-500 font-medium">Đang tải học liệu từ cộng đồng...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-stone-200 text-center px-4 max-w-xl mx-auto shadow-sm my-8">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-stone-400">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {activeTab === 'saved' ? 'Bạn chưa lưu tài nguyên nào' : 'Chưa tìm thấy học liệu phù hợp'}
            </h3>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              {activeTab === 'saved'
                ? 'Hãy khám phá các bài viết trong tab "Mới nhất" hoặc "Phổ biến" và nhấn nút lưu để tham chiếu học tập.'
                : 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc danh mục, hoặc hãy là người đầu tiên chia sẻ học liệu của bạn!'}
            </p>
            {activeTab !== 'saved' && (
              <button
                onClick={handleOpenPublishModal}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#12281d] transition-all"
              >
                <Plus size={16} />
                <span>Đăng tài liệu ngay</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((item) => {
              const typeInfo = getTypeInfo(item.resource_type);
              const TypeIcon = typeInfo.icon;
              const isOwner = activeUser && activeUser.id === item.user_id;
              const isAdmin = activeUser?.role === 'admin';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    item.is_available
                      ? 'border-stone-200/90 hover:border-stone-300'
                      : 'border-red-200 bg-stone-50/60 opacity-80'
                  }`}
                >
                  <div>
                    {/* Reshare Attribution Header */}
                    {item.is_reshare && (
                      <div className="bg-emerald-50/70 border-b border-emerald-100/70 px-4 py-2 flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-1.5 truncate">
                          <Share2 size={13} className="text-emerald-700 shrink-0" />
                          <span className="font-semibold truncate">{item.author_name}</span>
                          <span className="text-emerald-700">đã chia sẻ lại</span>
                          {item.original_author_name && (
                            <span className="text-stone-500 truncate">
                              từ <strong className="text-stone-700">{item.original_author_name}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reshare Note */}
                    {item.is_reshare && item.reshare_note && (
                      <div className="px-5 pt-3 pb-1 text-xs italic text-stone-700 bg-stone-50/50 border-b border-stone-100">
                        "{item.reshare_note}"
                      </div>
                    )}

                    {/* Card Header: Type Badge & Availability */}
                    <div className="p-5 pb-3">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeInfo.bg}`}
                        >
                          <TypeIcon size={13} />
                          <span>{typeInfo.label}</span>
                        </div>

                        {item.category && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                            {item.category}
                          </span>
                        )}

                        {!item.is_available && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> Không khả dụng
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-emerald-800 transition-colors">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed min-h-[32px]">
                        {item.description || 'Tài nguyên học tập được đóng góp bởi thành viên cộng đồng Cognito.'}
                      </p>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] text-stone-500 bg-stone-100/80 px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <Tag size={10} className="text-stone-400" />
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-[11px] text-stone-400 px-1 py-0.5">
                              +{item.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Author Info & Date */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 text-xs text-stone-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/profile/${item.user_id}`)}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity text-left cursor-pointer"
                            title="Xem hồ sơ người dùng"
                          >
                            {item.author_avatar ? (
                              <img
                                src={item.author_avatar}
                                alt={item.author_name}
                                className="w-6 h-6 rounded-full object-cover border border-stone-200"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                                {item.author_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-stone-700 hover:text-emerald-800 truncate max-w-[110px]">
                              {item.author_name}
                            </span>
                          </button>
                          {!isOwner && (
                            <button
                              onClick={() => router.push(`/messages?user=${item.user_id}`)}
                              className="text-stone-400 hover:text-emerald-700 transition-colors p-0.5 cursor-pointer"
                              title="Nhắn tin cho tác giả"
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}
                        </div>

                        <span className="text-stone-400">
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions & Stats Footer */}
                  <div className="bg-stone-50/70 border-t border-stone-100 px-4 py-2.5">
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      {/* Social Metrics & Toggles */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleLike(item)}
                          className={`flex items-center gap-1 transition-colors ${
                            item.is_liked ? 'text-red-600 font-bold' : 'text-stone-500 hover:text-red-500'
                          }`}
                          title="Thích bài đăng"
                        >
                          <Heart size={15} className={item.is_liked ? 'fill-red-600' : ''} />
                          <span>{item.likes}</span>
                        </button>

                        <button
                          onClick={() => handleToggleSave(item)}
                          className={`flex items-center gap-1 transition-colors ${
                            item.is_saved ? 'text-blue-600 font-bold' : 'text-stone-500 hover:text-blue-500'
                          }`}
                          title="Lưu tham chiếu (Zero data duplication)"
                        >
                          <Bookmark size={15} className={item.is_saved ? 'fill-blue-600' : ''} />
                          <span>{item.save_count ?? item.forks ?? 0}</span>
                        </button>

                        <button
                          onClick={() => handleOpenComments(item)}
                          className="flex items-center gap-1 text-stone-500 hover:text-stone-800 transition-colors"
                          title="Bình luận"
                        >
                          <MessageSquare size={15} />
                          <span>{item.comment_count || 0}</span>
                        </button>

                        <span className="flex items-center gap-1 text-stone-400 pl-1" title="Lượt xem">
                          <Eye size={14} />
                          <span>{item.views}</span>
                        </span>
                      </div>

                      {/* Safety & Reshare Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenReport('resource', item.id, item.title)}
                          className="p-1 text-stone-400 hover:text-amber-600 transition-colors"
                          title="Báo cáo vi phạm (Report)"
                        >
                          <Flag size={14} />
                        </button>

                        {!isOwner && (
                          <button
                            onClick={() => handleOpenBlock(item.user_id, item.author_name)}
                            className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                            title="Chặn tác giả này (Block user)"
                          >
                            <UserX size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenReshare(item)}
                          className="p-1 text-stone-400 hover:text-emerald-700 transition-colors"
                          title="Chia sẻ lại (Reshare)"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom CTA Row: Study Button & Delete (if author) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStudy(item)}
                        disabled={!item.is_available}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                          item.is_available
                            ? 'bg-[#1a3a2a] text-white hover:bg-[#12281d] active:scale-[0.98]'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        <span>Học ngay</span>
                        <ExternalLink size={13} />
                      </button>

                      {(isOwner || isAdmin) && (
                        <button
                          onClick={() => handleUnpublish(item)}
                          className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 border border-stone-200 transition-colors"
                          title="Gỡ khỏi cộng đồng"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* PUBLISH MODAL */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Đăng tài nguyên lên Cộng đồng</h3>
                  <p className="text-xs text-stone-500">
                    Quy tắc: PUBLIC ≠ PUBLISHED. Chỉ tài nguyên bạn xác nhận đăng mới xuất hiện trên bảng tin.
                  </p>
                </div>
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingPersonal ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-3 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-stone-500">Đang kiểm tra tài nguyên của bạn...</p>
                </div>
              ) : (
                <form onSubmit={handlePublishSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1">
                  {/* Step 1: Type Selection */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      1. Chọn loại tài nguyên
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {RESOURCE_TYPES.filter((t) => t.key !== '').map((t) => {
                        const Icon = t.icon;
                        const isSelected = publishForm.resourceType === t.key;
                        return (
                          <button
                            type="button"
                            key={t.key}
                            onClick={() => handleTypeChangeInPublish(t.key as ResourceType)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                              isSelected
                                ? 'border-[#1a3a2a] bg-emerald-50/50 text-[#1a3a2a] font-bold'
                                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            <Icon size={16} className={isSelected ? 'text-emerald-700' : 'text-stone-400'} />
                            <span className="text-xs">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Choose Personal Resource */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      2. Chọn học liệu cá nhân của bạn
                    </label>
                    {personalResources && (
                      <div>
                        {publishForm.resourceType === 'document' && (
                          <select
                            value={publishForm.resourceId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              const item = personalResources.documents.find((d) => d.id === id);
                              setPublishForm((prev) => ({
                                ...prev,
                                resourceId: id,
                                title: item?.title || prev.title,
                                category: item?.category || prev.category,
                              }));
                            }}
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                          >
                            {personalResources.documents.length === 0 ? (
                              <option value="">(Bạn chưa có tài liệu nào trong thư viện)</option>
                            ) : (
                              personalResources.documents.map((d) => (
                                <option key={d.id} value={d.id}>
                                  📄 {d.title} ({d.category || 'Tài liệu'})
                                </option>
                              ))
                            )}
                          </select>
                        )}

                        {publishForm.resourceType === 'test_set' && (
                          <select
                            value={publishForm.resourceId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              const item = personalResources.quizzes.find((q) => q.id === id);
                              setPublishForm((prev) => ({
                                ...prev,
                                resourceId: id,
                                title: item?.name || prev.title,
                              }));
                            }}
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                          >
                            {personalResources.quizzes.length === 0 ? (
                              <option value="">(Bạn chưa có bộ đề thi trắc nghiệm nào)</option>
                            ) : (
                              personalResources.quizzes.map((q) => (
                                <option key={q.id} value={q.id}>
                                  📝 {q.name}
                                </option>
                              ))
                            )}
                          </select>
                        )}

                        {publishForm.resourceType === 'mindmap' && (
                          <select
                            value={publishForm.resourceId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              const item = personalResources.mindmaps.find((m) => m.id === id);
                              setPublishForm((prev) => ({
                                ...prev,
                                resourceId: id,
                                title: item?.title || prev.title,
                              }));
                            }}
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                          >
                            {personalResources.mindmaps.length === 0 ? (
                              <option value="">(Bạn chưa tạo sơ đồ tư duy nào)</option>
                            ) : (
                              personalResources.mindmaps.map((m) => (
                                <option key={m.id} value={m.id}>
                                  🧠 {m.title}
                                </option>
                              ))
                            )}
                          </select>
                        )}

                        {publishForm.resourceType === 'flashcard_deck' && (
                          <select
                            value={publishForm.resourceId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              const item = personalResources.flashcardDecks.find((f) => f.id === id);
                              setPublishForm((prev) => ({
                                ...prev,
                                resourceId: id,
                                title: item?.name || prev.title,
                              }));
                            }}
                            className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                          >
                            {personalResources.flashcardDecks.length === 0 ? (
                              <option value="">(Bạn chưa có bộ thẻ ghi nhớ nào)</option>
                            ) : (
                              personalResources.flashcardDecks.map((f) => (
                                <option key={f.id} value={f.id}>
                                  🗂️ {f.name}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Metadata */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      3. Tiêu đề hiển thị trên Cộng đồng
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Ôn tập Kiến trúc Vi điều khiển & Hệ nhúng..."
                      value={publishForm.title}
                      onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                        Danh mục
                      </label>
                      <select
                        value={publishForm.category}
                        onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                      >
                        {CATEGORIES.filter((c) => c !== 'Tất cả').map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                        Tags (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        placeholder="cntt, de-thi, final-exam..."
                        value={publishForm.tagsInput}
                        onChange={(e) => setPublishForm({ ...publishForm, tagsInput: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                      Mô tả ngắn gọn
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả nội dung học liệu để các thành viên khác dễ dàng tìm kiếm và tham khảo..."
                      value={publishForm.description}
                      onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setIsPublishModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isPublishing || !publishForm.resourceId}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1a3a2a] text-white hover:bg-[#12281d] disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      {isPublishing ? 'Đang xuất bản...' : 'Xác nhận đăng lên Cộng đồng'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESHARE MODAL */}
      <AnimatePresence>
        {reshareTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Share2 size={18} className="text-emerald-700" />
                  <h3 className="text-base font-bold text-stone-900">Chia sẻ lại tài nguyên (Reshare)</h3>
                </div>
                <button
                  onClick={() => setReshareTarget(null)}
                  className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Attribution Preview */}
              <div className="my-4 p-3 bg-stone-50 border border-stone-200/80 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide block mb-1">
                  Đính kèm bản gốc:
                </span>
                <p className="text-sm font-bold text-stone-900">{reshareTarget.title}</p>
                <p className="text-xs text-stone-500 mt-0.5">Tác giả: {reshareTarget.author_name}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5">
                  Thêm suy nghĩ / ghi chú của bạn (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  placeholder="Chia sẻ lý do bạn thấy tài liệu này hữu ích..."
                  value={reshareNote}
                  onChange={(e) => setReshareNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                />
              </div>

              <div className="mt-4 pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReshareTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmReshare}
                  disabled={isResharing}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1a3a2a] text-white hover:bg-[#12281d] disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isResharing ? 'Đang chia sẻ...' : 'Đăng lên trang cá nhân'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMENTS DRAWER / MODAL */}
      <AnimatePresence>
        {commentsTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <MessageSquare size={17} className="text-emerald-700" />
                    <span>Bình luận & Thảo luận</span>
                  </h3>
                  <p className="text-xs text-stone-500 truncate max-w-[280px]">
                    {commentsTarget.title}
                  </p>
                </div>
                <button
                  onClick={() => setCommentsTarget(null)}
                  className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingComments ? (
                  <div className="py-12 text-center text-xs text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải bình luận...
                  </div>
                ) : commentsList.length === 0 ? (
                  <div className="py-16 text-center text-stone-400 text-xs">
                    Chưa có bình luận nào. Hãy là người đầu tiên đặt câu hỏi hoặc nhận xét!
                  </div>
                ) : (
                  commentsList.map((c) => {
                    const isAuthor = activeUser && activeUser.id === c.user_id;
                    return (
                      <div key={c.id} className="space-y-2">
                        {/* Parent Comment */}
                        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {c.user_avatar ? (
                                <img
                                  src={c.user_avatar}
                                  alt={c.user_name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">
                                  {c.user_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-stone-800">{c.user_name}</span>
                            </div>
                            <span className="text-[10px] text-stone-400">
                              {new Date(c.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-stone-700 mt-1 whitespace-pre-wrap">{c.content}</p>

                          <div className="flex items-center justify-end gap-3 mt-2 pt-1 border-t border-stone-100">
                            <button
                              onClick={() => setReplyParent(c)}
                              className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                            >
                              <CornerDownRight size={12} /> Trả lời
                            </button>
                            {!isAuthor && (
                              <button
                                onClick={() => router.push(`/messages?user=${c.user_id}`)}
                                className="text-[11px] text-stone-400 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Nhắn tin cho tác giả bình luận"
                              >
                                <MessageSquare size={11} /> Nhắn tin
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenReport('comment', c.id, c.content)}
                              className="text-[11px] text-stone-400 hover:text-amber-600 flex items-center gap-1 transition-colors"
                              title="Báo cáo bình luận"
                            >
                              <Flag size={11} /> Báo cáo
                            </button>
                            {!isAuthor && (
                              <button
                                onClick={() => handleOpenBlock(c.user_id, c.user_name)}
                                className="text-[11px] text-stone-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                                title="Chặn người dùng này"
                              >
                                <UserX size={11} /> Chặn
                              </button>
                            )}
                            {(isAuthor || activeUser?.role === 'admin') && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[11px] text-red-500 hover:text-red-700"
                              >
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Nested Replies */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="pl-6 space-y-2 border-l-2 border-emerald-100">
                            {c.replies.map((reply) => {
                              const isReplyAuthor = activeUser && activeUser.id === reply.user_id;
                              return (
                                <div
                                  key={reply.id}
                                  className="p-2.5 bg-stone-100/70 rounded-xl border border-stone-200/60 text-xs"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-stone-800">{reply.user_name}</span>
                                    <span className="text-[10px] text-stone-400">
                                      {new Date(reply.created_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-stone-700 whitespace-pre-wrap">{reply.content}</p>
                                  <div className="flex items-center justify-end gap-2 mt-1">
                                    <button
                                      onClick={() => handleOpenReport('comment', reply.id, reply.content)}
                                      className="text-[10px] text-stone-400 hover:text-amber-600 flex items-center gap-0.5 transition-colors"
                                      title="Báo cáo câu trả lời"
                                    >
                                      <Flag size={10} /> Báo cáo
                                    </button>
                                    {!isReplyAuthor && (
                                      <button
                                        onClick={() => router.push(`/messages?user=${reply.user_id}`)}
                                        className="text-[10px] text-stone-400 hover:text-emerald-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                                        title="Nhắn tin cho người trả lời"
                                      >
                                        <MessageSquare size={10} /> Nhắn tin
                                      </button>
                                    )}
                                    {!isReplyAuthor && (
                                      <button
                                        onClick={() => handleOpenBlock(reply.user_id, reply.user_name)}
                                        className="text-[10px] text-stone-400 hover:text-red-600 flex items-center gap-0.5 transition-colors"
                                        title="Chặn người này"
                                      >
                                        <UserX size={10} /> Chặn
                                      </button>
                                    )}
                                    {(isReplyAuthor || activeUser?.role === 'admin') && (
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="text-[10px] text-red-500 hover:text-red-700"
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Comment Input Footer */}
              <div className="p-3 border-t border-stone-200 bg-stone-50">
                {replyParent && (
                  <div className="flex items-center justify-between px-2 py-1 mb-2 bg-emerald-50 rounded-lg text-xs text-emerald-800">
                    <span className="truncate">Đang trả lời <strong>@{replyParent.user_name}</strong></span>
                    <button onClick={() => setReplyParent(null)} className="text-emerald-700 hover:text-emerald-900">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={
                      isAuthenticated
                        ? replyParent
                          ? 'Nhập nội dung trả lời...'
                          : 'Viết bình luận của bạn...'
                        : 'Đăng nhập để bình luận...'
                    }
                    disabled={!isAuthenticated || isSubmittingComment}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!isAuthenticated || !commentInput.trim() || isSubmittingComment}
                    className="p-2 bg-[#1a3a2a] text-white rounded-xl hover:bg-[#12281d] disabled:opacity-40 transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Safety: Report Content Modal ─── */}
      <AnimatePresence>
        {reportModalOpen && reportTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2 text-amber-700">
                  <Flag size={20} />
                  <h3 className="font-bold text-base text-stone-900">Báo cáo vi phạm</h3>
                </div>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">
                    {reportTarget.targetType === 'resource'
                      ? 'Tài nguyên:'
                      : reportTarget.targetType === 'comment'
                      ? 'Bình luận:'
                      : 'Người dùng:'}
                  </span>{' '}
                  <span className="line-clamp-1 italic">"{reportTarget.title}"</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Lý do báo cáo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as ReportReason)}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                  >
                    <option value="SPAM">Tin rác / Quảng cáo trái phép (SPAM)</option>
                    <option value="INAPPROPRIATE">Nội dung phản cảm / Không phù hợp</option>
                    <option value="COPYRIGHT_VIOLATION">Vi phạm bản quyền sở hữu trí tuệ</option>
                    <option value="HARASSMENT">Quấy rối / Đả kích cá nhân</option>
                    <option value="FALSE_INFORMATION">Thông tin sai lệch / Gây hiểu lầm</option>
                    <option value="OTHER">Lý do khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Mô tả chi tiết (tùy chọn)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Cung cấp thêm chi tiết để ban quản trị dễ dàng xác minh..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    maxLength={1000}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2a] outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-5 py-2 text-xs font-semibold bg-amber-700 text-white rounded-xl hover:bg-amber-800 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSubmittingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Safety: Block User Confirmation Modal ─── */}
      <AnimatePresence>
        {blockModalOpen && blockTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2 text-red-600">
                  <UserX size={20} />
                  <h3 className="font-bold text-base text-stone-900">Chặn người dùng</h3>
                </div>
                <button
                  onClick={() => setBlockModalOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-stone-600 leading-relaxed">
                  Bạn có chắc muốn chặn <strong className="text-stone-900">{blockTargetUser.name}</strong>? Khi bị chặn:
                </p>
                <ul className="text-xs text-stone-500 space-y-1 list-disc pl-5">
                  <li>Tài nguyên và bình luận của người này sẽ không còn hiển thị trên bảng tin của bạn.</li>
                  <li>Người này cũng sẽ không thấy tài nguyên và không thể bình luận, thích hoặc lưu bài của bạn.</li>
                </ul>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Lý do chặn (nội bộ của bạn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Bình luận spam, làm phiền..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    maxLength={500}
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#1a3a2a] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setBlockModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmBlock}
                    disabled={isBlockingUser}
                    className="px-5 py-2 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isBlockingUser ? 'Đang chặn...' : 'Xác nhận chặn'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Safety: Blocked Users List Modal ─── */}
      <AnimatePresence>
        {blockedUsersModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2 text-stone-800">
                  <UserX size={20} className="text-stone-500" />
                  <h3 className="font-bold text-base text-stone-900">Danh sách người dùng đã chặn</h3>
                </div>
                <button
                  onClick={() => setBlockedUsersModalOpen(false)}
                  className="p-1.5 rounded-full text-stone-400 hover:bg-stone-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {loadingBlockedUsers ? (
                  <div className="py-12 text-center text-xs text-stone-400">
                    <div className="w-6 h-6 border-2 border-[#1a3a2a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải danh sách chặn...
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-400">
                    Bạn hiện chưa chặn người dùng nào.
                  </div>
                ) : (
                  blockedUsers.map((b) => (
                    <div
                      key={b.block_id}
                      className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {b.avatar_url ? (
                          <img src={b.avatar_url} alt={b.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {b.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-stone-900 truncate">{b.name}</p>
                          <p className="text-[11px] text-stone-400 truncate">
                            {b.reason ? `Lý do: ${b.reason}` : `Đã chặn ngày ${new Date(b.created_at).toLocaleDateString('vi-VN')}`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnblockUser(b.blocked_id, b.name)}
                        disabled={isUnblockingId === b.blocked_id}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs whitespace-nowrap transition-colors disabled:opacity-50"
                      >
                        {isUnblockingId === b.blocked_id ? 'Đang mở...' : 'Bỏ chặn'}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 text-right">
                <button
                  onClick={() => setBlockedUsersModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal if guest clicks an action */}
      <AnimatePresence>
        {showLoginModal && (
          <RegisterModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            triggerMessage={triggerMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
