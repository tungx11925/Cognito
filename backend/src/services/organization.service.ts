import { organizationRepository } from '../repositories/organization.repository';
import { majorRepository } from '../repositories/major.repository';
import { classRepository } from '../repositories/class.repository';
import { organizationMemberRepository } from '../repositories/organization-member.repository';
import { AppError } from '../utils/AppError';

class OrganizationService {
  async createOrganization(name: string, schoolCode: string, adminUserId: number) {
    const org = await organizationRepository.create(name, schoolCode);
    
    // Auto-assign the creator as school_admin
    await organizationMemberRepository.create({
      organization_id: org.id,
      user_id: adminUserId,
      org_role: 'school_admin'
    });

    return org;
  }

  async getOverview(organizationId: string) {
    const org = await organizationRepository.getById(organizationId);
    if (!org) throw new AppError('Không tìm thấy trường học', 404);

    const members = await organizationMemberRepository.listByOrganization(organizationId);
    const classes = await classRepository.listByOrganization(organizationId);
    const majors = await majorRepository.listByOrganization(organizationId);

    const students = members.filter(m => m.org_role === 'student');
    const teachers = members.filter(m => m.org_role === 'teacher');
    const activeStudents = students.filter(s => s.status === 'ACTIVE');

    return {
      organization: org,
      stats: {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalMajors: majors.length
      }
    };
  }

  // --- Majors ---
  async getMajors(organizationId: string) {
    return majorRepository.listByOrganization(organizationId);
  }

  async createMajor(organizationId: string, name: string, code?: string) {
    return majorRepository.create(organizationId, name, code);
  }

  // --- Classes ---
  async getClasses(organizationId: string) {
    return classRepository.listByOrganization(organizationId);
  }

  async getClassesForTeacher(organizationId: string, teacherId: number) {
    return classRepository.listByTeacher(organizationId, teacherId);
  }

  async createClass(organizationId: string, name: string, majorId?: string, homeroomTeacherId?: number, semesterId?: string, subjectId?: string) {
    if (majorId) {
      const major = await majorRepository.getByIdAndOrganization(majorId, organizationId);
      if (!major) throw new AppError('Chuyên ngành không hợp lệ', 400);
    }

    if (homeroomTeacherId) {
      // Check if teacher is in org
      const mem = await organizationMemberRepository.getMembership(homeroomTeacherId, organizationId);
      if (!mem || mem.org_role !== 'teacher') {
        throw new AppError('Giáo viên không thuộc trường này hoặc chưa được cấp quyền teacher', 400);
      }
    }

    return classRepository.create(organizationId, name, majorId, homeroomTeacherId, semesterId, subjectId);
  }

  // --- Roster ---
  async getClassRoster(organizationId: string, classId: string) {
    const cls = await classRepository.getByIdAndOrganization(classId, organizationId);
    if (!cls) throw new AppError('Lớp học không tồn tại', 404);

    const members = await organizationMemberRepository.listByClass(organizationId, classId);
    return {
      class: cls,
      students: members.filter(m => m.org_role === 'student')
    };
  }

  // --- New Enrollments & Teachers ---
  async enrollStudent(organizationId: string, classId: string, studentId: number) {
    // Validate student is in org
    const mem = await organizationMemberRepository.getMembership(studentId, organizationId);
    if (!mem || mem.org_role !== 'student') throw new AppError('Sinh viên không hợp lệ', 400);

    const { classMemberRepository } = await import('../repositories/class-member.repository');
    return classMemberRepository.enrollStudent(classId, studentId);
  }

  async assignTeacherToClass(organizationId: string, classId: string, teacherId: number, role: string) {
    const mem = await organizationMemberRepository.getMembership(teacherId, organizationId);
    if (!mem || mem.org_role !== 'teacher') throw new AppError('Giáo viên không hợp lệ', 400);

    const { classMemberRepository } = await import('../repositories/class-member.repository');
    return classMemberRepository.assignTeacher(classId, teacherId, role);
  }
}

export const organizationService = new OrganizationService();
