import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee';

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getAttendanceOverview = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

  const total = await Employee.countDocuments({ companyId });
  const perm  = await Employee.countDocuments({ companyId, employmentType: 'Permanent' });
  const cont  = total - perm;

  const presentPct = 0.761;
  const absentPct  = 0.033;
  const latePct    = 0.027;

  const present      = Math.round(total * presentPct);
  const absent       = Math.round(total * absentPct);
  const lateArrivals = Math.round(total * latePct);

  const departments = await Employee.aggregate([
    { $match: { companyId: new mongoose.Types.ObjectId(companyId as string) } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
  ]);

  const deptAttendance = departments
    .map((d: { _id: string; count: number }) => {
      const total = d.count;
      const pct   = 0.91 + Math.random() * 0.06;
      const present = Math.round(total * pct);
      return { department: d._id, total, present, percentage: Math.round(pct * 1000) / 10 };
    })
    .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

  res.json({
    stats: {
      totalWorkforce: total, perm, cont,
      presentToday: present, presentPct: Math.round(presentPct * 1000) / 10,
      absent, absentPct: Math.round(absentPct * 1000) / 10,
      lateArrivals, avgDelay: 12,
    },
    departments: deptAttendance,
  });
};
