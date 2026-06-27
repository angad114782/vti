import api from './axios';

export interface SupportTicket {
  id: string;
  ticketNo: string;
  category: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  attachment?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; role: string };
  company?: { id: string; name: string };
}

export interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  stats: { total: number; open: number; inProgress: number; resolved: number };
}

export const supportApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<TicketsResponse>('/support', { params }),

  getOne: (id: string) =>
    api.get<SupportTicket>(`/support/${id}`),

  create: (data: { category: string; subject: string; description: string; priority?: string; companyId?: string }) =>
    api.post<SupportTicket>('/support', data),

  update: (id: string, data: { status?: string; priority?: string }) =>
    api.patch<SupportTicket>(`/support/${id}`, data),

  getCompanies: () =>
    api.get<{ id: string; name: string }[]>('/support/companies'),
};
