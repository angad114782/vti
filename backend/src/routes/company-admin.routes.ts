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
  delegateWorkflowRequest,
  getWorkforceReport, getLeaveReport, getPayrollReport, getAttendanceReport,
} from '../controllers/workflows.controller';
import { validateBody, createUserSchema, updateUserSchema } from '../utils/validate';
import { requirePermission } from '../middleware/requirePermission';
import { PERMISSIONS } from '../config/access';
import { requireSubscriptionAccess } from '../utils/subscriptionAccess';

const router = Router();

const access = requireRole('COMPANY_ADMIN', 'SUPER_ADMIN');
router.use(authenticate, access, requireSubscriptionAccess);

router.get('/dashboard',           requirePermission(PERMISSIONS.DASHBOARD), getDashboard);
router.get('/users',               requirePermission(PERMISSIONS.WORKFORCE_VIEW), getUsers);
router.post('/users',              requirePermission(PERMISSIONS.WORKFORCE_EDIT), validateBody(createUserSchema), createUser);
router.patch('/users/:id',         requirePermission(PERMISSIONS.WORKFORCE_EDIT), validateBody(updateUserSchema), updateUser);
router.delete('/users/:id',        requirePermission(PERMISSIONS.WORKFORCE_EDIT), deleteUser);
router.get('/departments',         requirePermission(PERMISSIONS.WORKFORCE_VIEW), getDepartments);
router.get('/company',             requirePermission(PERMISSIONS.SETTINGS_COMPANY), getCompany);
router.patch('/company',           requirePermission(PERMISSIONS.SETTINGS_COMPANY), updateCompany);
router.get('/modules',             requirePermission(PERMISSIONS.SETTINGS_COMPANY), getModules);
router.patch('/modules/:moduleId', requirePermission(PERMISSIONS.SETTINGS_COMPANY), toggleModule);
router.get('/activity',            requirePermission(PERMISSIONS.DASHBOARD), getActivity);
router.get('/role-permissions',    requirePermission(PERMISSIONS.SETTINGS_ROLES), getRolePermissions);
router.put('/role-permissions',    requirePermission(PERMISSIONS.SETTINGS_ROLES), updateRolePermissions);

// Workflows
router.get('/workflows',          requirePermission(PERMISSIONS.SETTINGS_WORKFLOWS), getWorkflows);
router.put('/workflows/:type',    requirePermission(PERMISSIONS.SETTINGS_WORKFLOWS), saveWorkflow);
router.post('/workflows/:type/:id/delegate', requirePermission(PERMISSIONS.SETTINGS_WORKFLOWS), delegateWorkflowRequest);

// Reports
router.get('/reports/workforce',  requirePermission(PERMISSIONS.REPORTS_VIEW), getWorkforceReport);
router.get('/reports/leave',      requirePermission(PERMISSIONS.REPORTS_VIEW), getLeaveReport);
router.get('/reports/payroll',    requirePermission(PERMISSIONS.REPORTS_VIEW), getPayrollReport);
router.get('/reports/attendance', requirePermission(PERMISSIONS.REPORTS_VIEW), getAttendanceReport);

export default router;
