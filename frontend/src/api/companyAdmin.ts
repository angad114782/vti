import api from './axios';

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
  subscription: { plan: string; billingCycle: string; amount: number; endDate: string } | null;
}

export const caApi = {
  getDashboard: () => api.get<{
    stats: { totalEmployees: number; activeEmployees: number; departments: number; pendingLeaves: number; pendingExpenses: number; payslipsProcessed: number; totalUsers: number };
    roleDistribution: Record<string, number>;
    deptBreakdown: { department: string; count: number }[];
  }>('/company-admin/dashboard'),

  getUsers:     (p?: Record<string, string>) => api.get<CAUser[]>('/company-admin/users', { params: p }),
  createUser:   (d: { name: string; email: string; role: string; password?: string }) => api.post<CAUser>('/company-admin/users', d),
  updateUser:   (id: string, d: { role?: string; isActive?: boolean }) => api.patch<CAUser>(`/company-admin/users/${id}`, d),
  deleteUser:   (id: string) => api.delete(`/company-admin/users/${id}`),

  getDepartments: () => api.get<CADept[]>('/company-admin/departments'),
  getCompany:     () => api.get<CACompany>('/company-admin/company'),
  updateCompany:  (d: Partial<CACompany>) => api.patch<CACompany>('/company-admin/company', d),

  getModules:   () => api.get<CAModule[]>('/company-admin/modules'),
  toggleModule: (moduleId: string, isEnabled: boolean) => api.patch(`/company-admin/modules/${moduleId}`, { isEnabled }),

  getActivity: () => api.get<CALog[]>('/company-admin/activity'),
};
