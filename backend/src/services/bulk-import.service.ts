import fs from 'fs';
import { parse } from 'csv-parse';
import { db } from '../db';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';
import { organizationMemberRepository } from '../repositories/organization-member.repository';
import { classRepository } from '../repositories/class.repository';
import { majorRepository } from '../repositories/major.repository';

interface ImportJobRow {
  ho_ten: string;
  email: string;
  ma_so_sinh_vien: string;
  chuyen_nganh: string;
  lop: string;
}

interface JobStatus {
  id: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total: number;
  processed: number;
  success: number;
  failed: number;
  errors: { row: number; email: string; reason: string }[];
}

const jobs = new Map<string, JobStatus>();

class BulkImportService {
  public getJobStatus(jobId: string): JobStatus | undefined {
    return jobs.get(jobId);
  }

  public async startImportJob(organizationId: string, filePath: string): Promise<string> {
    const jobId = Math.random().toString(36).substring(2, 15);
    
    jobs.set(jobId, {
      id: jobId,
      status: 'PROCESSING',
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      errors: []
    });

    // Fire and forget background processing
    this.processFile(jobId, organizationId, filePath).catch(err => {
      console.error('Bulk Import Error:', err);
      const job = jobs.get(jobId);
      if (job) job.status = 'FAILED';
    });

    return jobId;
  }

  private async processFile(jobId: string, organizationId: string, filePath: string) {
    const records: ImportJobRow[] = [];
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );

    for await (const record of parser) {
      records.push(record as ImportJobRow);
    }

    fs.unlinkSync(filePath); // Cleanup file

    const job = jobs.get(jobId)!;
    job.total = records.length;

    if (records.length > 2000) {
      job.status = 'FAILED';
      job.errors.push({ row: 0, email: '', reason: 'Vượt quá giới hạn 2000 dòng' });
      return;
    }

    // Load caching data
    const majors = await majorRepository.listByOrganization(organizationId);
    const classes = await classRepository.listByOrganization(organizationId);
    
    const majorMap = new Map(majors.map(m => [m.name.toLowerCase(), m.id]));
    const classMap = new Map(classes.map(c => [c.name.toLowerCase(), c.id]));

    // Check existing members to prevent duplicate processing
    const existingMembers = await organizationMemberRepository.listByOrganization(organizationId);
    const memberEmails = new Set(existingMembers.map(m => m.user_email));
    const memberCodes = new Set(existingMembers.map(m => m.student_code));

    // Process each row
    let rowIndex = 0;
    for (const row of records) {
      rowIndex++;
      job.processed++;
      
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        if (!row.email || !row.ho_ten || !row.ma_so_sinh_vien || !row.lop) {
          throw new Error('Thiếu trường bắt buộc (ho_ten, email, ma_so_sinh_vien, lop)');
        }

        const email = row.email.toLowerCase();
        
        if (memberEmails.has(email)) {
          throw new Error('Email đã nằm trong danh sách trường');
        }
        if (memberCodes.has(row.ma_so_sinh_vien)) {
          throw new Error('Mã số sinh viên bị trùng lặp');
        }

        let majorId: string | null = null;
        if (row.chuyen_nganh) {
          majorId = majorMap.get(row.chuyen_nganh.toLowerCase()) || null;
          if (!majorId) throw new Error(`Chuyên ngành "${row.chuyen_nganh}" không tồn tại`);
        }

        const classId = classMap.get(row.lop.toLowerCase());
        if (!classId) throw new Error(`Lớp "${row.lop}" không tồn tại trong hệ thống`);

        // Check if user exists globally
        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        let userId: number;

        if (userRes.rows.length > 0) {
          // Case 2: Email đã tồn tại
          userId = userRes.rows[0].id;
        } else {
          // Case 1: Email chưa tồn tại -> Sinh user mới
          const tempPass = await bcrypt.hash('Cognito@' + row.ma_so_sinh_vien, 10);
          const newUserRes = await client.query(
            'INSERT INTO users (email, name, password, primary_organization_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [email, row.ho_ten, tempPass, organizationId]
          );
          userId = newUserRes.rows[0].id;
        }

        // Add to organization
        await client.query(
          'INSERT INTO organization_members (organization_id, user_id, org_role, class_id, student_code, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [organizationId, userId, 'student', classId, row.ma_so_sinh_vien, 'PENDING_FIRST_LOGIN']
        );

        memberEmails.add(email);
        memberCodes.add(row.ma_so_sinh_vien);
        
        await client.query('COMMIT');
        job.success++;
      } catch (err: any) {
        await client.query('ROLLBACK');
        job.failed++;
        job.errors.push({ row: rowIndex, email: row.email, reason: err.message });
      } finally {
        client.release();
      }
    }

    job.status = 'COMPLETED';
  }
}

export const bulkImportService = new BulkImportService();
