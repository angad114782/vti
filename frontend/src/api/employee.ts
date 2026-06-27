import api from './axios';

export interface AttendanceRecord {
  date: string; day: string; status: string;
  checkIn: string; checkOut: string; hours: string; ot: string;
}

export interface LeaveBalance {
  type: string; total: number; used: number; remaining: number;
}

export interface MyLeave {
  id: string; leaveType: string; startDate: string; endDate: string;
  days: number; reason: string | null; status: string; createdAt: string;
}

export interface MyPayslip {
  id: string; payslipId: string; period: string; month: number; year: number;
  netPay: number; status: string; createdAt: string;
}

export interface MyExpense {
  id: string; category: string; amount: number;
  description: string | null; status: string; createdAt: string;
}

export interface MyDocument {
  id: string; name: string; category: string; fileSize: string | null;
  version: string | null; visibility: string; uploadedBy: string; createdAt: string;
}

export const employeeApi = {
  getProfile:    () => api.get('/employee/profile'),
  getAttendance: (p?: Record<string, string>) => api.get<{ records: AttendanceRecord[]; stats: { present: number; late: number; absent: number; totalHours: number; workingDays: number } }>('/employee/attendance', { params: p }),
  getLeaves:     () => api.get<{ leaves: MyLeave[]; stats: Record<string, number>; balance: LeaveBalance[] }>('/employee/leaves'),
  applyLeave:    (data: { leaveType: string; startDate: string; endDate: string; reason: string }) => api.post('/employee/leaves', data),
  getPayslips:   () => api.get<MyPayslip[]>('/employee/payslips'),
  getExpenses:   () => api.get<{ expenses: MyExpense[]; stats: { pending: number; approved: number; total: number } }>('/employee/expenses'),
  submitExpense: (data: { category: string; amount: number; description: string }) => api.post('/employee/expenses', data),
  getDocuments:  () => api.get<MyDocument[]>('/employee/documents'),
};
