import { db } from '../db';

class AcademicRepository {
  // --- Academic Years ---
  async getAcademicYears(organizationId: string) {
    const res = await db.query(
      `SELECT * FROM academic_years WHERE organization_id = $1 ORDER BY start_date DESC, created_at DESC`,
      [organizationId]
    );
    return res.rows;
  }

  async getAcademicYearById(id: string, organizationId: string) {
    const res = await db.query(
      `SELECT * FROM academic_years WHERE id = $1 AND organization_id = $2`,
      [id, organizationId]
    );
    return res.rows[0];
  }

  async createAcademicYear(organizationId: string, name: string, startDate?: string, endDate?: string) {
    const res = await db.query(
      `INSERT INTO academic_years (organization_id, name, start_date, end_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [organizationId, name, startDate || null, endDate || null]
    );
    return res.rows[0];
  }

  async updateAcademicYear(id: string, organizationId: string, name: string, status: string, startDate?: string, endDate?: string) {
    const res = await db.query(
      `UPDATE academic_years 
       SET name = $1, status = $2, start_date = $3, end_date = $4
       WHERE id = $5 AND organization_id = $6 RETURNING *`,
      [name, status, startDate || null, endDate || null, id, organizationId]
    );
    return res.rows[0];
  }

  // --- Semesters ---
  async getSemesters(academicYearId: string) {
    const res = await db.query(
      `SELECT * FROM semesters WHERE academic_year_id = $1 ORDER BY start_date ASC, created_at ASC`,
      [academicYearId]
    );
    return res.rows;
  }

  async getSemesterById(id: string, organizationId: string) {
    // Need to join to ensure the academic_year belongs to the organization
    const res = await db.query(
      `SELECT s.* FROM semesters s
       JOIN academic_years a ON s.academic_year_id = a.id
       WHERE s.id = $1 AND a.organization_id = $2`,
      [id, organizationId]
    );
    return res.rows[0];
  }

  async createSemester(academicYearId: string, name: string, startDate?: string, endDate?: string) {
    const res = await db.query(
      `INSERT INTO semesters (academic_year_id, name, start_date, end_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [academicYearId, name, startDate || null, endDate || null]
    );
    return res.rows[0];
  }

  async updateSemester(id: string, name: string, status: string, startDate?: string, endDate?: string) {
    const res = await db.query(
      `UPDATE semesters 
       SET name = $1, status = $2, start_date = $3, end_date = $4
       WHERE id = $5 RETURNING *`,
      [name, status, startDate || null, endDate || null, id]
    );
    return res.rows[0];
  }

  // --- Subjects ---
  async getSubjects(organizationId: string) {
    const res = await db.query(
      `SELECT s.*, m.name as major_name 
       FROM subjects s
       LEFT JOIN majors m ON s.major_id = m.id
       WHERE s.organization_id = $1 
       ORDER BY s.name ASC`,
      [organizationId]
    );
    return res.rows;
  }

  async createSubject(organizationId: string, name: string, code: string, majorId?: string, credits?: number) {
    const res = await db.query(
      `INSERT INTO subjects (organization_id, name, code, major_id, credits)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organizationId, name, code, majorId || null, credits || null]
    );
    return res.rows[0];
  }

  async updateSubject(id: string, organizationId: string, name: string, code: string, majorId?: string, credits?: number, status?: boolean) {
    const res = await db.query(
      `UPDATE subjects 
       SET name = $1, code = $2, major_id = $3, credits = $4, status = $5
       WHERE id = $6 AND organization_id = $7 RETURNING *`,
      [name, code, majorId || null, credits || null, status ?? true, id, organizationId]
    );
    return res.rows[0];
  }
}

export const academicRepository = new AcademicRepository();
