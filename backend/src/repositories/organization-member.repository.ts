import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface OrganizationMemberRow {
  id: string;
  organization_id: string;
  user_id: number;
  org_role: string;
  class_id: string | null;
  student_code: string | null;
  status: string;
  created_at: string;
}

class OrganizationMemberRepository {
  async getMembership(userId: number, organizationId: string): Promise<OrganizationMemberRow | null> {
    const res = await db.query(
      'SELECT * FROM organization_members WHERE user_id = $1 AND organization_id = $2',
      [userId, organizationId]
    );
    return res.rows[0] || null;
  }

  async getMembershipsByUserId(userId: number): Promise<any[]> {
    const res = await db.query(
      `SELECT om.*, o.name as organization_name, c.name as class_name, m.name as major_name
       FROM organization_members om
       JOIN organizations o ON om.organization_id = o.id
       LEFT JOIN school_classes c ON om.class_id = c.id
       LEFT JOIN majors m ON c.major_id = m.id
       WHERE om.user_id = $1`,
      [userId]
    );
    return res.rows;
  }

  async create(data: {
    organization_id: string;
    user_id: number;
    org_role: string;
    class_id?: string;
    student_code?: string;
    status?: string;
  }): Promise<OrganizationMemberRow> {
    const res = await db.query(
      `INSERT INTO organization_members (organization_id, user_id, org_role, class_id, student_code, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id, user_id) DO UPDATE SET 
         org_role = EXCLUDED.org_role,
         class_id = EXCLUDED.class_id,
         student_code = EXCLUDED.student_code,
         status = EXCLUDED.status
       RETURNING *`,
      [
        data.organization_id,
        data.user_id,
        data.org_role,
        data.class_id || null,
        data.student_code || null,
        data.status || 'ACTIVE'
      ]
    );
    return res.rows[0];
  }

  async listByClass(organizationId: string, classId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT om.*, u.name as user_name, u.email as user_email, u.avatar_url
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       WHERE om.organization_id = $1 AND om.class_id = $2
       ORDER BY om.student_code ASC, u.name ASC`,
      [organizationId, classId]
    );
    return res.rows;
  }

  async listByOrganization(organizationId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT om.*, u.name as user_name, u.email as user_email, c.name as class_name
       FROM organization_members om
       JOIN users u ON om.user_id = u.id
       LEFT JOIN school_classes c ON om.class_id = c.id
       WHERE om.organization_id = $1
       ORDER BY om.created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async delete(organizationId: string, userId: number): Promise<void> {
    await db.query('DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2', [organizationId, userId]);
  }
}

export const organizationMemberRepository = new OrganizationMemberRepository();
