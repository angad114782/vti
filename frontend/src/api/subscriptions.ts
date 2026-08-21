import api from './axios';

export interface Subscription {
  id: string;
  companyId: string;
  plan: string;
  billingCycle: string;
  amount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  company: { id: string; name: string; companyCode?: string; industry?: string; plan: string };
}

export interface PlanData {
  id: string;
  name: string;
  type: string;
  price: number;
  maxUsers: number;
  features: string[];
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: { monthlyRevenue: number; active: number; trial: number; expiringSoon: number };
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export const subscriptionsApi = {
  getRevenueTrend: () => api.get<RevenueTrendPoint[]>('/subscriptions/revenue-trend'),
  getAll: (params?: Record<string, string>) =>
    api.get<SubscriptionsResponse>('/subscriptions', { params }),
  getPlans: () => api.get<PlanData[]>('/subscriptions/plans'),
  createPlan: (data: { name: string; type: string; price: number; maxUsers: number; features: string[] }) =>
    api.post<PlanData>('/subscriptions/plans', data),
  updatePlan: (id: string, data: { name?: string; price?: number; maxUsers?: number; features?: string[]; isActive?: boolean }) =>
    api.put<PlanData>(`/subscriptions/plans/${id}`, data),
  assign: (data: { companyId: string; plan: string; billingCycle: string; months: number }) =>
    api.post('/subscriptions/assign', data),
  update: (id: string, data: { billingCycle?: string; isActive?: boolean; endDate?: string }) =>
    api.put(`/subscriptions/${id}`, data),
  deletePlan: (id: string) => api.delete(`/subscriptions/plans/${id}`),
};
