import express from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { requireOrgRole } from '../middlewares/orgRole.middleware';
import * as schoolController from '../controllers/school.controller';

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

// School Admin or Teacher APIs
orgRouter.get('/', requireOrgRole('school_admin', 'teacher'), schoolController.getOverview);
orgRouter.get('/majors', requireOrgRole('school_admin', 'teacher'), schoolController.getMajors);
orgRouter.get('/classes', requireOrgRole('school_admin', 'teacher'), schoolController.getClasses);
orgRouter.get('/classes/:classId/roster', requireOrgRole('school_admin', 'teacher'), schoolController.getClassRoster);

orgRouter.post('/classes/:classId/assign', requireOrgRole('school_admin', 'teacher'), schoolController.assignToClass);
orgRouter.get('/classes/:classId/assignments', requireOrgRole('school_admin', 'teacher', 'student'), schoolController.getClassAssignments);

export default router;
