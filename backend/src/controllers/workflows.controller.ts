import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import Workflow from '../models/Workflow';
import Employee from '../models/Employee';
import LeaveRequest from '../models/LeaveRequest';
import Payslip from '../models/Payslip';
import Attendance from '../models/Attendance';
import { getWorkflowConfig } from '../utils/workflow';

// GET /company-admin/workflows
export const getWorkflows = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const types: ('leave' | 'expense' | 'correction')[] = ['leave', 'expense', 'correction'];

    const saved = await Workflow.find({ companyId }).lean();
    const savedMap: Record<string, typeof saved[0]> = {};
    saved.forEach((w) => { savedMap[w.type] = w; });

    // Merge saved records with defaults for any missing type
    const result = await Promise.all(types.map(async (t) => {
      const def = await getWorkflowConfig(req, t);
      const doc = savedMap[t];
      return {
        type: t,
        steps: doc ? doc.steps : def.steps,
        autoEscalate: doc ? doc.autoEscalate : def.autoEscalate,
        escalateHours: doc ? doc.escalateHours : def.escalateHours,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /company-admin/workflows/:type
export const saveWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { type } = req.params as { type: string };
    const { steps, autoEscalate, escalateHours } = req.body as {
      steps: { order: number; role: string; action: string; escalateAfter: number }[];
      autoEscalate: boolean;
      escalateHours: number;
    };

    if (!['leave', 'expense', 'correction'].includes(type)) {
      res.status(400).json({ message: 'Invalid workflow type' });
      return;
    }

    const workflow = await Workflow.findOneAndUpdate(
      { companyId: companyId as any, type: type as any },
      { companyId: companyId as any, type, steps, autoEscalate, escalateHours } as any,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json(workflow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Reports aggregations ──────────────────────────────────────────────────────

// GET /company-admin/reports/workforce
export const getWorkforceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

    const [total, active, byDept, byType, recent] = await Promise.all([
      Employee.countDocuments({ companyId }),
      Employee.countDocuments({ companyId, status: 'Active' }),
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        { $group: { _id: '$department', count: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        { $group: { _id: '$employmentType', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
      ]),
      Employee.find({ companyId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean(),
    ]);

    res.json({
      summary: { total, active, inactive: total - active },
      byDepartment: byDept.map((d: any) => ({ department: d._id, count: d.count, active: d.active })),
      byEmploymentType: byType.map((t: any) => ({ type: t._id || 'Other', count: t.count })),
      recentJoinees: recent.map((e: any) => ({
        employeeId: e.employeeId,
        name: (e.userId as any)?.name ?? 'Unknown',
        department: e.department,
        designation: e.designation,
        joiningDate: e.joiningDate,
        status: e.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /company-admin/reports/leave
export const getLeaveReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { from, to } = req.query as Record<string, string>;

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);

    const where: Record<string, any> = { companyId };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const [byStatus, byType, total] = await Promise.all([
      LeaveRequest.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), ...(where.createdAt ? { createdAt: where.createdAt } : {}) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      LeaveRequest.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), ...(where.createdAt ? { createdAt: where.createdAt } : {}) } },
        { $group: { _id: '$leaveType', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
      ]),
      LeaveRequest.countDocuments(where),
    ]);

    res.json({
      total,
      byStatus: byStatus.map((s: any) => ({ status: s._id, count: s.count })),
      byType: byType.map((t: any) => ({ type: t._id || 'Other', count: t.count })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /company-admin/reports/payroll
export const getPayrollReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { from, to } = req.query as Record<string, string>;

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);

    const where: Record<string, any> = { companyId };
    if (Object.keys(dateFilter).length) where.createdAt = dateFilter;

    const [summary, byMonth, recent] = await Promise.all([
      Payslip.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), ...(where.createdAt ? { createdAt: where.createdAt } : {}) } },
        { $group: {
          _id: null,
          totalNet: { $sum: '$netPay' },
          totalGross: { $sum: '$grossSalary' },
          totalDeductions: { $sum: '$totalDeductions' },
          count: { $sum: 1 },
        }},
      ]),
      Payslip.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
        { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          net: { $sum: '$netPay' },
          count: { $sum: 1 },
        }},
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ]),
      Payslip.find(where).sort({ createdAt: -1 }).limit(20)
        .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
        .lean(),
    ]);

    res.json({
      summary: summary[0] ?? { totalNet: 0, totalGross: 0, totalDeductions: 0, count: 0 },
      byMonth: byMonth.map((m: any) => ({
        label: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        net: m.net,
        count: m.count,
      })).reverse(),
      recent: recent.map((p: any) => ({
        id: p._id.toString(),
        employeeName: (p.employeeId as any)?.userId?.name ?? 'Unknown',
        month: p.month,
        year: p.year,
        netSalary: p.netPay,
        status: p.status,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /company-admin/reports/attendance
export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const { year, month } = req.query as Record<string, string>;

    const y = parseInt(year ?? String(new Date().getFullYear()));
    const m = parseInt(month ?? String(new Date().getMonth() + 1));

    const startDate = new Date(y, m - 1, 1);
    const endDate   = new Date(y, m, 0, 23, 59, 59);

    const [byStatus, totalRecords, totalEmployees] = await Promise.all([
      Attendance.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Attendance.countDocuments({ companyId, date: { $gte: startDate, $lte: endDate } }),
      Employee.countDocuments({ companyId, status: 'Active' }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s: any) => { statusMap[s._id] = s.count; });

    res.json({
      period: { year: y, month: m },
      totalRecords,
      totalEmployees,
      byStatus: {
        Present:  statusMap['Present']  ?? 0,
        Late:     statusMap['Late']     ?? 0,
        Absent:   statusMap['Absent']   ?? 0,
        Leave:    statusMap['Leave']    ?? 0,
        Holiday:  statusMap['Holiday']  ?? 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
