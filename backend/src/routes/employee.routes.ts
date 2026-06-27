import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getMyProfile,
  getMyAttendance,
  getMyLeaves,
  applyLeave,
  getMyPayslips,
  getMyExpenses,
  submitExpense,
  getDocuments,
} from '../controllers/employee.controller';

const router = Router();

router.use(authenticate, requireRole('EMPLOYEE', 'HR', 'SUPER_ADMIN'));

router.get('/profile',    getMyProfile);
router.get('/attendance', getMyAttendance);
router.get('/leaves',     getMyLeaves);
router.post('/leaves',    applyLeave);
router.get('/payslips',   getMyPayslips);
router.get('/expenses',   getMyExpenses);
router.post('/expenses',  submitExpense);
router.get('/documents',  getDocuments);

export default router;
