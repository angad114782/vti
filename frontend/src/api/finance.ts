import api from './axios';
import type { Employee, SalaryRow, Payslip } from './hr';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
  employee: { id: string; employeeId: string; user: { name: string } };
}

export const financeApi = {
  getEmployees: (p?: Record<string, string>) =>
    api.get<{ employees: Employee[]; stats: Record<string, number> }>('/finance/employees', { params: p }),
  getSalary: (p?: Record<string, string>) =>
    api.get<SalaryRow[]>('/finance/salary', { params: p }),
  getPayslips: (p?: Record<string, string>) =>
    api.get<Payslip[]>('/finance/payslips', { params: p }),
  getExpenses: (p?: Record<string, string>) =>
    api.get<{ expenses: Expense[]; total: number; stats: { pending: number; approved: number; rejected: number } }>('/finance/expenses', { params: p }),
  updateExpense: (id: string, status: string) =>
    api.patch(`/finance/expenses/${id}`, { status }),
};
