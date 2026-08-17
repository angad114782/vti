import api from './axios';
import type { Pagination } from './hr';

export interface CAUser {
  id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string;
  employee: { employeeId: string; department: string | null; designation: string | null } | null;
}

export interface CADept { name: string; total: number; active: number; }

export interface CAModule {
  id: string; isEnabled: boolean;
  module: { id: string; name: string; description: string | null };
}

export interface CALog {
  id: string; action: string; module: string | null; status: string; createdAt: string;
  user: { name: string; role: string } | null;
}

export interface CACompany {
  id: string; name: string; industry: string | null; email: string | null;
  phone: string | null; address: string | null; status: string; plan: string;
  maxUsers: number; planExpiry: string | null;
  subscription: { plan: string; billingCycle: string; amount: number; endDate: string; startDate?: string } | null;
}

export interface WorkflowStep {
  order: number; role: string; action: string; escalateAfter: number;
}
export interface WorkflowData {
  type: 'leave' | 'expense' | 'correction';
  steps: WorkflowStep[];
  autoEscalate: boolean;
  escalateHours: number;
}

export const caApi = {
  getDashboard: () => {
    const cid = new URLSearchParams(window.location.search).get('companyId') ?? undefined;
    const params = cid ? { companyId: cid } : undefined;
    return api.get<{
    stats: { totalEmployees: number; activeEmployees: number; departments: number; pendingLeaves: number; pendingExpenses: number; payslipsProcessed: number; totalUsers: number };
    roleDistribution: Record<string, number>;
    deptBreakdown: { department: string; count: number }[];
    }>(
      '/company-admin/dashboard',
      cid ? { params } : undefined,
    );
  },

  getUsers:     (p?: Record<string, string>) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<{ users: CAUser[]; pagination: Pagination }>('/company-admin/users', { params: { ...p, ...(cid ? { companyId: cid } : {}) } });
  },
  createUser:   (d: { name: string; email: string; role: string; password?: string }) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.post<CAUser & { generatedPassword?: string }>('/company-admin/users', d, { params: cid ? { companyId: cid } : undefined });
  },
  updateUser:   (id: string, d: { role?: string; isActive?: boolean }) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.patch<CAUser>(`/company-admin/users/${id}`, d, { params: cid ? { companyId: cid } : undefined });
  },
  deleteUser:   (id: string) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.delete(`/company-admin/users/${id}`, { params: cid ? { companyId: cid } : undefined });
  },

  getDepartments: () => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<CADept[]>('/company-admin/departments', { params: cid ? { companyId: cid } : undefined });
  },
  getCompany:     () => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<CACompany>('/company-admin/company', { params: cid ? { companyId: cid } : undefined });
  },
  updateCompany:  (d: Partial<CACompany>) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.patch<CACompany>('/company-admin/company', d, { params: cid ? { companyId: cid } : undefined });
  },

  getModules:   () => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<CAModule[]>('/company-admin/modules', { params: cid ? { companyId: cid } : undefined });
  },
  toggleModule: (moduleId: string, isEnabled: boolean) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.patch(`/company-admin/modules/${moduleId}`, { isEnabled }, { params: cid ? { companyId: cid } : undefined });
  },

  getActivity: (p?: Record<string, string>) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<{ logs: CALog[]; pagination: Pagination }>('/company-admin/activity', { params: { ...p, ...(cid ? { companyId: cid } : {}) } });
  },

  getRolePermissions:    ()                                                    => api.get<{ role: string; module: string; isGranted: boolean }[]>('/company-admin/role-permissions'),
  updateRolePermissions: (role: string, permissions: Record<string, boolean>) => api.put('/company-admin/role-permissions', { role, permissions }),

  // Workflows
  getWorkflows: () => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<WorkflowData[]>('/company-admin/workflows', { params: cid ? { companyId: cid } : undefined });
  },
  saveWorkflow: (type: string, data: Omit<WorkflowData, 'type'>) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.put<WorkflowData>(`/company-admin/workflows/${type}`, data, { params: cid ? { companyId: cid } : undefined });
  },

  // Reports
  getWorkforceReport: () => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<{
    summary: { total: number; active: number; inactive: number };
    byDepartment: { department: string; count: number; active: number }[];
    byEmploymentType: { type: string; count: number }[];
    recentJoinees: { employeeId: string; name: string; department: string; designation: string; joiningDate: string; status: string }[];
    }>(
      '/company-admin/reports/workforce',
      cid ? { params: { companyId: cid } } : undefined,
    );
  },

  getLeaveReport: (p?: { from?: string; to?: string }) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<{
    total: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    }>('/company-admin/reports/leave', { params: { ...p, ...(cid ? { companyId: cid } : {}) } });
  },

  getPayrollReport: (p?: { from?: string; to?: string }) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<{
    summary: { totalNet: number; totalGross: number; totalDeductions: number; count: number };
    byMonth: { label: string; net: number; count: number }[];
    recent: { id: string; employeeName: string; month: number; year: number; netSalary: number; status: string }[];
    }>('/company-admin/reports/payroll', { params: { ...p, ...(cid ? { companyId: cid } : {}) } });
  },

  getAttendanceReport: (p?: { year?: string; month?: string }) => {
    const cid = new URLSearchParams(window.location.search).get('companyId');
    return api.get<{
    period: { year: number; month: number };
    totalRecords: number;
    totalEmployees: number;
    byStatus: { Present: number; Late: number; Absent: number; Leave: number; Holiday: number };
    }>('/company-admin/reports/attendance', { params: { ...p, ...(cid ? { companyId: cid } : {}) } });
  },
};
