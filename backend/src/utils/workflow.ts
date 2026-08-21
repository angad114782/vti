import type { Request } from 'express';
import Workflow from '../models/Workflow';

export type WorkflowType = 'leave' | 'expense' | 'correction';

export type WorkflowStep = {
  order: number;
  role: string;
  action: string;
  escalateAfter: number;
};

export type WorkflowConfig = {
  steps: WorkflowStep[];
  autoEscalate: boolean;
  escalateHours: number;
  version: number;
};

const EMPLOYEE_TRANSITIONS: Record<string, string[]> = {
  Invited: ['Onboarding'],
  Onboarding: ['Active'],
  Active: ['NoticePeriod'],
  NoticePeriod: ['Terminated'],
  Terminated: ['Archived'],
};

export function resolveEmployeeTransition(currentStatus: string, requestedStatus: string): { valid: boolean; error?: string } {
  if (currentStatus === requestedStatus) return { valid: false, error: 'Employee is already in this lifecycle state.' };
  if (!EMPLOYEE_TRANSITIONS[currentStatus]?.includes(requestedStatus)) {
    return { valid: false, error: `Invalid employee lifecycle transition: ${currentStatus} -> ${requestedStatus}.` };
  }
  return { valid: true };
}

const DEFAULTS: Record<WorkflowType, WorkflowConfig> = {
  leave: {
    steps: [
      { order: 1, role: 'SUPERVISOR', action: 'Review & Approve', escalateAfter: 24 },
      { order: 2, role: 'MANAGER', action: 'Final Approval', escalateAfter: 48 },
      { order: 3, role: 'HR', action: 'Acknowledge', escalateAfter: 0 },
    ],
    autoEscalate: true,
    escalateHours: 24,
    version: 1,
  },
  expense: {
    steps: [
      { order: 1, role: 'MANAGER', action: 'Review & Approve', escalateAfter: 48 },
      { order: 2, role: 'COMPANY_ADMIN', action: 'Final Approval', escalateAfter: 72 },
    ],
    autoEscalate: false,
    escalateHours: 48,
    version: 1,
  },
  correction: {
    steps: [
      { order: 1, role: 'SUPERVISOR', action: 'Review & Approve', escalateAfter: 12 },
      { order: 2, role: 'HR', action: 'Acknowledge', escalateAfter: 0 },
    ],
    autoEscalate: true,
    escalateHours: 12,
    version: 1,
  },
};

const getReqUser = (req: Request) =>
  (req as unknown as { user?: { userId?: string; companyId?: string; role?: string } }).user;

export async function getWorkflowConfig(req: Request, type: WorkflowType): Promise<WorkflowConfig> {
  const companyId = getReqUser(req)?.companyId;
  if (!companyId) return DEFAULTS[type];

  const saved = await Workflow.findOne({ companyId, type }).lean();
  if (!saved) return DEFAULTS[type];

  return {
    steps: (saved.steps ?? []).length ? (saved.steps as WorkflowStep[]) : DEFAULTS[type].steps,
    autoEscalate: saved.autoEscalate ?? DEFAULTS[type].autoEscalate,
    escalateHours: saved.escalateHours ?? DEFAULTS[type].escalateHours,
    version: saved.version ?? 1,
  };
}

export async function buildWorkflowState(req: Request, type: WorkflowType) {
  const config = await getWorkflowConfig(req, type);
  const firstStep = config.steps[0];
  const dueHours = firstStep?.escalateAfter || (config.autoEscalate ? config.escalateHours : 0);
  return {
    workflowType: type,
    workflowStep: firstStep?.order ?? 0,
    pendingRole: firstStep?.role ?? null,
    workflowVersion: config.version,
    workflowSnapshot: { version: config.version, steps: config.steps, autoEscalate: config.autoEscalate, escalateHours: config.escalateHours },
    approvalDueAt: dueHours ? new Date(Date.now() + dueHours * 60 * 60 * 1000) : null,
  };
}

export async function resolveWorkflowUpdate(
  req: Request,
  type: WorkflowType,
  currentStep: number | undefined,
  requestedStatus: string,
  snapshot?: WorkflowConfig,
  delegatedUserId?: string,
) {
  const config = snapshot ?? await getWorkflowConfig(req, type);
  const userRole = getReqUser(req)?.role;
  const userId = getReqUser(req)?.userId;
  return resolveWorkflowTransition(config, userRole, currentStep, requestedStatus, delegatedUserId === userId);
}

export function resolveWorkflowTransition(
  config: WorkflowConfig,
  userRole: string | undefined,
  currentStep: number | undefined,
  requestedStatus: string,
  isDelegatedApprover = false,
) {
  const sorted = [...config.steps].sort((a, b) => a.order - b.order);
  const activeStep = sorted.find((step) => step.order === (currentStep || sorted[0]?.order || 1)) ?? sorted[0];

  if (requestedStatus === 'Cancelled') {
    if (currentStep !== 1 || userRole !== 'EMPLOYEE') {
      return { error: 'Only the requesting employee can cancel a pending leave.' };
    }
    return { update: { status: 'Cancelled', pendingRole: null, cancelledAt: new Date() } };
  }

  if (requestedStatus === 'Rejected') {
    if (activeStep?.role && userRole && activeStep.role !== userRole && userRole !== 'SUPER_ADMIN' && !isDelegatedApprover) {
      return { error: `Only ${activeStep.role} can reject at this step.` };
    }
    return { update: { status: 'Rejected', pendingRole: null } };
  }

  if (requestedStatus !== 'Approved') {
    return { error: 'Unsupported workflow action' };
  }

  if (activeStep?.role && userRole && activeStep.role !== userRole && userRole !== 'SUPER_ADMIN' && !isDelegatedApprover) {
    return { error: `Only ${activeStep.role} can approve at this step.` };
  }

  const currentIndex = sorted.findIndex((step) => step.order === activeStep?.order);
  const nextStep = currentIndex >= 0 ? sorted[currentIndex + 1] : undefined;

  if (!nextStep) {
    return { update: { status: 'Approved', pendingRole: null } };
  }

  return {
    update: {
      status: 'Pending',
      workflowStep: nextStep.order,
      pendingRole: nextStep.role,
    },
  };
}
