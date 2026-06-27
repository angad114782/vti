import api from './axios';

export interface Subscription {
  id: string;
  companyId: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  billingCycle: string;
  amount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  company: { id: string; name: string; industry?: string; plan: string };
}

export interface PlanData {
  id: string;
  name: string;
  type: 'BASIC' | 'PRO' | 'ENTERPRISE';
  price: number;
  maxUsers: number;
  features: string[];
}

export interface SubscriptionsResponse {
  subscriptions: Subscription[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: { monthlyRevenue: number; active: number; trial: number; expiringSoon: number };
}

export const subscriptionsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<SubscriptionsResponse>('/subscriptions', { params }),
  getPlans: () => api.get<PlanData[]>('/subscriptions/plans'),
  assign: (data: { companyId: string; plan: string; billingCycle: string; months: number }) =>
    api.post('/subscriptions/assign', data),
  update: (id: string, data: { billingCycle?: string; isActive?: boolean; endDate?: string }) =>
    api.put(`/subscriptions/${id}`, data),
};
