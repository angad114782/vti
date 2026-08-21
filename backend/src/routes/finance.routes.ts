import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEmployees, getDepartments } from '../controllers/employees.controller';
import { getSalaryStructures, getPayslips, runPayroll, markPayslipPaid } from '../controllers/payroll.controller';
import { getAttendanceOverview } from '../controllers/attendance.controller';
import { getExpenses, updateExpense } from '../controllers/expenses.controller';
import { getWorkforceReport, getLeaveReport, getPayrollReport, getAttendanceReport } from '../controllers/workflows.controller';
import { validateBody, updateExpenseSchema, runPayrollSchema } from '../utils/validate';
import { requireModule } from '../middleware/requireModule';
import { requirePermission } from '../middleware/requirePermission';
import { requireSubscriptionAccess } from '../utils/subscriptionAccess';

const router = Router();
const financeAccess = requireRole('FINANCE', 'HR', 'SUPER_ADMIN');

router.use(authenticate, financeAccess, requireSubscriptionAccess);

router.get('/employees',             requirePermission('Workforce — View'), requireModule('Employee Management'), getEmployees);
router.get('/employees/departments', requirePermission('Workforce — View'), requireModule('Employee Management'), getDepartments);
router.get('/attendance',            requirePermission('Attendance — View'), requireModule('Attendance'), getAttendanceOverview);
router.get('/salary',                requirePermission('Payroll — View'), requireModule('Payroll'), getSalaryStructures);
router.get('/payslips',              requirePermission('Payroll — View'), requireModule('Payroll'), getPayslips);
router.post('/payroll/run',          requirePermission('Payroll — Process'), requireModule('Payroll'), validateBody(runPayrollSchema), runPayroll);
router.post('/payroll/payslips/:id/pay', requirePermission('Payroll — Process'), requireModule('Payroll'), markPayslipPaid);
router.get('/reports/workforce',     requirePermission('Reports — View'), requireModule('Reports & Analytics'), getWorkforceReport);
router.get('/reports/leave',         requirePermission('Reports — View'), requireModule('Reports & Analytics'), getLeaveReport);
router.get('/reports/payroll',       requirePermission('Reports — View'), requireModule('Reports & Analytics'), getPayrollReport);
router.get('/reports/attendance',    requirePermission('Reports — View'), requireModule('Reports & Analytics'), getAttendanceReport);
router.get('/expenses',              requireModule('Expenses'), getExpenses);
router.patch('/expenses/:id',        requireModule('Expenses'), validateBody(updateExpenseSchema), updateExpense);

export default router;
