import { db, withTransaction } from '../db';
import { PoolClient } from 'pg';

export class UserRepository {
  async findByEmail(email: string, client?: PoolClient) {
    const q = client || db;
    const result = await q.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async findByName(name: string, client?: PoolClient) {
    const q = client || db;
    const result = await q.query('SELECT * FROM users WHERE name = $1', [name]);
    return result.rows[0];
  }

  async findByPhone(phone: string, client?: PoolClient) {
    const q = client || db;
    const result = await q.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return result.rows[0];
  }

  async findById(id: number, client?: PoolClient) {
    const q = client || db;
    const result = await q.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(user: any, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      'INSERT INTO users (email, phone, password, name) VALUES ($1, $2, $3, $4) RETURNING id, email, phone, name, education, address, website, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting, role',
      [user.email, user.phone, user.password, user.name]
    );
    return result.rows[0];
  }

  async updateVerificationCode(id: number, code: string | null, expires: Date | null, client?: PoolClient) {
    const q = client || db;
    await q.query(
      'UPDATE users SET verification_code = $1, code_expires_at = $2 WHERE id = $3',
      [code, expires, id]
    );
  }

  async updateAvatar(id: number, avatarUrl: string, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, name, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting, role',
      [avatarUrl, id]
    );
    return result.rows[0];
  }

  async updateVerificationStatus(id: number, isVerified: boolean, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      'UPDATE users SET is_verified = $1 WHERE id = $2 RETURNING id, email, name, phone, education, address, website, avatar_url, is_verified, streak, last_study_date',
      [isVerified, id]
    );
    return result.rows[0];
  }

  async updateProfile(id: number, data: any, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      'UPDATE users SET name = $1, phone = $2, education = $3, address = $4, privacy_setting = $5 WHERE id = $6 RETURNING id, email, name, phone, education, address, created_at, avatar_url, is_verified, streak, last_study_date, privacy_setting, role',
      [data.name, data.phone, data.education, data.address, data.privacy_setting, id]
    );
    return result.rows[0];
  }

  async updatePassword(id: number, hashed: string, client?: PoolClient) {
    const q = client || db;
    await q.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);
  }

  async updateRole(id: number, role: string, client?: PoolClient) {
    const q = client || db;
    const result = await q.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role, phone, education, address, website, avatar_url, is_verified, streak, last_study_date, privacy_setting',
      [role, id]
    );
    return result.rows[0];
  }

  async checkAvailability(field: string, value: string, client?: PoolClient) {
    const q = client || db;
    const query = `SELECT id FROM users WHERE ${field} = $1`;
    const result = await q.query(query, [value]);
    return result.rows.length > 0;
  }
}

export const userRepository = new UserRepository();
