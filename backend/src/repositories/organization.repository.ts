import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface OrganizationRow {
  id: string;
  name: string;
  school_code: string;
  is_active: boolean;
  created_at: string;
}

class OrganizationRepository {
  async getById(id: string): Promise<OrganizationRow | null> {
    const res = await db.query('SELECT * FROM organizations WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async getBySchoolCode(schoolCode: string): Promise<OrganizationRow | null> {
    const res = await db.query('SELECT * FROM organizations WHERE school_code = $1', [schoolCode]);
    return res.rows[0] || null;
  }

  async create(name: string, schoolCode: string): Promise<OrganizationRow> {
    try {
      const res = await db.query(
        'INSERT INTO organizations (name, school_code) VALUES ($1, $2) RETURNING *',
        [name, schoolCode]
      );
      return res.rows[0];
    } catch (err: any) {
      if (err.code === '23505') { // unique violation
        throw new AppError('Mã trường đã tồn tại trong hệ thống', 400);
      }
      throw err;
    }
  }

  async update(id: string, name: string, isActive: boolean): Promise<OrganizationRow | null> {
    const res = await db.query(
      'UPDATE organizations SET name = $1, is_active = $2 WHERE id = $3 RETURNING *',
      [name, isActive, id]
    );
    return res.rows[0] || null;
  }
}

export const organizationRepository = new OrganizationRepository();
