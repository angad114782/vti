import api from './axios';

export interface AccessSnapshot {
  role: string;
  permissions: string[];
  modules: Array<{ name: string; isEnabled: boolean }>;
  subscription: {
    state: 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED' | 'UNKNOWN';
    plan: string | null;
    planExpiry: string | null;
    gracePeriodEnd: string | null;
    daysRemaining: number | null;
    readOnly: boolean;
  } | null;
}

export const accessApi = {
  get: () => api.get<AccessSnapshot>('/auth/access'),
};
