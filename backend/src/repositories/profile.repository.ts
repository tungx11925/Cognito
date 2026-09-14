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
      'SELECT id, name, email, phone, education, address, website, created_at, avatar_url, streak, privacy_setting FROM users WHERE id = $1',
      [targetUserId]
    );
    return userResult.rows[0];
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
      'SELECT * FROM flashcard_decks WHERE user_id = $1 AND is_public = true ORDER BY created_at DESC',
      [userId]
    );
    return decksResult.rows;
  }

  async getDocuments(userId: number) {
    const documentsResult = await db.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
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
