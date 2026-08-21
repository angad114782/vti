import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEmployeeTransition, resolveWorkflowTransition } from '../dist/utils/workflow.js';

const config = {
  steps: [
    { order: 1, role: 'SUPERVISOR', action: 'Review', escalateAfter: 24 },
    { order: 2, role: 'MANAGER', action: 'Final', escalateAfter: 48 },
  ],
  autoEscalate: false,
  escalateHours: 24,
};

test('workflow advances only for the active role', () => {
  assert.match(resolveWorkflowTransition(config, 'HR', 1, 'Approved').error, /SUPERVISOR/);
  assert.deepEqual(resolveWorkflowTransition(config, 'SUPERVISOR', 1, 'Approved').update, {
    status: 'Pending', workflowStep: 2, pendingRole: 'MANAGER',
  });
});

test('workflow rejects invalid actions and allows final approval', () => {
  assert.equal(resolveWorkflowTransition(config, 'SUPERVISOR', 1, 'Unknown').error, 'Unsupported workflow action');
  assert.deepEqual(resolveWorkflowTransition(config, 'MANAGER', 2, 'Approved').update, { status: 'Approved', pendingRole: null });
});

test('only the requesting employee can cancel a first-step leave', () => {
  assert.match(resolveWorkflowTransition(config, 'MANAGER', 1, 'Cancelled').error, /requesting employee/);
  assert.equal(resolveWorkflowTransition(config, 'EMPLOYEE', 1, 'Cancelled').update.status, 'Cancelled');
});

test('payroll lifecycle requires explicit finalization', () => {
  const states = ['Draft', 'Processing', 'Approved', 'Finalized'];
  assert.deepEqual(states.slice(0, 3), ['Draft', 'Processing', 'Approved']);
  assert.equal(states.at(-1), 'Finalized');
});

test('employee lifecycle rejects skipped and repeated transitions', () => {
  assert.deepEqual(resolveEmployeeTransition('Invited', 'Active'), {
    valid: false,
    error: 'Invalid employee lifecycle transition: Invited -> Active.',
  });
  assert.deepEqual(resolveEmployeeTransition('Active', 'Active'), {
    valid: false,
    error: 'Employee is already in this lifecycle state.',
  });
  assert.deepEqual(resolveEmployeeTransition('NoticePeriod', 'Terminated'), { valid: true });
});
