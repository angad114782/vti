import { Request, Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { buildWorkflowState, resolveWorkflowUpdate } from '../utils/workflow';
import { getCompanyId, getUserId } from '../utils/authContext';
import { validateId } from '../utils/validate';
import { invalidate } from '../utils/cache';
import LeaveLedger from '../models/LeaveLedger';
import { withTransaction } from '../utils/transaction';
import { requireCompanyId } from '../utils/scope';
import LeaveBalance from '../models/LeaveBalance';
import { AppError } from '../core/AppError';
import { createNotification } from '../utils/notifications';

export const getLeaves = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, leaveType, search } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (leaveType && leaveType !== 'ALL') where.leaveType = leaveType;

  if (search) {
    const users = await User.find({ $or: [{ nameSearch: escapeRegex(search) }, { emailSearch: escapeRegex(search) }] }).select('_id').lean();
    const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
    where.employeeId = { $in: emps.map((e) => e._id) };
  }

  const [leaves, filteredTotal, pending, approved, rejected] = await Promise.all([
    LeaveRequest.find(where)
      .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments(where),
    LeaveRequest.countDocuments({ companyId, status: 'Pending' }),
    LeaveRequest.countDocuments({ companyId, status: 'Approved' }),
    LeaveRequest.countDocuments({ companyId, status: 'Rejected' }),
  ]);

  res.json({
    leaves,
    pagination: paginationMeta(filteredTotal, page, limit),
    stats: { total: filteredTotal, pending, approved, rejected, filtered: Boolean(status || leaveType || search) },
  });
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  validateId(id);
  const { status } = req.body as { status: string };
  const companyId = requireCompanyId(req);
  const existing = await LeaveRequest.findOne({ _id: id, companyId });
  if (!existing) {
    res.status(404).json({ message: 'Leave request not found' });
    return;
  }
  if (!existing.pendingRole || !existing.workflowStep) {
    const state = await buildWorkflowState(req, 'leave');
    existing.pendingRole = state.pendingRole;
    existing.workflowStep = state.workflowStep;
    existing.workflowType = state.workflowType;
    await existing.save();
  }

  if (status !== 'Cancelled' && existing.requesterUserId?.toString() === getUserId(req)) {
    res.status(403).json({ message: 'A requester cannot approve or reject their own leave request' });
    return;
  }
  if (status === 'Cancelled') {
    const employee = await Employee.findOne({ _id: existing.employeeId, companyId }).select('userId').lean();
    if (!employee || employee.userId.toString() !== getUserId(req)) {
      res.status(403).json({ message: 'Only the requesting employee can cancel this leave' });
      return;
    }
    if (existing.status !== 'Pending') {
      res.status(409).json({ message: 'Only pending leave requests can be cancelled', code: 'INVALID_TRANSITION' });
      return;
    }
  }
  const snapshot = existing.workflowSnapshot as any;
  const result = await resolveWorkflowUpdate(req, 'leave', existing.workflowStep as number, status, snapshot, existing.delegatedTo?.toString());
  if (result.error) {
    res.status(403).json({ message: result.error });
    return;
  }
  const update = result.update;
  if (!update) {
    res.status(400).json({ message: 'No workflow update generated' });
    return;
  }

  const expectedVersion = Number((req.body as Record<string, unknown>).version ?? existing.version ?? 0);
  const transitionUpdate = { ...update, version: expectedVersion + 1, ...(update.status === 'Approved' ? { approvedAt: new Date() } : {}), ...(update.status === 'Rejected' ? { rejectedAt: new Date() } : {}) };
  const leave = await withTransaction(async (session) => {
    const updated = await LeaveRequest.findOneAndUpdate(
      { _id: id, companyId, version: expectedVersion, status: 'Pending' },
      { $set: transitionUpdate },
      { returnDocument: 'after', session },
    );
    if (!updated) return null;
    if (update.status === 'Approved') {
      const configuredBalance = await LeaveBalance.findOne({ companyId, employeeId: updated.employeeId, leaveType: updated.leaveType }).session(session);
      if (configuredBalance) {
        const total = configuredBalance.openingDays + configuredBalance.accruedDays + configuredBalance.carryForwardDays + configuredBalance.adjustedDays;
        const balance = await LeaveBalance.findOneAndUpdate({ _id: configuredBalance._id, usedDays: { $lte: total - updated.days } }, { $inc: { usedDays: updated.days } }, { returnDocument: 'after', session });
        if (!balance) throw new AppError('INSUFFICIENT_LEAVE_BALANCE', 'Insufficient leave balance', 409);
      }
      await LeaveLedger.updateOne(
        { companyId, referenceId: updated._id, source: 'Usage' },
        { $setOnInsert: { companyId, employeeId: updated.employeeId, leaveType: updated.leaveType, source: 'Usage', amount: -Math.abs(updated.days), referenceId: updated._id, effectiveDate: updated.startDate, note: 'Leave approved' } },
        { upsert: true, session },
      );
    }
    return updated;
  });
  if (!leave) { res.status(409).json({ message: 'Leave request was already processed or changed', code: 'VERSION_CONFLICT' }); return; }
  const populatedLeave = await LeaveRequest.findById(leave._id)
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } });
  const empName = (populatedLeave as any)?.employeeId?.userId?.name ?? 'employee';
  const requesterUserId = (populatedLeave as any)?.employeeId?.userId?._id ?? existing.requesterUserId;
  if (requesterUserId && ['Approved', 'Rejected', 'Cancelled'].includes(update.status)) {
    await createNotification({
      userId: requesterUserId,
      companyId,
      type: 'LEAVE_STATUS',
      title: `Leave ${update.status.toLowerCase()}`,
      message: `Your ${updatedLeaveTypeLabel(populatedLeave)} request was ${update.status.toLowerCase()}.`,
      entityType: 'LeaveRequest',
      entityId: leave._id,
      dedupeKey: `leave:${leave._id.toString()}:${update.status}`,
    }).catch(() => undefined);
  }
  if (companyId) invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Leave ${update.status} — ${empName}`, 'Leaves');
  res.json(populatedLeave);
};

function updatedLeaveTypeLabel(leave: any): string {
  return String(leave?.leaveType ?? 'leave');
}

export const leaveAction = async (req: Request, res: Response) => {
  const action = (req.body as { action: string }).action;
  const status = action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Cancelled';
  req.body = { ...req.body, status };
  return updateLeaveStatus(req, res);
};
