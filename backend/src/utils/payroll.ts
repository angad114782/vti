export interface PayrollInputs {
  annualCtc: number;
  absentDays: number;
  monthDays?: number;
  payableDays?: number;
  basicAnnual?: number;
  allowancesAnnual?: number;
  deductionsAnnual?: number;
  overtimeMinutes?: number;
  reimbursementAmount?: number;
  overtimeMultiplier?: number;
}

export interface PayrollResult {
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
}

/** Deterministic v1 payroll calculation. Keep business rules out of controllers. */
export function calculatePayroll({ annualCtc, absentDays, monthDays: configuredMonthDays, payableDays: configuredPayableDays, basicAnnual, allowancesAnnual, deductionsAnnual, overtimeMinutes = 0, reimbursementAmount = 0, overtimeMultiplier = 1.5 }: PayrollInputs): PayrollResult {
  const monthDays = Math.max(1, monthDaysOrDefault(configuredMonthDays));
  const payableDays = Math.max(0, Math.min(monthDays, payableDaysOrDefault(configuredPayableDays, monthDays)));
  const baseMonthly = Math.round((basicAnnual ?? annualCtc / 12) * (payableDays / monthDays));
  const basicSalary = basicAnnual === undefined ? baseMonthly : Math.round(basicAnnual / 12 * (payableDays / monthDays));
  const allowances = allowancesAnnual === undefined ? Math.round(baseMonthly * 0.15) : Math.round(allowancesAnnual / 12 * (payableDays / monthDays));
  const overtimeRate = (basicSalary / Math.max(1, monthDays) / 8) * Math.max(0, overtimeMultiplier);
  const overtimePay = Math.round(Math.max(0, overtimeMinutes) / 60 * overtimeRate);
  const grossWithAllowance = basicSalary + allowances + overtimePay + Math.max(0, reimbursementAmount);
  const configuredDeductions = Math.round((deductionsAnnual ?? 0) / 12 * (payableDays / monthDays));
  const absenceDeduction = Math.round(Math.max(0, absentDays) * (grossWithAllowance / 26));
  const totalDeductions = configuredDeductions + absenceDeduction;
  return {
    grossSalary: grossWithAllowance,
    totalDeductions,
    netPay: Math.max(0, grossWithAllowance - totalDeductions),
  };
}

function monthDaysOrDefault(value: unknown): number { return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 30; }
function payableDaysOrDefault(value: unknown, fallback: number): number { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
