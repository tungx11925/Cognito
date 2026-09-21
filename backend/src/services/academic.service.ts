import { academicRepository } from '../repositories/academic.repository';
import { AppError } from '../utils/AppError';

class AcademicService {
  // --- Academic Years ---
  async getAcademicYears(organizationId: string) {
    return academicRepository.getAcademicYears(organizationId);
  }

  async createAcademicYear(organizationId: string, name: string, startDate?: string, endDate?: string) {
    if (!name) throw new AppError('Tên năm học là bắt buộc', 400);
    return academicRepository.createAcademicYear(organizationId, name, startDate, endDate);
  }

  async updateAcademicYear(id: string, organizationId: string, name: string, status: string, startDate?: string, endDate?: string) {
    const ay = await academicRepository.getAcademicYearById(id, organizationId);
    if (!ay) throw new AppError('Năm học không tồn tại', 404);
    return academicRepository.updateAcademicYear(id, organizationId, name, status, startDate, endDate);
  }

  // --- Semesters ---
  async getSemesters(academicYearId: string) {
    return academicRepository.getSemesters(academicYearId);
  }

  async createSemester(organizationId: string, academicYearId: string, name: string, startDate?: string, endDate?: string) {
    const ay = await academicRepository.getAcademicYearById(academicYearId, organizationId);
    if (!ay) throw new AppError('Năm học không tồn tại', 404);
    if (!name) throw new AppError('Tên học kỳ là bắt buộc', 400);
    return academicRepository.createSemester(academicYearId, name, startDate, endDate);
  }

  async updateSemester(id: string, organizationId: string, name: string, status: string, startDate?: string, endDate?: string) {
    const sem = await academicRepository.getSemesterById(id, organizationId);
    if (!sem) throw new AppError('Học kỳ không tồn tại', 404);
    return academicRepository.updateSemester(id, name, status, startDate, endDate);
  }

  // --- Subjects ---
  async getSubjects(organizationId: string) {
    return academicRepository.getSubjects(organizationId);
  }

  async createSubject(organizationId: string, name: string, code: string, majorId?: string, credits?: number) {
    if (!name || !code) throw new AppError('Tên và mã môn học là bắt buộc', 400);
    return academicRepository.createSubject(organizationId, name, code, majorId, credits);
  }

  async updateSubject(id: string, organizationId: string, name: string, code: string, majorId?: string, credits?: number, status?: boolean) {
    return academicRepository.updateSubject(id, organizationId, name, code, majorId, credits, status);
  }
}

export const academicService = new AcademicService();
