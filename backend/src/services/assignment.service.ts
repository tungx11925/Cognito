import { assignmentRepository } from '../repositories/assignment.repository';
import { classRepository } from '../repositories/class.repository';
import { AppError } from '../utils/AppError';
import { db } from '../db';

class AssignmentService {
  async assignToClass(
    organizationId: string, classId: string, assignedBy: number,
    testSetId?: number, documentId?: number, dueDate?: string, isMandatory?: boolean,
    title?: string, description?: string, startDate?: string, durationMinutes?: number, attemptLimit?: number, accessCode?: string
  ) {
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
      is_mandatory: isMandatory,
      title,
      description,
      start_date: startDate,
      duration_minutes: durationMinutes,
      attempt_limit: attemptLimit,
      access_code: accessCode
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
        
        // Cập nhật trạng thái bài tập (đã làm, đang làm, chưa làm) từ assignment_attempts
        for (const asg of classAsgs) {
          let status = 'NOT_STARTED';
          const attemptRes = await db.query(
            'SELECT status FROM assignment_attempts WHERE assignment_id = $1 AND student_id = $2 ORDER BY start_time DESC LIMIT 1',
            [asg.id, userId]
          );

          if (attemptRes.rows.length > 0) {
            status = attemptRes.rows[0].status; // IN_PROGRESS, SUBMITTED, GRADED
          }
          
          if (asg.due_date && new Date(asg.due_date) < new Date() && status === 'NOT_STARTED') {
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

  // --- Analytics & Results ---
  async getAssignmentResults(assignmentId: string) {
    const asg = await assignmentRepository.getById(assignmentId);
    if (!asg) throw new AppError('Assignment not found', 404);

    const attempts = await db.query(
      `SELECT a.id, a.student_id, u.name as student_name, u.email as student_email,
              a.status, a.score, a.start_time, a.end_time
       FROM assignment_attempts a
       JOIN users u ON a.student_id = u.id
       WHERE a.assignment_id = $1
       ORDER BY a.score DESC NULLS LAST`,
      [assignmentId]
    );

    return {
      assignment: asg,
      attempts: attempts.rows
    };
  }
}

export const assignmentService = new AssignmentService();
