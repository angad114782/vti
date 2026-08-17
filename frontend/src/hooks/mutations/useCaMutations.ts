import { useMutation, useQueryClient } from '@tanstack/react-query';
import { caApi } from '../../api/companyAdmin';
import type { CACompany } from '../../api/companyAdmin';

export const useCreateCaUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: { name: string; email: string; role: string; password?: string }) =>
      caApi.createUser(d).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'users'] });
      qc.invalidateQueries({ queryKey: ['ca', 'dashboard'] });
    },
  });
};

export const useUpdateCaUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; isActive?: boolean } }) =>
      caApi.updateUser(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'users'] });
      qc.invalidateQueries({ queryKey: ['ca', 'dashboard'] });
    },
  });
};

export const useDeleteCaUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => caApi.deleteUser(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'users'] });
      qc.invalidateQueries({ queryKey: ['ca', 'dashboard'] });
    },
  });
};

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<CACompany>) => caApi.updateCompany(d).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'company'] });
    },
  });
};

export const useToggleModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, isEnabled }: { moduleId: string; isEnabled: boolean }) =>
      caApi.toggleModule(moduleId, isEnabled).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'modules'] });
    },
  });
};

export const useSaveWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, data }: { type: string; data: Parameters<typeof caApi.saveWorkflow>[1] }) =>
      caApi.saveWorkflow(type, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'workflows'] });
    },
  });
};

export const useUpdateRolePermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: Record<string, boolean> }) =>
      caApi.updateRolePermissions(role, permissions).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ca', 'rolePermissions'] });
    },
  });
};
