import api from './axios';

export interface AppModule {
  id: string;
  name: string;
  description: string | null;
  availableFor: string[];
  isEnabled: boolean | null;
  createdAt: string;
}

export interface PermissionItem {
  permission: string;
  isGranted: boolean;
}

export interface PermissionsResponse {
  role: string | null;
  permissions: Record<string, PermissionItem[]>;
}

export const modulesApi = {
  getModules: (companyId?: string) =>
    api.get<{ modules: AppModule[] }>('/modules', { params: companyId ? { companyId } : {} }),

  getCompanies: () =>
    api.get<{ id: string; name: string; plan: string }[]>('/modules/companies'),

  toggleModule: (companyId: string, moduleId: string, isEnabled: boolean) =>
    api.put('/modules/toggle', { companyId, moduleId, isEnabled }),

  getPermissions: (role?: string) =>
    api.get<PermissionsResponse>('/modules/permissions', { params: role ? { role } : {} }),

  updatePermission: (role: string, permission: string, isGranted: boolean) =>
    api.put('/modules/permissions', { role, permission, isGranted }),
};
