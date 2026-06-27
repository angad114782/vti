import api from './axios';

export interface Company {
  id: string;
  name: string;
  industry?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'SUSPENDED';
  maxUsers: number;
  userCount: number;
  planExpiry?: string;
  createdAt: string;
}

export interface CompaniesResponse {
  companies: Company[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: { total: number; active: number; trial: number; expiringSoon: number };
}

export interface CreateCompanyData {
  name: string;
  industry?: string;
  email?: string;
  phone?: string;
  address?: string;
  plan?: string;
  status?: string;
  maxUsers?: number;
  planExpiry?: string;
}

export const companiesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<CompaniesResponse>('/companies', { params }),
  getOne: (id: string) => api.get<Company>(`/companies/${id}`),
  create: (data: CreateCompanyData) => api.post<Company>('/companies', data),
  update: (id: string, data: Partial<CreateCompanyData>) => api.put<Company>(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
};
