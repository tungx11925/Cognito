import { assignmentRepository } from '../repositories/assignment.repository';
import { classRepository } from '../repositories/class.repository';
import { AppError } from '../utils/AppError';
import { db } from '../db';

class AssignmentService {
  async assignToClass(organizationId: string, classId: string, assignedBy: number, testSetId?: number, documentId?: number, dueDate?: string, isMandatory?: boolean) {
    // Validate class belongs to organization
    const cls = await classRepository.getByIdAndOrganization(classId, organizationId);
    if (!cls) throw new AppError('Lớp không hợp lệ hoặc không thuộc trường này', 400);

    // Create assignment
    const assignment = await assignmentRepository.create({
      class_id: classId,
      assigned_by: assignedBy,
      test_set_id: testSetId,
      document_id: documentId,
      due_date: dueDate,
      is_mandatory: isMandatory
    });

    // We can emit SSE notification here if a notification service exists
    // notificationService.emitClassNotification(classId, 'ASSIGNMENT_CREATED', assignment);

    return assignment;
  }

  async getClassAssignments(classId: string) {
    return assignmentRepository.listByClass(classId);
  }

  // --- Student View ---
  async getStudentAssignments(userId: number) {
    // 1. Lấy tất cả class_id mà student này tham gia
    const memberRes = await db.query(
      `SELECT om.class_id, o.name as school_name, c.name as class_name 
       FROM organization_members om
       JOIN organizations o ON om.organization_id = o.id
       JOIN school_classes c ON om.class_id = c.id
       WHERE om.user_id = $1 AND om.org_role = 'student'`,
      [userId]
    );

    if (memberRes.rows.length === 0) return [];

    const assignments = [];
    for (const mem of memberRes.rows) {
      if (mem.class_id) {
        const classAsgs = await assignmentRepository.listByClass(mem.class_id);
        
        // Cần mix trạng thái bài tập (đã làm hay chưa) từ bảng test_results. 
        // Do hệ thống cũ đã có, ta query thêm status.
        for (const asg of classAsgs) {
          let status = 'NOT_STARTED';
          if (asg.test_set_id) {
            const tr = await db.query(
              'SELECT id FROM test_results WHERE test_set_id = $1 AND user_id = $2 LIMIT 1',
              [asg.test_set_id, userId]
            );
            if (tr.rows.length > 0) status = 'COMPLETED';
          }
          
          if (asg.due_date && new Date(asg.due_date) < new Date() && status !== 'COMPLETED') {
            status = 'OVERDUE';
          }

          assignments.push({
            ...asg,
            school_name: mem.school_name,
            class_name: mem.class_name,
            status
          });
        }
      }
    }

    return assignments;
  }
}

export const assignmentService = new AssignmentService();
