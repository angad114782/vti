import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEmployees, getDepartments } from '../controllers/employees.controller';
import { getSalaryStructures, getPayslips, runPayroll } from '../controllers/payroll.controller';
import { getAttendanceOverview } from '../controllers/attendance.controller';
import { getExpenses, updateExpense } from '../controllers/expenses.controller';
import { getWorkforceReport, getLeaveReport, getPayrollReport, getAttendanceReport } from '../controllers/workflows.controller';
import { validateBody, updateExpenseSchema, runPayrollSchema } from '../utils/validate';
import { requireModule } from '../middleware/requireModule';

const router = Router();
const financeAccess = requireRole('FINANCE', 'HR', 'SUPER_ADMIN');

router.use(authenticate, financeAccess);

router.get('/employees',             getEmployees);
router.get('/employees/departments', getDepartments);
router.get('/attendance',            getAttendanceOverview);
router.get('/salary',                requireModule('Payroll'), getSalaryStructures);
router.get('/payslips',              requireModule('Payroll'), getPayslips);
router.post('/payroll/run',          requireModule('Payroll'), validateBody(runPayrollSchema), runPayroll);
router.get('/reports/workforce',     getWorkforceReport);
router.get('/reports/leave',         getLeaveReport);
router.get('/reports/payroll',       getPayrollReport);
router.get('/reports/attendance',    getAttendanceReport);
router.get('/expenses',              requireModule('Expenses'), getExpenses);
router.patch('/expenses/:id',        requireModule('Expenses'), validateBody(updateExpenseSchema), updateExpense);

export default router;
