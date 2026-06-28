import { Request, Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';
import User from '../models/User';

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getLeaves = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { status, leaveType, search } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (status && status !== 'ALL') where.status = status;
  if (leaveType && leaveType !== 'ALL') where.leaveType = leaveType;

  if (search) {
    const users = await User.find({ name: new RegExp(search, 'i') }).select('_id').lean();
    const emps = await Employee.find({ userId: { $in: users.map((u) => u._id) }, companyId }).select('_id').lean();
    where.employeeId = { $in: emps.map((e) => e._id) };
  }

  const leaves = await LeaveRequest.find(where)
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } })
    .sort({ createdAt: -1 });

  const [pending, approved, rejected] = await Promise.all([
    LeaveRequest.countDocuments({ companyId, status: 'Pending' }),
    LeaveRequest.countDocuments({ companyId, status: 'Approved' }),
    LeaveRequest.countDocuments({ companyId, status: 'Rejected' }),
  ]);

  res.json({ leaves, stats: { total: leaves.length, pending, approved, rejected } });
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body as { status: string };
  const leave = await LeaveRequest.findByIdAndUpdate(id, { status }, { new: true })
    .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } });
  res.json(leave);
};
