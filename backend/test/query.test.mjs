import test from 'node:test';
import assert from 'node:assert/strict';
import { clampLimit, parsePagination } from '../dist/utils/query.js';
import { getMetrics, recordRequest } from '../dist/utils/metrics.js';
import { businessDateFor } from '../dist/utils/attendance.js';
import { calculateAttendanceMetrics } from '../dist/utils/attendanceRules.js';

test('clampLimit rejects invalid and unbounded page sizes', () => {
  assert.equal(clampLimit(undefined), 20);
  assert.equal(clampLimit('0'), 20);
  assert.equal(clampLimit('1000'), 100);
  assert.equal(clampLimit('25', 20, 50), 25);
});

test('parsePagination produces deterministic bounded offsets', () => {
  assert.deepEqual(parsePagination({ page: '3', limit: '25' }), { page: 3, limit: 25, skip: 50 });
  assert.deepEqual(parsePagination({ page: '-1', limit: '999' }), { page: 1, limit: 100, skip: 0 });
});

test('metrics record mutation, workflow, and payroll failures', () => {
  const before = getMetrics();
  recordRequest('POST', '/api/hr/leaves/123/actions', 409, 12.5);
  recordRequest('POST', '/api/hr/payroll/runs', 201, 25);
  const after = getMetrics();

  assert.equal(after.requests.count, before.requests.count + 2);
  assert.equal(after.mutations.count, before.mutations.count + 2);
  assert.equal(after.workflows.count, before.workflows.count + 1);
  assert.equal(after.workflows.failures, before.workflows.failures + 1);
  assert.equal(after.payroll.count, before.payroll.count + 1);
});

test('business dates are calculated in the configured timezone', () => {
  const instant = new Date('2026-01-01T23:30:00.000Z');
  assert.equal(businessDateFor(instant, 'Asia/Kolkata'), '2026-01-02');
  assert.equal(businessDateFor(instant, 'America/New_York'), '2026-01-01');
});

test('attendance rules calculate late arrival and overtime', () => {
  assert.deepEqual(calculateAttendanceMetrics('09:30', '19:00', '09:00-18:00'), {
    workedMinutes: 570,
    lateMinutes: 30,
    overtimeMinutes: 60,
  });
  assert.deepEqual(calculateAttendanceMetrics('22:00', '06:00', '22:00-06:00'), {
    workedMinutes: 480,
    lateMinutes: 0,
    overtimeMinutes: 0,
  });
});
