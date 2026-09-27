import { profileRepository } from '../repositories/profile.repository';
import { activityRepository } from '../repositories/activity.repository';
import { AppError } from '../utils/AppError';
import { getVietnamDateString } from '../utils/date.util';

class ProfileService {
  async getFriends(userId: number) {
    return await profileRepository.getFriends(userId);
  }

  async getTargetUserProfile(viewerId: number, targetUserId: number) {
    if (isNaN(targetUserId)) {
      throw new AppError('Mã người dùng không hợp lệ', 400);
    }

    const targetUser = await profileRepository.getTargetUser(targetUserId);
    if (!targetUser) {
      throw new AppError('Không tìm thấy người dùng', 404);
    }

    let isAllowed = false;
    if (viewerId === targetUserId) {
      isAllowed = true;
    } else if (targetUser.privacy_setting === 'public') {
      isAllowed = true;
    } else if (targetUser.privacy_setting === 'friends') {
      isAllowed = await profileRepository.checkFriendship(viewerId, targetUserId);
    }

    if (!isAllowed) {
      return {
        isRestricted: true,
        privacy: targetUser.privacy_setting,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          avatar_url: targetUser.avatar_url,
          privacy_setting: targetUser.privacy_setting,
          bio: targetUser.bio,
          headline: targetUser.headline
        }
      };
    }

    const isSelf = viewerId === targetUserId;

    // Private data protection: only the owner can see their detailed study dates / learning history
    const studyDatesResult = isSelf ? await activityRepository.getStudyDates(targetUserId) : [];
    const studyDates = studyDatesResult.map(row => getVietnamDateString(new Date(row.study_date)));
    
    const decks = await profileRepository.getPublicDecks(targetUserId);
    // Private documents must NEVER be shown to other users
    const documents = isSelf 
      ? await profileRepository.getDocuments(targetUserId) 
      : await profileRepository.getPublicDocuments(targetUserId);
    const friends = await profileRepository.getMutualFriends(targetUserId);

    // Strip personal private contact details if viewing another user's profile
    const safeProfile = isSelf ? targetUser : {
      id: targetUser.id,
      name: targetUser.name,
      avatar_url: targetUser.avatar_url,
      streak: targetUser.streak,
      privacy_setting: targetUser.privacy_setting,
      role: targetUser.role,
      is_premium: targetUser.is_premium,
      bio: targetUser.bio,
      headline: targetUser.headline,
      created_at: targetUser.created_at,
    };

    return {
      isRestricted: false,
      user: {
        ...safeProfile,
        study_dates: studyDates,
        friends,
        decks,
        documents
      }
    };
  }
}

export const profileService = new ProfileService();
