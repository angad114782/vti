import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEmployees, getEmployee, createEmployee, updateEmployee, getDepartments } from '../controllers/employees.controller';
import { getLeaves, updateLeaveStatus } from '../controllers/leaves.controller';
import { getApprovals, updateApproval } from '../controllers/approvals.controller';
import { getSalaryStructures, getPayslips } from '../controllers/payroll.controller';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documents.controller';
import { getAttendanceOverview } from '../controllers/attendance.controller';

const router = Router();
router.use(authenticate);

const hrOnly = requireRole('HR', 'SUPER_ADMIN', 'COMPANY_ADMIN');
const managerAccess = requireRole('HR', 'SUPER_ADMIN', 'MANAGER', 'SUPERVISOR', 'COMPANY_ADMIN');

// Employees — managers/supervisors can read, HR can write
router.get('/employees', managerAccess, getEmployees);
router.get('/employees/departments', managerAccess, getDepartments);
router.get('/employees/:id', managerAccess, getEmployee);
router.post('/employees', hrOnly, createEmployee);
router.patch('/employees/:id', hrOnly, updateEmployee);

// Attendance
router.get('/attendance', managerAccess, getAttendanceOverview);

// Leaves
router.get('/leaves', managerAccess, getLeaves);
router.patch('/leaves/:id', managerAccess, updateLeaveStatus);

// Approvals
router.get('/approvals', managerAccess, getApprovals);
router.patch('/approvals/:id', managerAccess, updateApproval);

// Payroll — HR only
router.get('/payroll/salary', hrOnly, getSalaryStructures);
router.get('/payroll/payslips', hrOnly, getPayslips);

// Documents — HR only
router.get('/documents', hrOnly, getDocuments);
router.post('/documents', hrOnly, createDocument);
router.delete('/documents/:id', hrOnly, deleteDocument);

export default router;
