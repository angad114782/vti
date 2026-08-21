import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePayroll } from '../dist/utils/payroll.js';

test('payroll calculation is deterministic', () => {
  const result = calculatePayroll({ annualCtc: 1200000, absentDays: 2 });
  assert.deepEqual(result, { grossSalary: 115000, totalDeductions: 8846, netPay: 106154 });
  assert.deepEqual(calculatePayroll({ annualCtc: 1200000, absentDays: 2 }), result);
});

test('negative absence values cannot increase payroll', () => {
  assert.deepEqual(calculatePayroll({ annualCtc: 600000, absentDays: -10 }), {
    grossSalary: 57500, totalDeductions: 0, netPay: 57500,
  });
});
