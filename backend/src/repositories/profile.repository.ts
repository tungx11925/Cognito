import { db } from '../db';

class ProfileRepository {
  async getFriends(userId: number) {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.education, u.address, u.avatar_url, u.streak
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'accepted'
       ORDER BY u.name ASC`,
      [userId]
    );
    return result.rows;
  }

  async getTargetUser(targetUserId: number) {
    const userResult = await db.query(
      'SELECT id, name, email, phone, education, address, website, created_at, avatar_url, streak, privacy_setting, role, is_premium, bio, headline, is_suspended, suspension_reason FROM users WHERE id = $1',
      [targetUserId]
    );
    return userResult.rows[0];
  }

  async checkBlockRelationship(userId1: number, userId2: number) {
    const result = await db.query(
      `SELECT 1 FROM user_blocks 
       WHERE (blocker_id = $1 AND blocked_id = $2) 
          OR (blocker_id = $2 AND blocked_id = $1)
       LIMIT 1`,
      [userId1, userId2]
    );
    return result.rows.length > 0;
  }

  async checkFriendship(userId1: number, userId2: number) {
    const friendshipResult = await db.query(
      `SELECT 1 FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
       AND status = 'accepted'`,
      [userId1, userId2]
    );
    return friendshipResult.rows.length > 0;
  }

  async getPublicDecks(userId: number) {
    const decksResult = await db.query(
      `SELECT d.id, d.name, d.name AS title, d.description, d.is_public, d.created_at,
              COALESCE(COUNT(f.id), 0)::int AS card_count
       FROM flashcard_decks d
       LEFT JOIN flashcards f ON f.deck_id = d.id
       WHERE d.user_id = $1 AND d.is_public = true
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [userId]
    );
    return decksResult.rows;
  }

  async getPublicCommunityResources(userId: number) {
    const result = await db.query(
      `SELECT id, title, description, resource_type, category, tags,
              view_count, like_count, save_count, comment_count, created_at
       FROM community_resources
       WHERE user_id = $1 AND is_public = true AND is_hidden = false AND resource_type != 'test_set'
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getPublicQuizzes(userId: number) {
    const result = await db.query(
      `SELECT cr.id as resource_id, cr.title, cr.description, cr.view_count, cr.like_count, cr.save_count, cr.created_at,
              ts.id as quiz_id, ts.name as quiz_name,
              COALESCE(ts.total_questions, (SELECT COUNT(*) FROM questions q WHERE q.test_set_id = ts.id), 0)::int as question_count
       FROM community_resources cr
       LEFT JOIN test_sets ts ON cr.resource_id = ts.id
       WHERE cr.user_id = $1 AND cr.is_public = true AND cr.is_hidden = false AND cr.resource_type = 'test_set'
       ORDER BY cr.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getPublicStats(userId: number) {
    const result = await db.query(
      `SELECT 
        COALESCE((SELECT COUNT(*) FROM community_resources WHERE user_id = $1 AND is_public = true AND is_hidden = false AND resource_type != 'test_set'), 0)::int as total_published_resources,
        COALESCE((SELECT COUNT(*) FROM community_resources WHERE user_id = $1 AND is_public = true AND is_hidden = false AND resource_type = 'test_set'), 0)::int as total_public_quizzes,
        COALESCE((SELECT COUNT(*) FROM flashcard_decks WHERE user_id = $1 AND is_public = true), 0)::int as total_public_decks,
        COALESCE((SELECT SUM(like_count) FROM community_resources WHERE user_id = $1 AND is_public = true AND is_hidden = false), 0)::int as total_likes_received,
        COALESCE((SELECT SUM(save_count) FROM community_resources WHERE user_id = $1 AND is_public = true AND is_hidden = false), 0)::int as total_saves_received`,
      [userId]
    );
    return result.rows[0];
  }

  async getUserPrivateLearningStats(userId: number) {
    const result = await db.query(
      `SELECT 
        COALESCE((SELECT COUNT(*) FROM documents WHERE user_id = $1), 0)::int as total_documents,
        COALESCE((SELECT COUNT(*) FROM flashcard_decks WHERE user_id = $1), 0)::int as total_decks,
        COALESCE((SELECT COUNT(*) FROM test_sets WHERE created_by = $1), 0)::int as total_quizzes,
        COALESCE((SELECT COUNT(*) FROM notes WHERE user_id = $1), 0)::int as total_notes,
        COALESCE((SELECT COUNT(*) FROM mindmaps WHERE user_id = $1), 0)::int as total_mindmaps,
        COALESCE((SELECT COUNT(*) FROM study_sessions WHERE user_id = $1), 0)::int as total_study_sessions,
        COALESCE((SELECT SUM(actual_duration_seconds) FROM study_sessions WHERE user_id = $1), 0)::int as total_session_seconds,
        COALESCE((SELECT SUM(active_seconds) FROM user_daily_activity WHERE user_id = $1), 0)::int as total_daily_active_seconds`,
      [userId]
    );
    return result.rows[0];
  }

  async getDocuments(userId: number, limit: number = 50) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const documentsResult = await db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, safeLimit]
    );
    return documentsResult.rows;
  }

  async getPublicDocuments(userId: number, limit: number = 50) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const documentsResult = await db.query(
      `SELECT id, user_id, title, description, category, created_at, file_type, file_size, status
       FROM documents 
       WHERE user_id = $1 AND (visibility = 'public' OR share_status = 'public')
       ORDER BY created_at DESC LIMIT $2`,
      [userId, safeLimit]
    );
    return documentsResult.rows;
  }

  async getMutualFriends(targetUserId: number) {
    const friendsResult = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.education, u.address, u.avatar_url, u.streak
       FROM friendships f
       JOIN users u ON (f.friend_id = u.id AND f.user_id = $1) OR (f.user_id = u.id AND f.friend_id = $1)
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted' AND u.id != $1
       ORDER BY u.name ASC`,
      [targetUserId]
    );
    return friendsResult.rows;
  }
}

export const profileRepository = new ProfileRepository();
