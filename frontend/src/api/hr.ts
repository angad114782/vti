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
  id: string; payslipId: string; period: string; month: number; year: number; netPay: number; status: string;
  employee: { id: string; employeeId: string; user: { name: string } };
}

export interface Document {
  id: string; name: string; category: string; uploadedBy: string; fileSize: string | null;
  version: string | null; visibility: string; createdAt: string;
}

// ── API ────────────────────────────────────────────────────────────────────────

export const hrApi = {
  // Employees
  getEmployees: (p?: Record<string, string>) => api.get<{ employees: Employee[]; stats: { total: number; active: number; inactive: number; departments: number } }>('/hr/employees', { params: p }),
  getEmployee:  (id: string)                 => api.get<Employee>(`/hr/employees/${id}`),
  createEmployee: (data: Record<string, string>) => api.post<Employee>('/hr/employees', data),
  updateEmployee: (id: string, data: Record<string, string>) => api.patch<Employee>(`/hr/employees/${id}`, data),
  getDepartments: ()                         => api.get<{ name: string; count: number }[]>('/hr/employees/departments'),

  // Attendance
  getAttendance: () => api.get<{ stats: { totalWorkforce: number; perm: number; cont: number; presentToday: number; presentPct: number; absent: number; absentPct: number; lateArrivals: number; avgDelay: number }; departments: { department: string; total: number; present: number; percentage: number }[] }>('/hr/attendance'),

  // Leaves
  getLeaves: (p?: Record<string, string>) => api.get<{ leaves: LeaveRequest[]; stats: { total: number; pending: number; approved: number; rejected: number } }>('/hr/leaves', { params: p }),
  updateLeave: (id: string, status: string) => api.patch(`/hr/leaves/${id}`, { status }),

  // Approvals
  getApprovals: (p?: Record<string, string>) => api.get<{ approvals: Approval[]; stats: { pending: number; approvedToday: number; rejected: number; escalated: number } }>('/hr/approvals', { params: p }),
  updateApproval: (id: string, status: string) => api.patch(`/hr/approvals/${id}`, { status }),

  // Payroll
  getSalary:   (p?: Record<string, string>) => api.get<SalaryRow[]>('/hr/payroll/salary', { params: p }),
  getPayslips: (p?: Record<string, string>) => api.get<Payslip[]>('/hr/payroll/payslips', { params: p }),

  // Documents
  getDocuments:   (p?: Record<string, string>) => api.get<Document[]>('/hr/documents', { params: p }),
  createDocument: (data: Record<string, string>) => api.post<Document>('/hr/documents', data),
  deleteDocument: (id: string)                  => api.delete(`/hr/documents/${id}`),
};
