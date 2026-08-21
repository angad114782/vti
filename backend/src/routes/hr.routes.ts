import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEmployees, getEmployee, getEmployeeHistory, createEmployee, updateEmployee, employeeAction, getDepartments } from '../controllers/employees.controller';
import { getLeaves, updateLeaveStatus, leaveAction } from '../controllers/leaves.controller';
import { getApprovals, updateApproval } from '../controllers/approvals.controller';
import { getSalaryStructures, getPayslips, runPayroll, finalizePayroll, markPayslipPaid, downloadPayslip } from '../controllers/payroll.controller';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documents.controller';
import { getAttendanceOverview, getAttendanceRecords, createAttendanceRecord } from '../controllers/attendance.controller';
import { getAttendanceCorrections, reviewAttendanceCorrection } from '../controllers/attendanceCorrections.controller';
import { getShifts, createShift, updateShift } from '../controllers/shifts.controller';
import { listOffices, createOffice, listDepartments, createDepartment, listHolidays, createHoliday, deleteHoliday, getAttendancePolicy, updateAttendancePolicy } from '../controllers/office.controller';
import { getWorkforceReport, getLeaveReport, getPayrollReport, getAttendanceReport } from '../controllers/workflows.controller';
import { validateBody, createEmployeeSchema, updateEmployeeSchema, updateLeaveStatusSchema, updateApprovalSchema, createDocumentSchema, createAttendanceSchema, runPayrollSchema, createShiftSchema, updateShiftSchema, workflowActionSchema, employeeActionSchema, reviewAttendanceCorrectionSchema } from '../utils/validate';
import { uploadDocument, persistUpload } from '../middleware/upload';
import { requireModule } from '../middleware/requireModule';
import { requirePermission } from '../middleware/requirePermission';
import { requireSubscriptionAccess } from '../utils/subscriptionAccess';

const router = Router();
router.use(authenticate, requireSubscriptionAccess);

const hrOnly = requireRole('HR', 'SUPER_ADMIN', 'COMPANY_ADMIN');
const managerAccess = requireRole('HR', 'SUPER_ADMIN', 'MANAGER', 'SUPERVISOR', 'COMPANY_ADMIN', 'FINANCE');

// Employees — managers/supervisors can read, HR can write
router.get('/employees', managerAccess, requirePermission('Workforce — View'), requireModule('Employee Management'), getEmployees);
router.get('/employees/departments', managerAccess, requirePermission('Workforce — View'), requireModule('Employee Management'), getDepartments);
router.get('/employees/:id', managerAccess, requirePermission('Workforce — View'), requireModule('Employee Management'), getEmployee);
router.get('/employees/:id/history', managerAccess, getEmployeeHistory);
router.post('/employees', hrOnly, requirePermission('Workforce — Add/Edit'), requireModule('Employee Management'), validateBody(createEmployeeSchema), createEmployee);
router.patch('/employees/:id', hrOnly, requirePermission('Workforce — Add/Edit'), requireModule('Employee Management'), validateBody(updateEmployeeSchema), updateEmployee);
router.post('/employees/:id/actions', hrOnly, requirePermission('Workforce — Add/Edit'), requireModule('Employee Management'), validateBody(employeeActionSchema), employeeAction);

// Attendance
router.get('/attendance',         managerAccess, requirePermission('Attendance — View'), requireModule('Attendance'), getAttendanceOverview);
router.get('/attendance/records', managerAccess, requirePermission('Attendance — View'), requireModule('Attendance'), getAttendanceRecords);
router.post('/attendance',        hrOnly,        requirePermission('Attendance — Edit'), requireModule('Attendance'), validateBody(createAttendanceSchema), createAttendanceRecord);
router.get('/attendance/corrections', managerAccess, requirePermission('Attendance — View'), requireModule('Attendance'), getAttendanceCorrections);
router.patch('/attendance/corrections/:id', hrOnly, requirePermission('Attendance — Edit'), requireModule('Attendance'), validateBody(reviewAttendanceCorrectionSchema), reviewAttendanceCorrection);

// Office masters and attendance policy
router.get('/offices', managerAccess, listOffices);
router.post('/offices', hrOnly, createOffice);
router.get('/departments/master', managerAccess, listDepartments);
router.post('/departments/master', hrOnly, createDepartment);
router.get('/holidays', managerAccess, listHolidays);
router.post('/holidays', hrOnly, createHoliday);
router.delete('/holidays/:id', hrOnly, deleteHoliday);
router.get('/attendance-policy', managerAccess, getAttendancePolicy);
router.put('/attendance-policy', hrOnly, updateAttendancePolicy);

// Leaves
router.get('/leaves', managerAccess, requirePermission('Approvals — View'), requireModule('Leave Management'), getLeaves);
router.patch('/leaves/:id', managerAccess, requirePermission('Approvals — Action'), requireModule('Leave Management'), validateBody(updateLeaveStatusSchema), updateLeaveStatus);
router.post('/leaves/:id/actions', managerAccess, requirePermission('Approvals — Action'), requireModule('Leave Management'), validateBody(workflowActionSchema), leaveAction);

// Approvals
router.get('/approvals', managerAccess, requirePermission('Approvals — View'), requireModule('Leave Management'), getApprovals);
router.patch('/approvals/:id', managerAccess, requirePermission('Approvals — Action'), requireModule('Leave Management'), validateBody(updateApprovalSchema), updateApproval);

// Payroll — HR only; requires Payroll module enabled for the company
router.get('/payroll/salary', hrOnly, requirePermission('Payroll — View'), requireModule('Payroll'), getSalaryStructures);
router.get('/payroll/payslips', hrOnly, requirePermission('Payroll — View'), requireModule('Payroll'), getPayslips);
router.get('/payroll/payslips/:id/download', hrOnly, requirePermission('Payroll — View'), requireModule('Payroll'), downloadPayslip);
router.post('/payroll/run', hrOnly, requirePermission('Payroll — Process'), requireModule('Payroll'), validateBody(runPayrollSchema), runPayroll);
router.post('/payroll/runs', hrOnly, requirePermission('Payroll — Process'), requireModule('Payroll'), validateBody(runPayrollSchema), runPayroll);
router.post('/payroll/runs/:id/finalize', hrOnly, requirePermission('Payroll — Process'), requireModule('Payroll'), finalizePayroll);
router.post('/payroll/payslips/:id/pay', hrOnly, requirePermission('Payroll — Process'), requireModule('Payroll'), markPayslipPaid);

// Reports — managers and above
router.get('/reports/workforce', managerAccess, requirePermission('Reports — View'), requireModule('Reports & Analytics'), getWorkforceReport);
router.get('/reports/leave', managerAccess, requirePermission('Reports — View'), requireModule('Reports & Analytics'), getLeaveReport);
router.get('/reports/payroll', managerAccess, requirePermission('Reports — View'), requireModule('Reports & Analytics'), getPayrollReport);
router.get('/reports/attendance', managerAccess, requirePermission('Reports — View'), requireModule('Reports & Analytics'), getAttendanceReport);

// Shifts — supervisors/managers can read and write
router.get('/shifts', managerAccess, requireModule('Shift Management'), getShifts);
router.post('/shifts', managerAccess, requireModule('Shift Management'), validateBody(createShiftSchema), createShift);
router.patch('/shifts/:id', managerAccess, requireModule('Shift Management'), validateBody(updateShiftSchema), updateShift);

// Documents — HR only
router.get('/documents', hrOnly, requireModule('Document Management'), getDocuments);
router.post('/documents/upload', hrOnly, requireModule('Document Management'), (req, res) => {
  uploadDocument(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    void (async () => {
    const bytes = req.file!.size;
    let fileSizeStr = `${bytes} B`;
    if (bytes >= 1024 * 1024) {
      fileSizeStr = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      fileSizeStr = `${(bytes / 1024).toFixed(1)} KB`;
    }
    const filename = await persistUpload(req.file!, 'documents');
    const fileUrl = `/api/files/documents/${filename}`;
    res.status(201).json({
      fileUrl,
      fileSize: fileSizeStr,
      name: req.file!.originalname
    });
    })().catch((error) => res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to store file' }));
  });
});
router.post('/documents', hrOnly, requireModule('Document Management'), validateBody(createDocumentSchema), createDocument);
router.delete('/documents/:id', hrOnly, requireModule('Document Management'), deleteDocument);

export default router;
