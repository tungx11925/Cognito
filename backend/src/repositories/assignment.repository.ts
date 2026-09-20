import { db } from '../db';
import { AppError } from '../utils/AppError';

export interface ClassAssignmentRow {
  id: string;
  class_id: string;
  test_set_id: number | null;
  document_id: number | null;
  assigned_by: number;
  due_date: string | null;
  is_mandatory: boolean;
  created_at: string;
}

class AssignmentRepository {
  async create(data: {
    class_id: string;
    test_set_id?: number;
    document_id?: number;
    assigned_by: number;
    due_date?: string;
    is_mandatory?: boolean;
  }): Promise<ClassAssignmentRow> {
    if (!data.test_set_id && !data.document_id) {
      throw new AppError('Phải có test_set_id hoặc document_id', 400);
    }

    const res = await db.query(
      `INSERT INTO class_assignments (class_id, test_set_id, document_id, assigned_by, due_date, is_mandatory)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.class_id,
        data.test_set_id || null,
        data.document_id || null,
        data.assigned_by,
        data.due_date || null,
        data.is_mandatory || false
      ]
    );
    return res.rows[0];
  }

  async listByClass(classId: string): Promise<any[]> {
    const res = await db.query(
      `SELECT ca.*, 
              ts.name as test_set_name, 
              ts.total_questions as test_set_questions,
              d.title as document_title,
              u.name as assigner_name
       FROM class_assignments ca
       LEFT JOIN test_sets ts ON ca.test_set_id = ts.id
       LEFT JOIN documents d ON ca.document_id = d.id
       LEFT JOIN users u ON ca.assigned_by = u.id
       WHERE ca.class_id = $1
       ORDER BY ca.created_at DESC`,
      [classId]
    );
    return res.rows;
  }

  async getById(id: string): Promise<ClassAssignmentRow | null> {
    const res = await db.query('SELECT * FROM class_assignments WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<void> {
    await db.query('DELETE FROM class_assignments WHERE id = $1', [id]);
  }
}

export const assignmentRepository = new AssignmentRepository();
