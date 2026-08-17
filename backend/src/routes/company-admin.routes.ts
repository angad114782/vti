import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getDashboard,
  getUsers, createUser, updateUser, deleteUser,
  getDepartments,
  getCompany, updateCompany,
  getModules, toggleModule,
  getActivity,
  getRolePermissions, updateRolePermissions,
} from '../controllers/company-admin.controller';
import {
  getWorkflows, saveWorkflow,
  getWorkforceReport, getLeaveReport, getPayrollReport, getAttendanceReport,
} from '../controllers/workflows.controller';
import { validateBody, createUserSchema, updateUserSchema } from '../utils/validate';

const router = Router();

const access = requireRole('COMPANY_ADMIN', 'SUPER_ADMIN');
router.use(authenticate, access);

router.get('/dashboard',           getDashboard);
router.get('/users',               getUsers);
router.post('/users',              validateBody(createUserSchema), createUser);
router.patch('/users/:id',         validateBody(updateUserSchema), updateUser);
router.delete('/users/:id',        deleteUser);
router.get('/departments',         getDepartments);
router.get('/company',             getCompany);
router.patch('/company',           updateCompany);
router.get('/modules',             getModules);
router.patch('/modules/:moduleId', toggleModule);
router.get('/activity',            getActivity);
router.get('/role-permissions',    getRolePermissions);
router.put('/role-permissions',    updateRolePermissions);

// Workflows
router.get('/workflows',          getWorkflows);
router.put('/workflows/:type',    saveWorkflow);

// Reports
router.get('/reports/workforce',  getWorkforceReport);
router.get('/reports/leave',      getLeaveReport);
router.get('/reports/payroll',    getPayrollReport);
router.get('/reports/attendance', getAttendanceReport);

export default router;
