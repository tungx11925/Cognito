import { Response } from 'express';
import { academicService } from '../services/academic.service';
import { OrgAuthRequest } from '../middlewares/orgRole.middleware';

// --- Academic Years ---
export const getAcademicYears = async (req: OrgAuthRequest, res: Response) => {
  try {
    const data = await academicService.getAcademicYears(req.params.organizationId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const createAcademicYear = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, start_date, end_date } = req.body;
    const data = await academicService.createAcademicYear(req.params.organizationId, name, start_date, end_date);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateAcademicYear = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, status, start_date, end_date } = req.body;
    const data = await academicService.updateAcademicYear(req.params.id, req.params.organizationId, name, status, start_date, end_date);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// --- Semesters ---
export const getSemesters = async (req: OrgAuthRequest, res: Response) => {
  try {
    const data = await academicService.getSemesters(req.params.academicYearId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const createSemester = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { academic_year_id, name, start_date, end_date } = req.body;
    const data = await academicService.createSemester(req.params.organizationId, academic_year_id, name, start_date, end_date);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateSemester = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, status, start_date, end_date } = req.body;
    const data = await academicService.updateSemester(req.params.id, req.params.organizationId, name, status, start_date, end_date);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

// --- Subjects ---
export const getSubjects = async (req: OrgAuthRequest, res: Response) => {
  try {
    const data = await academicService.getSubjects(req.params.organizationId);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const createSubject = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, code, major_id, credits } = req.body;
    const data = await academicService.createSubject(req.params.organizationId, name, code, major_id, credits);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateSubject = async (req: OrgAuthRequest, res: Response) => {
  try {
    const { name, code, major_id, credits, status } = req.body;
    const data = await academicService.updateSubject(req.params.id, req.params.organizationId, name, code, major_id, credits, status);
    res.json(data);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
