import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEmployees, getDepartments } from '../controllers/employees.controller';
import { getSalaryStructures, getPayslips } from '../controllers/payroll.controller';
import { getAttendanceOverview } from '../controllers/attendance.controller';
import { getExpenses, updateExpense } from '../controllers/expenses.controller';

const router = Router();
const financeAccess = requireRole('FINANCE', 'HR', 'SUPER_ADMIN');

router.use(authenticate, financeAccess);

router.get('/employees',             getEmployees);
router.get('/employees/departments', getDepartments);
router.get('/attendance',            getAttendanceOverview);
router.get('/salary',                getSalaryStructures);
router.get('/payslips',              getPayslips);
router.get('/expenses',              getExpenses);
router.patch('/expenses/:id',        updateExpense);

export default router;
