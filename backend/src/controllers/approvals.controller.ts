import { Request, Response } from 'express';
import Approval from '../models/Approval';
import Employee from '../models/Employee';
import User from '../models/User';

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getApprovals = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, type, search } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (type && type !== 'ALL') where.type = type;

  if (search) {
    const users = await User.find({ name: new RegExp(search, 'i') }).select('_id').lean();
    const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
    where.employeeId = { $in: emps.map((e) => e._id) };
  }

  const approvals = await Approval.find(where)
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [pending, approved, rejected] = await Promise.all([
    Approval.countDocuments({ companyId, status: 'Pending' }),
    Approval.countDocuments({ companyId, status: 'Approved', date: { $gte: todayStart } }),
    Approval.countDocuments({ companyId, status: 'Rejected' }),
  ]);

  const escalated = Math.max(0, pending - 20);

  res.json({ approvals, stats: { pending, approvedToday: approved, rejected, escalated } });
};

export const updateApproval = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body as { status: string };
  const approval = await Approval.findByIdAndUpdate(id, { status }, { new: true })
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } });
  res.json(approval);
};
