import { Request, Response } from 'express';
import Approval from '../models/Approval';
import Employee from '../models/Employee';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { buildWorkflowState, resolveWorkflowUpdate } from '../utils/workflow';
import { getCompanyId } from '../utils/authContext';
import { validateId } from '../utils/validate';

export const getApprovals = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, type, search } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (type && type !== 'ALL') where.type = type;

  if (search) {
    const users = await User.find({ name: escapeRegex(search) }).select('_id').lean();
    const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
    where.employeeId = { $in: emps.map((e) => e._id) };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [approvals, filteredTotal, pending, approved, rejected] = await Promise.all([
    Approval.find(where)
      .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Approval.countDocuments(where),
    Approval.countDocuments({ companyId, status: 'Pending' }),
    Approval.countDocuments({ companyId, status: 'Approved', date: { $gte: todayStart } }),
    Approval.countDocuments({ companyId, status: 'Rejected' }),
  ]);

  const escalated = Math.max(0, pending - 20);

  res.json({
    approvals,
    pagination: paginationMeta(filteredTotal, page, limit),
    stats: { pending, approvedToday: approved, rejected, escalated },
  });
};

export const updateApproval = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  validateId(id);
  const { status } = req.body as { status: string };
  const existing = await Approval.findById(id);
  if (!existing) {
    res.status(404).json({ message: 'Approval not found' });
    return;
  }
  if (!existing.pendingRole || !existing.workflowStep) {
    const state = await buildWorkflowState(req, 'correction');
    existing.pendingRole = state.pendingRole;
    existing.workflowStep = state.workflowStep;
    existing.workflowType = state.workflowType;
    await existing.save();
  }

  const result = await resolveWorkflowUpdate(req, 'correction', existing.workflowStep as number, status);
  if (result.error) {
    res.status(403).json({ message: result.error });
    return;
  }
  const update = result.update;
  if (!update) {
    res.status(400).json({ message: 'No workflow update generated' });
    return;
  }

  const approval = await Approval.findByIdAndUpdate(id, update, { new: true })
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } });
  const empName = (approval as any)?.employeeId?.userId?.name ?? 'employee';
  logActivity(req, `Approval ${update.status} — ${empName}`, 'Approvals');
  res.json(approval);
};
