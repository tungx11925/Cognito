import express from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { requireOrgRole } from '../middlewares/orgRole.middleware';
import * as schoolController from '../controllers/school.controller';
import * as academicController from '../controllers/academic.controller';

const router = express.Router();
const upload = multer({ dest: 'uploads/csv/' });

// System admin API
router.post('/', authenticate, requireRole('admin'), schoolController.createSchool);

// Global user assignments
router.get('/my-assignments', authenticate, schoolController.getMyAssignments);

// --- Organization Scoped APIs ---
const orgRouter = express.Router({ mergeParams: true });
router.use('/:organizationId', authenticate, orgRouter);

// School Admin only APIs
orgRouter.post('/majors', requireOrgRole('school_admin'), schoolController.createMajor);
orgRouter.post('/classes', requireOrgRole('school_admin'), schoolController.createClass);
orgRouter.post('/students/import', requireOrgRole('school_admin'), upload.single('file'), schoolController.importStudents);
orgRouter.get('/students/import/:jobId', requireOrgRole('school_admin'), schoolController.getImportStatus);

// Academic Years
orgRouter.get('/academic-years', requireOrgRole('school_admin', 'teacher'), academicController.getAcademicYears);
orgRouter.post('/academic-years', requireOrgRole('school_admin'), academicController.createAcademicYear);
orgRouter.put('/academic-years/:id', requireOrgRole('school_admin'), academicController.updateAcademicYear);

// Semesters
orgRouter.get('/academic-years/:academicYearId/semesters', requireOrgRole('school_admin', 'teacher'), academicController.getSemesters);
orgRouter.post('/semesters', requireOrgRole('school_admin'), academicController.createSemester);
orgRouter.put('/semesters/:id', requireOrgRole('school_admin'), academicController.updateSemester);

// Subjects
orgRouter.get('/subjects', requireOrgRole('school_admin', 'teacher'), academicController.getSubjects);
orgRouter.post('/subjects', requireOrgRole('school_admin'), academicController.createSubject);
orgRouter.put('/subjects/:id', requireOrgRole('school_admin'), academicController.updateSubject);


// School Admin or Teacher APIs
orgRouter.get('/', requireOrgRole('school_admin', 'teacher'), schoolController.getOverview);
orgRouter.get('/majors', requireOrgRole('school_admin', 'teacher'), schoolController.getMajors);
orgRouter.get('/classes', requireOrgRole('school_admin', 'teacher'), schoolController.getClasses);
orgRouter.get('/classes/:classId/roster', requireOrgRole('school_admin', 'teacher'), schoolController.getClassRoster);

// Enrollments and Teachers
orgRouter.post('/classes/:classId/enrollments', requireOrgRole('school_admin', 'teacher'), schoolController.enrollStudent);
orgRouter.post('/classes/:classId/teachers', requireOrgRole('school_admin'), schoolController.assignTeacherToClass);

orgRouter.post('/classes/:classId/assign', requireOrgRole('school_admin', 'teacher'), schoolController.assignToClass);
orgRouter.get('/classes/:classId/assignments', requireOrgRole('school_admin', 'teacher', 'student'), schoolController.getClassAssignments);
orgRouter.get('/classes/:classId/assignments/:assignmentId/results', requireOrgRole('school_admin', 'teacher'), schoolController.getAssignmentResults);

export default router;
