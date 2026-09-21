import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface SchoolClassRow {
  id: string;
  organization_id: string;
  major_id: string | null;
  name: string;
  homeroom_teacher_id: number | null;
  created_at: string;
}

class ClassRepository {
  async listByOrganization(organizationId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT c.*, m.name as major_name, u.name as teacher_name, u.email as teacher_email
       FROM school_classes c
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN users u ON c.homeroom_teacher_id = u.id
       WHERE c.organization_id = $1
       ORDER BY c.name ASC`,
      [organizationId]
    );
    return res.rows;
  }

  async listByTeacher(organizationId: string, teacherId: number): Promise<any[]> {
    // Teacher sees classes they are homeroom teacher for OR classes they have a role in organization_members with class_id
    const res = await db.query(
      `SELECT DISTINCT c.*, m.name as major_name
       FROM school_classes c
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN organization_members om ON c.id = om.class_id AND om.user_id = $2
       WHERE c.organization_id = $1 
         AND (c.homeroom_teacher_id = $2 OR om.id IS NOT NULL)
       ORDER BY c.name ASC`,
      [organizationId, teacherId]
    );
    return res.rows;
  }

  async create(organizationId: string, name: string, majorId?: string, teacherId?: number, semesterId?: string, subjectId?: string): Promise<SchoolClassRow> {
    const res = await db.query(
      'INSERT INTO school_classes (organization_id, name, major_id, homeroom_teacher_id, semester_id, subject_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [organizationId, name, majorId || null, teacherId || null, semesterId || null, subjectId || null]
    );
    return res.rows[0];
  }

  async getByIdAndOrganization(id: string, organizationId: string): Promise<SchoolClassRow | null> {
    const res = await db.query(
      'SELECT * FROM school_classes WHERE id = $1 AND organization_id = $2',
      [id, organizationId]
    );
    return res.rows[0] || null;
  }

  async update(id: string, organizationId: string, name: string, majorId?: string, teacherId?: number, semesterId?: string, subjectId?: string): Promise<SchoolClassRow | null> {
    const res = await db.query(
      'UPDATE school_classes SET name = $1, major_id = $2, homeroom_teacher_id = $3, semester_id = $4, subject_id = $5 WHERE id = $6 AND organization_id = $7 RETURNING *',
      [name, majorId || null, teacherId || null, semesterId || null, subjectId || null, id, organizationId]
    );
    return res.rows[0] || null;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await db.query('DELETE FROM school_classes WHERE id = $1 AND organization_id = $2', [id, organizationId]);
  }
}

export const classRepository = new ClassRepository();
