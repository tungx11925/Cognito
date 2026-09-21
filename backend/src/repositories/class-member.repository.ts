import { db } from '../db';

class ClassMemberRepository {
  // --- Enrollments (Students) ---
  async getEnrollments(classId: string) {
    const res = await db.query(
      `SELECT e.*, u.name, u.email 
       FROM class_enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.class_id = $1
       ORDER BY u.name ASC`,
      [classId]
    );
    return res.rows;
  }

  async enrollStudent(classId: string, studentId: number) {
    const res = await db.query(
      `INSERT INTO class_enrollments (class_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (class_id, student_id) 
       DO UPDATE SET status = 'ACTIVE' 
       RETURNING *`,
      [classId, studentId]
    );
    return res.rows[0];
  }

  async unenrollStudent(classId: string, studentId: number) {
    const res = await db.query(
      `UPDATE class_enrollments 
       SET status = 'DROPPED'
       WHERE class_id = $1 AND student_id = $2
       RETURNING *`,
      [classId, studentId]
    );
    return res.rows[0];
  }

  // --- Teacher Assignments ---
  async getTeachers(classId: string) {
    const res = await db.query(
      `SELECT t.*, u.name, u.email 
       FROM class_teacher_assignments t
       JOIN users u ON t.teacher_id = u.id
       WHERE t.class_id = $1
       ORDER BY u.name ASC`,
      [classId]
    );
    return res.rows;
  }

  async assignTeacher(classId: string, teacherId: number, role: string = 'LECTURER') {
    const res = await db.query(
      `INSERT INTO class_teacher_assignments (class_id, teacher_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (class_id, teacher_id) 
       DO UPDATE SET role = $3
       RETURNING *`,
      [classId, teacherId, role]
    );
    return res.rows[0];
  }

  async removeTeacher(classId: string, teacherId: number) {
    await db.query(
      `DELETE FROM class_teacher_assignments 
       WHERE class_id = $1 AND teacher_id = $2`,
      [classId, teacherId]
    );
  }
}

export const classMemberRepository = new ClassMemberRepository();
