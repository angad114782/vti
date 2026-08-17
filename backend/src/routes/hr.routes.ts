import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEmployees, getEmployee, createEmployee, updateEmployee, getDepartments } from '../controllers/employees.controller';
import { getLeaves, updateLeaveStatus } from '../controllers/leaves.controller';
import { getApprovals, updateApproval } from '../controllers/approvals.controller';
import { getSalaryStructures, getPayslips, runPayroll } from '../controllers/payroll.controller';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documents.controller';
import { getAttendanceOverview, getAttendanceRecords, createAttendanceRecord } from '../controllers/attendance.controller';
import { getShifts, createShift, updateShift } from '../controllers/shifts.controller';
import { getWorkforceReport, getLeaveReport, getPayrollReport, getAttendanceReport } from '../controllers/workflows.controller';
import { validateBody, createEmployeeSchema, updateEmployeeSchema, updateLeaveStatusSchema, updateApprovalSchema, createDocumentSchema, createAttendanceSchema, runPayrollSchema, createShiftSchema, updateShiftSchema } from '../utils/validate';
import { uploadDocument } from '../middleware/upload';
import { requireModule } from '../middleware/requireModule';

const router = Router();
router.use(authenticate);

const hrOnly = requireRole('HR', 'SUPER_ADMIN', 'COMPANY_ADMIN');
const managerAccess = requireRole('HR', 'SUPER_ADMIN', 'MANAGER', 'SUPERVISOR', 'COMPANY_ADMIN', 'FINANCE');

// Employees — managers/supervisors can read, HR can write
router.get('/employees', managerAccess, getEmployees);
router.get('/employees/departments', managerAccess, getDepartments);
router.get('/employees/:id', managerAccess, getEmployee);
router.post('/employees', hrOnly, validateBody(createEmployeeSchema), createEmployee);
router.patch('/employees/:id', hrOnly, validateBody(updateEmployeeSchema), updateEmployee);

// Attendance
router.get('/attendance',         managerAccess, getAttendanceOverview);
router.get('/attendance/records', managerAccess, getAttendanceRecords);
router.post('/attendance',        hrOnly,        validateBody(createAttendanceSchema), createAttendanceRecord);

// Leaves
router.get('/leaves', managerAccess, getLeaves);
router.patch('/leaves/:id', managerAccess, validateBody(updateLeaveStatusSchema), updateLeaveStatus);

// Approvals
router.get('/approvals', managerAccess, getApprovals);
router.patch('/approvals/:id', managerAccess, validateBody(updateApprovalSchema), updateApproval);

// Payroll — HR only; requires Payroll module enabled for the company
router.get('/payroll/salary', hrOnly, requireModule('Payroll'), getSalaryStructures);
router.get('/payroll/payslips', hrOnly, requireModule('Payroll'), getPayslips);
router.post('/payroll/run', hrOnly, requireModule('Payroll'), validateBody(runPayrollSchema), runPayroll);

// Reports — managers and above
router.get('/reports/workforce', managerAccess, getWorkforceReport);
router.get('/reports/leave', managerAccess, getLeaveReport);
router.get('/reports/payroll', managerAccess, getPayrollReport);
router.get('/reports/attendance', managerAccess, getAttendanceReport);

// Shifts — supervisors/managers can read and write
router.get('/shifts', managerAccess, getShifts);
router.post('/shifts', managerAccess, validateBody(createShiftSchema), createShift);
router.patch('/shifts/:id', managerAccess, validateBody(updateShiftSchema), updateShift);

// Documents — HR only
router.get('/documents', hrOnly, getDocuments);
router.post('/documents/upload', hrOnly, (req, res) => {
  uploadDocument(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const bytes = req.file.size;
    let fileSizeStr = `${bytes} B`;
    if (bytes >= 1024 * 1024) {
      fileSizeStr = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      fileSizeStr = `${(bytes / 1024).toFixed(1)} KB`;
    }
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    res.status(201).json({
      fileUrl,
      fileSize: fileSizeStr,
      name: req.file.originalname
    });
  });
});
router.post('/documents', hrOnly, validateBody(createDocumentSchema), createDocument);
router.delete('/documents/:id', hrOnly, deleteDocument);

export default router;
