import { profileRepository } from '../repositories/profile.repository';
import { activityRepository } from '../repositories/activity.repository';
import { AppError } from '../utils/AppError';
import { getVietnamDateString } from '../utils/date.util';

class ProfileService {
  async getFriends(userId: number) {
    return await profileRepository.getFriends(userId);
  }

  async getTargetUserProfile(viewerId: number | null, targetUserId: number) {
    if (isNaN(targetUserId)) {
      throw new AppError('Mã người dùng không hợp lệ', 400);
    }

    const targetUser = await profileRepository.getTargetUser(targetUserId);
    if (!targetUser) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    // Check suspension status: suspended accounts cannot have their public profile viewed
    if (targetUser.is_suspended) {
      throw new AppError('Tài khoản này đã bị đình chỉ do vi phạm quy chuẩn cộng đồng', 403);
    }

    const isSelf = viewerId !== null && viewerId === targetUserId;

    // Check bi-directional block relationship with viewer if logged in
    if (viewerId && !isSelf) {
      const isBlocked = await profileRepository.checkBlockRelationship(viewerId, targetUserId);
      if (isBlocked) {
        throw new AppError('Hồ sơ người dùng không khả dụng do quan hệ chặn', 403);
      }
    }

    // Strict 2-tier privacy check (public vs private per Master Prompt)
    let isAllowed = false;
    if (isSelf) {
      isAllowed = true;
    } else if (targetUser.privacy_setting === 'public') {
      isAllowed = true;
    }

    if (!isAllowed) {
      return {
        isRestricted: true,
        privacy: targetUser.privacy_setting || 'private',
        user: {
          id: targetUser.id,
          name: targetUser.name,
          avatar_url: targetUser.avatar_url,
          privacy_setting: targetUser.privacy_setting || 'private',
          bio: targetUser.bio,
          headline: targetUser.headline,
          created_at: targetUser.created_at
        }
      };
    }

    // Public community resources, quizzes, decks, and stats
    const publicResources = await profileRepository.getPublicCommunityResources(targetUserId);
    const publicQuizzes = await profileRepository.getPublicQuizzes(targetUserId);
    const publicDecks = await profileRepository.getPublicDecks(targetUserId);
    const publicStats = await profileRepository.getPublicStats(targetUserId);

    if (isSelf) {
      // Self viewing own profile: full private learning data + personal settings
      const learningStats = await profileRepository.getUserPrivateLearningStats(targetUserId);
      const studyDatesResult = await activityRepository.getStudyDates(targetUserId);
      const studyDates = studyDatesResult.map(row => getVietnamDateString(new Date(row.study_date)));
      const documents = await profileRepository.getDocuments(targetUserId);

      return {
        isRestricted: false,
        isSelf: true,
        user: {
          ...targetUser,
          study_dates: studyDates,
          decks: publicDecks,
          documents,
          learning_stats: {
            ...learningStats,
            total_focus_minutes: Math.round(((learningStats.total_session_seconds || 0) + (learningStats.total_daily_active_seconds || 0)) / 60),
            streak: targetUser.streak
          },
          public_resources: publicResources,
          public_quizzes: publicQuizzes,
          public_decks: publicDecks,
          public_stats: {
            ...publicStats,
            streak: targetUser.streak,
            join_date: targetUser.created_at
          }
        }
      };
    }

    // Viewing another user's public profile:
    // Strip personal private contact details (email, phone, address, education, wallet_balance, etc.)
    // Strip private learning data (private documents, private notes, AI chats, quiz attempts, focus details)
    // Strip role and is_premium to avoid targeting/harassment
    const safeProfile = {
      id: targetUser.id,
      name: targetUser.name,
      avatar_url: targetUser.avatar_url,
      streak: targetUser.streak,
      privacy_setting: targetUser.privacy_setting,
      bio: targetUser.bio,
      headline: targetUser.headline,
      created_at: targetUser.created_at,
      website: targetUser.website || null
    };

    return {
      isRestricted: false,
      isSelf: false,
      user: safeProfile,
      public_resources: publicResources,
      public_quizzes: publicQuizzes,
      public_decks: publicDecks,
      public_stats: {
        ...publicStats,
        streak: targetUser.streak,
        join_date: targetUser.created_at
      }
    };
  }
}

export const profileService = new ProfileService();
