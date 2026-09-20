import { Request, Response } from 'express';
import { organizationService } from '../services/organization.service';
import { bulkImportService } from '../services/bulk-import.service';
import { assignmentService } from '../services/assignment.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { OrgAuthRequest } from '../middlewares/orgRole.middleware';
import { db } from '../db';

const checkClassAccess = async (organizationId: string, classId: string, userId: number, orgRole: string) => {
  if (orgRole === 'school_admin') return true;
  if (orgRole === 'student') {
    const res = await db.query(
      "SELECT id FROM organization_members WHERE user_id = $1 AND organization_id = $2 AND class_id = $3 AND org_role = 'student'",
      [userId, organizationId, classId]
    );
    return res.rows.length > 0;
  }
  if (orgRole === 'teacher') {
    const res = await db.query(
      `SELECT c.id
       FROM school_classes c
       LEFT JOIN organization_members om ON c.id = om.class_id AND om.user_id = $2
       WHERE c.id = $3 AND c.organization_id = $1 
         AND (c.homeroom_teacher_id = $2 OR om.id IS NOT NULL)
       LIMIT 1`,
      [organizationId, userId, classId]
    );
    return res.rows.length > 0;
  }
  return false;
};

export const createSchool = async (req: AuthRequest, res: Response) => {
  try {
    const { name, school_code } = req.body;
    const org = await organizationService.createOrganization(name, school_code, req.user!.id);
    res.status(201).json(org);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Lỗi server' });
  }
};

export const getOverview = async (req: OrgAuthRequest, res: Response) => {
  try {
    const data = await organizationService.getOverview(req.params.organizationId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getMajors = async (req: OrgAuthRequest, res: Response) => {
  try {
    const data = await organizationService.getMajors(req.params.organizationId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const createMajor = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, code } = req.body;
    const data = await organizationService.createMajor(req.params.organizationId, name, code);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getClasses = async (req: OrgAuthRequest, res: Response) => {
  try {
    const orgRole = req.orgMembership!.org_role;
    if (orgRole === 'teacher') {
      const data = await organizationService.getClassesForTeacher(req.params.organizationId, req.user!.id);
      return res.json(data);
    } else {
      const data = await organizationService.getClasses(req.params.organizationId);
      return res.json(data);
    }
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const createClass = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, major_id, homeroom_teacher_id } = req.body;
    const data = await organizationService.createClass(req.params.organizationId, name, major_id, homeroom_teacher_id);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getClassRoster = async (req: OrgAuthRequest, res: Response) => {
  try {
    if (!(await checkClassAccess(req.params.organizationId, req.params.classId, req.user!.id, req.orgMembership!.org_role))) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp học này' });
    }
    const data = await organizationService.getClassRoster(req.params.organizationId, req.params.classId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// --- Bulk Import ---
export const importStudents = async (req: OrgAuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không tìm thấy file CSV' });
    }
    const jobId = await bulkImportService.startImportJob(req.params.organizationId, req.file.path);
    res.json({ jobId, message: 'Đang xử lý import' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getImportStatus = async (req: OrgAuthRequest, res: Response) => {
  try {
    const status = bulkImportService.getJobStatus(req.params.jobId);
    if (!status) return res.status(404).json({ error: 'Không tìm thấy Job ID' });
    res.json(status);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// --- Assignments ---
export const assignToClass = async (req: OrgAuthRequest, res: Response) => {
  try {
    if (!(await checkClassAccess(req.params.organizationId, req.params.classId, req.user!.id, req.orgMembership!.org_role))) {
      return res.status(403).json({ error: 'Bạn không có quyền giao bài tập cho lớp học này' });
    }
    const { test_set_id, document_id, due_date, is_mandatory } = req.body;
    const data = await assignmentService.assignToClass(
      req.params.organizationId,
      req.params.classId,
      req.user!.id,
      test_set_id,
      document_id,
      due_date,
      is_mandatory
    );
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getClassAssignments = async (req: OrgAuthRequest, res: Response) => {
  try {
    if (!(await checkClassAccess(req.params.organizationId, req.params.classId, req.user!.id, req.orgMembership!.org_role))) {
      return res.status(403).json({ error: 'Bạn không có quyền xem bài tập của lớp học này' });
    }
    const data = await assignmentService.getClassAssignments(req.params.classId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// --- API độc lập cho student để lấy bài tập (không cần truyền organizationId trên param) ---
export const getMyAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentService.getStudentAssignments(req.user!.id);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
