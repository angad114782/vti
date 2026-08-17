import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Shift from '../models/Shift';
import Employee from '../models/Employee';
import { logActivity } from '../utils/activity';
import { getCompanyId } from '../utils/authContext';
import { validateId } from '../utils/validate';

const SHIFT_META = {
  Morning: { startTime: '06:00', endTime: '14:00' },
  Evening: { startTime: '14:00', endTime: '22:00' },
  Night: { startTime: '22:00', endTime: '06:00' },
} as const;

const REQUIRED_PER_SHIFT = 3;

export const getShifts = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { date, department } = req.query as Record<string, string>;

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  const where: Record<string, unknown> = {
    companyId,
    date: { $gte: startOfDay, $lte: endOfDay },
  };
  if (department && department !== 'All Departments') where.department = department;

  const [assignments, departmentsAgg] = await Promise.all([
    Shift.find(where)
      .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } })
      .sort({ shiftName: 1, createdAt: 1 })
      .lean(),
    Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), ...(department && department !== 'All Departments' ? { department } : {}) } },
      { $group: { _id: '$department', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const shifts = { Morning: [] as any[], Evening: [] as any[], Night: [] as any[] };
  assignments.forEach((assignment: any) => {
    const employee = assignment.employeeId as any;
    if (!employee) return;
    shifts[assignment.shiftName as keyof typeof shifts].push({
      id: assignment._id.toString(),
      employeeId: employee._id.toString(),
      name: employee.userId?.name ?? 'Unknown',
      workerCode: employee.employeeId,
      dept: employee.department ?? assignment.department,
      role: employee.designation ?? 'Worker',
      shift: `${assignment.startTime} - ${assignment.endTime}`,
      shiftName: assignment.shiftName,
      status: assignment.status,
    });
  });

  const plans = departmentsAgg.flatMap((d: any) => {
    const departmentName = d._id || 'Unassigned';
    return (['Morning', 'Evening', 'Night'] as const).map((shiftName) => {
      const assigned = shifts[shiftName].filter((s) => s.dept === departmentName).length;
      const required = Math.min(Math.max(assigned, REQUIRED_PER_SHIFT), d.total || REQUIRED_PER_SHIFT);
      return {
        department: departmentName,
        shift: shiftName,
        required,
        assigned,
        shortage: Math.max(required - assigned, 0),
      };
    });
  });

  const shortages = plans
    .filter((p) => p.shortage > 0)
    .sort((a, b) => b.shortage - a.shortage)
    .map((p) => ({
      station: `${p.department} - ${p.shift}`,
      shift: `${p.shift} Shift`,
      required: p.required,
      actual: p.assigned,
      severity: p.shortage >= 2 ? 'critical' : 'high',
    }));

  res.json({
    stats: {
      totalWorkers: assignments.length,
      morningShift: shifts.Morning.length,
      eveningShift: shifts.Evening.length,
      nightShift: shifts.Night.length,
    },
    shifts,
    plans,
    shortages,
  });
};

export const createShift = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { employeeId, date, shiftName, startTime, endTime, notes } = req.body as {
    employeeId: string;
    date: string;
    shiftName: keyof typeof SHIFT_META;
    startTime?: string;
    endTime?: string;
    notes?: string;
  };

  const employee = await Employee.findById(employeeId).lean();
  if (!employee) { res.status(404).json({ message: 'Employee not found' }); return; }
  if (employee.companyId?.toString() !== companyId) { res.status(403).json({ message: 'Forbidden' }); return; }

  const shift = await Shift.create({
    employeeId,
    companyId,
    department: employee.department ?? 'Unassigned',
    date: new Date(date),
    shiftName,
    startTime: startTime || SHIFT_META[shiftName as keyof typeof SHIFT_META].startTime,
    endTime: endTime || SHIFT_META[shiftName as keyof typeof SHIFT_META].endTime,
    notes,
  });

  logActivity(req, `Assigned ${shiftName} shift to ${employee.employeeId}`, 'Shifts');
  res.status(201).json(shift);
};

export const updateShift = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { id } = req.params as { id: string };
  validateId(id);
  const { shiftName, startTime, endTime, status, notes } = req.body as Record<string, string>;

  const shift = await Shift.findById(id);
  if (!shift) { res.status(404).json({ message: 'Shift not found' }); return; }
  if (shift.get('companyId')?.toString() !== companyId) { res.status(403).json({ message: 'Forbidden' }); return; }

  if (shiftName) shift.set('shiftName', shiftName);
  if (startTime) shift.set('startTime', startTime);
  if (endTime) shift.set('endTime', endTime);
  if (status) shift.set('status', status);
  if (notes !== undefined) shift.set('notes', notes);
  await shift.save();

  const shiftLabel = `${shift.get('shiftName') ?? 'shift'} on ${new Date(shift.get('date')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  logActivity(req, `Updated ${shiftLabel}`, 'Shifts');
  res.json(shift);
};
