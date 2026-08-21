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
import { leaveAction } from '../controllers/leaves.controller';
import { selfCheckIn, selfCheckOut, getMyTodayStatus } from '../controllers/attendance.controller';
import { downloadPayslip } from '../controllers/payroll.controller';
import { createAttendanceCorrection } from '../controllers/attendanceCorrections.controller';
import { validateBody, applyLeaveSchema, submitExpenseSchema, updateProfileSchema, workflowActionSchema, createAttendanceCorrectionSchema } from '../utils/validate';
import { uploadReceipt, persistUpload } from '../middleware/upload';
import { requireModule } from '../middleware/requireModule';
import { requireSubscriptionAccess } from '../utils/subscriptionAccess';

const router = Router();

router.use(authenticate, requireRole('EMPLOYEE', 'HR', 'SUPER_ADMIN'), requireSubscriptionAccess);

router.get('/profile',    getMyProfile);
router.patch('/profile',  validateBody(updateProfileSchema), updateMyProfile);
router.get('/attendance',         requireModule('Attendance'), getMyAttendance);
router.get('/attendance/today',   requireModule('Attendance'), getMyTodayStatus);
router.post('/attendance/checkin',  requireModule('Attendance'), selfCheckIn);
router.post('/attendance/checkout', requireModule('Attendance'), selfCheckOut);
router.post('/attendance/corrections', requireModule('Attendance'), validateBody(createAttendanceCorrectionSchema), createAttendanceCorrection);
router.get('/leaves',     requireModule('Leave Management'), getMyLeaves);
router.post('/leaves',    requireModule('Leave Management'), validateBody(applyLeaveSchema), applyLeave);
router.post('/leaves/:id/actions', requireModule('Leave Management'), validateBody(workflowActionSchema), leaveAction);
router.get('/payslips',   requireModule('Payroll'), getMyPayslips);
router.get('/payslips/:id/download', requireModule('Payroll'), downloadPayslip);
router.get('/expenses',   requireModule('Expense Management'), getMyExpenses);
router.post('/expenses/upload', requireModule('Expense Management'), (req, res) => {
  uploadReceipt(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    void persistUpload(req.file, 'receipts')
      .then((filename) => res.status(201).json({ fileUrl: `/api/files/receipts/${filename}` }))
      .catch((error) => res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to store file' }));
  });
});
router.post('/expenses',  requireModule('Expense Management'), validateBody(submitExpenseSchema), submitExpense);
router.get('/documents',  requireModule('Document Management'), getDocuments);

export default router;
