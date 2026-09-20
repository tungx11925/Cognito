import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface MajorRow {
  id: string;
  organization_id: string;
  name: string;
  code: string | null;
  created_at: string;
}

class MajorRepository {
  async listByOrganization(organizationId: string): Promise<MajorRow[]> {
    const res = await db.query(
      'SELECT * FROM majors WHERE organization_id = $1 ORDER BY name ASC',
      [organizationId]
    );
    return res.rows;
  }

  async create(organizationId: string, name: string, code?: string): Promise<MajorRow> {
    const res = await db.query(
      'INSERT INTO majors (organization_id, name, code) VALUES ($1, $2, $3) RETURNING *',
      [organizationId, name, code || null]
    );
    return res.rows[0];
  }

  async getByIdAndOrganization(id: string, organizationId: string): Promise<MajorRow | null> {
    const res = await db.query(
      'SELECT * FROM majors WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );
    return res.rows[0] || null;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await db.query('DELETE FROM majors WHERE id = $1 AND organization_id = $2', [id, organizationId]);
  }
}

export const majorRepository = new MajorRepository();
