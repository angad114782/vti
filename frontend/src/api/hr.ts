import api from './axios';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string; employeeId: string; department: string | null; designation: string | null;
  shiftType: string | null; shiftTiming: string | null; joiningDate: string | null;
  annualCtc: number | null; employmentType: string; status: string;
  bankName: string | null; branchName: string | null; accountHolder: string | null;
  user: { id: string; name: string; email: string; role: string };
}

export interface LeaveRequest {
  id: string; leaveType: string; startDate: string; endDate: string; days: number;
  reason: string | null; status: string; createdAt: string;
  employee: { id: string; employeeId: string; department: string | null; user: { name: string; email: string } };
}

export interface Approval {
  id: string; type: string; details: string; date: string; priority: string; status: string; createdAt: string;
  employee: { id: string; employeeId: string; user: { name: string } };
}

export interface SalaryRow {
  id: string; employeeId: string; name: string; department: string | null;
  designation: string | null; employmentType: string; annualCtc: number | null; lastRevised: string | null;
}

export interface Payslip {
  id: string; payslipId: string; period: string; month: number; year: number;
  grossSalary: number; totalDeductions: number; netPay: number; status: string;
  employee: { id: string; employeeId: string; user: { name: string } };
}

export interface Document {
  id: string; name: string; category: string; uploadedBy: string; fileSize: string | null;
  version: string | null; visibility: string; createdAt: string; fileUrl?: string | null;
}

export interface AttendanceRecord {
  id: string; date: string; checkIn: string | null; checkOut: string | null; status: string; source: string;
  employeeId: {
    id: string; employeeId: string; department: string | null; designation: string | null;
    userId: { name: string };
  };
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  name: string;
  workerCode: string;
  dept: string;
  role: string;
  shift: string;
  shiftName: 'Morning' | 'Evening' | 'Night';
  status: string;
}

export interface ShiftPlan {
  department: string;
  shift: 'Morning' | 'Evening' | 'Night';
  required: number;
  assigned: number;
  shortage: number;
}

export interface ShiftShortage {
  station: string;
  shift: string;
  required: number;
  actual: number;
  severity: string;
}

export interface Pagination {
  total: number; page: number; limit: number; totalPages: number;
}

// ── API ────────────────────────────────────────────────────────────────────────

export const hrApi = {
  // Employees
  getEmployees: (p?: Record<string, string>) => api.get<{ employees: Employee[]; pagination: Pagination; stats: { total: number; active: number; inactive: number; departments: number } }>('/hr/employees', { params: p }),
  getEmployee:  (id: string)                 => api.get<Employee>(`/hr/employees/${id}`),
  createEmployee: (data: Record<string, string>) => api.post<Employee & { generatedPassword: string }>('/hr/employees', data),
  updateEmployee: (id: string, data: Record<string, string>) => api.patch<Employee>(`/hr/employees/${id}`, data),
  getDepartments: ()                         => api.get<{ name: string; count: number }[]>('/hr/employees/departments'),

  // Attendance
  getAttendance: () => api.get<{ stats: { totalWorkforce: number; perm: number; cont: number; presentToday: number; presentPct: number; absent: number; absentPct: number; lateArrivals: number; avgDelay: number }; departments: { department: string; total: number; present: number; percentage: number }[] }>('/hr/attendance'),
  getAttendanceRecords: (p?: Record<string, string>) => api.get<{ records: AttendanceRecord[]; pagination: Pagination }>('/hr/attendance/records', { params: p }),
  createAttendanceRecord: (data: { employeeId: string; date: string; checkIn?: string; checkOut?: string; status: string; notes?: string }) => api.post<AttendanceRecord>('/hr/attendance', data),
  getShifts: (p?: Record<string, string>) => api.get<{
    stats: { totalWorkers: number; morningShift: number; eveningShift: number; nightShift: number };
    shifts: { Morning: ShiftAssignment[]; Evening: ShiftAssignment[]; Night: ShiftAssignment[] };
    plans: ShiftPlan[];
    shortages: ShiftShortage[];
  }>('/hr/shifts', { params: p }),
  createShift: (data: { employeeId: string; date: string; shiftName: 'Morning' | 'Evening' | 'Night'; startTime?: string; endTime?: string; notes?: string }) =>
    api.post('/hr/shifts', data),
  updateShift: (id: string, data: { shiftName?: 'Morning' | 'Evening' | 'Night'; startTime?: string; endTime?: string; status?: 'Assigned' | 'Completed' | 'Cancelled'; notes?: string }) =>
    api.patch(`/hr/shifts/${id}`, data),

  // Leaves
  getLeaves: (p?: Record<string, string>) => api.get<{ leaves: LeaveRequest[]; pagination: Pagination; stats: { total: number; pending: number; approved: number; rejected: number } }>('/hr/leaves', { params: p }),
  updateLeave: (id: string, status: string) => api.patch(`/hr/leaves/${id}`, { status }),

  // Approvals
  getApprovals: (p?: Record<string, string>) => api.get<{ approvals: Approval[]; pagination: Pagination; stats: { pending: number; approvedToday: number; rejected: number; escalated: number } }>('/hr/approvals', { params: p }),
  updateApproval: (id: string, status: string) => api.patch(`/hr/approvals/${id}`, { status }),

  // Payroll
  getSalary:   (p?: Record<string, string>) => api.get<{ results: SalaryRow[]; pagination: Pagination }>('/hr/payroll/salary', { params: p }),
  getPayslips: (p?: Record<string, string>) => api.get<{ payslips: Payslip[]; pagination: Pagination }>('/hr/payroll/payslips', { params: p }),
  runPayroll: (data: { month: number; year: number; employeeIds?: string[] }) =>
    api.post<{ message: string; period: string; month: number; year: number; created: number; skipped: number }>('/hr/payroll/run', data),

  // Reports
  getWorkforceReport: () => api.get('/hr/reports/workforce'),
  getLeaveReport: (p?: { from?: string; to?: string }) => api.get('/hr/reports/leave', { params: p }),
  getPayrollReport: (p?: { from?: string; to?: string }) => api.get('/hr/reports/payroll', { params: p }),
  getAttendanceReport: (p?: { year?: string; month?: string }) => api.get('/hr/reports/attendance', { params: p }),

  // Documents
  getDocuments:   (p?: Record<string, string>) => api.get<{ documents: Document[]; pagination: Pagination }>('/hr/documents', { params: p }),
  uploadDocumentFile: (file: File) => {
    const fd = new FormData();
    fd.append('document', file);
    return api.post<{ fileUrl: string; fileSize: string; name: string }>('/hr/documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  createDocument: (data: Record<string, string>) => api.post<Document>('/hr/documents', data),
  deleteDocument: (id: string)                  => api.delete(`/hr/documents/${id}`),
};
