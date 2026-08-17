import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../../api/employee';

export const useUpdateMyProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) =>
      employeeApi.updateProfile(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emp', 'profile'] });
    },
  });
};

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => employeeApi.checkIn().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emp', 'attendance'] });
    },
  });
};

export const useCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => employeeApi.checkOut().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emp', 'attendance'] });
    },
  });
};

export const useApplyLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) =>
      employeeApi.applyLeave(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emp', 'leaves'] });
      qc.invalidateQueries({ queryKey: ['hr', 'leaves'] });
      qc.invalidateQueries({ queryKey: ['ca', 'dashboard'] });
    },
  });
};

export const useSubmitExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { category: string; amount: number; description: string; receiptUrl?: string }) =>
      employeeApi.submitExpense(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emp', 'expenses'] });
      qc.invalidateQueries({ queryKey: ['ca', 'dashboard'] });
    },
  });
};
