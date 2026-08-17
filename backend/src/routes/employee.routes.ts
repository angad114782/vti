import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
  getMyAttendance,
  getMyLeaves,
  applyLeave,
  getMyPayslips,
  getMyExpenses,
  submitExpense,
  getDocuments,
} from '../controllers/employee.controller';
import { selfCheckIn, selfCheckOut, getMyTodayStatus } from '../controllers/attendance.controller';
import { validateBody, applyLeaveSchema, submitExpenseSchema, updateProfileSchema } from '../utils/validate';
import { uploadReceipt } from '../middleware/upload';

const router = Router();

router.use(authenticate, requireRole('EMPLOYEE', 'HR', 'SUPER_ADMIN'));

router.get('/profile',    getMyProfile);
router.patch('/profile',  validateBody(updateProfileSchema), updateMyProfile);
router.get('/attendance',         getMyAttendance);
router.get('/attendance/today',   getMyTodayStatus);
router.post('/attendance/checkin',  selfCheckIn);
router.post('/attendance/checkout', selfCheckOut);
router.get('/leaves',     getMyLeaves);
router.post('/leaves',    validateBody(applyLeaveSchema), applyLeave);
router.get('/payslips',   getMyPayslips);
router.get('/expenses',   getMyExpenses);
router.post('/expenses/upload', (req, res) => {
  uploadReceipt(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/receipts/${req.file.filename}`;
    res.status(201).json({ fileUrl });
  });
});
router.post('/expenses',  validateBody(submitExpenseSchema), submitExpense);
router.get('/documents',  getDocuments);

export default router;
