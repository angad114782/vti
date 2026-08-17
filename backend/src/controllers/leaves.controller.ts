import { Request, Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { buildWorkflowState, resolveWorkflowUpdate } from '../utils/workflow';
import { getCompanyId } from '../utils/authContext';
import { validateId } from '../utils/validate';
import { invalidate } from '../utils/cache';

export const getLeaves = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, leaveType, search } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (leaveType && leaveType !== 'ALL') where.leaveType = leaveType;

  if (search) {
    const users = await User.find({ name: escapeRegex(search) }).select('_id').lean();
    const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
    where.employeeId = { $in: emps.map((e) => e._id) };
  }

  const [leaves, filteredTotal, pending, approved, rejected] = await Promise.all([
    LeaveRequest.find(where)
      .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 })
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
    stats: { total: filteredTotal, pending, approved, rejected },
  });
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  validateId(id);
  const { status } = req.body as { status: string };
  const existing = await LeaveRequest.findById(id);
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

  const result = await resolveWorkflowUpdate(req, 'leave', existing.workflowStep as number, status);
  if (result.error) {
    res.status(403).json({ message: result.error });
    return;
  }
  const update = result.update;
  if (!update) {
    res.status(400).json({ message: 'No workflow update generated' });
    return;
  }

  const leave = await LeaveRequest.findByIdAndUpdate(id, update, { new: true })
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } });
  const empName = (leave as any)?.employeeId?.userId?.name ?? 'employee';
  const companyId = getCompanyId(req);
  if (companyId) invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Leave ${update.status} — ${empName}`, 'Leaves');
  res.json(leave);
};
