import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import LeaveRequest from '../models/LeaveRequest';
import { AuthRequest } from '../middleware/auth.middleware';
import { parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId } from '../utils/authContext';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';

// ── HR / Manager / Supervisor / Finance: overview + dept breakdown ────────────

export const getAttendanceOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().slice(0, 10);

    const result = await getCached(`attendance:overview:${companyId}:${todayStr}`, async () => {
      const [total, perm, todayRecords] = await Promise.all([
        Employee.countDocuments({ companyId, status: 'Active' }),
        Employee.countDocuments({ companyId, status: 'Active', employmentType: 'Permanent' }),
        Attendance.find({
          companyId: new mongoose.Types.ObjectId(companyId),
          date: today,
        }).lean(),
      ]);

      const cont = total - perm;
      const present      = todayRecords.filter((r) => r.status === 'Present').length;
      const late         = todayRecords.filter((r) => r.status === 'Late').length;
      const absent       = todayRecords.filter((r) => r.status === 'Absent').length;
      const presentToday = present + late;

      const presentEmployeeIds = new Set(
        todayRecords
          .filter((r) => r.status === 'Present' || r.status === 'Late')
          .map((r) => r.employeeId.toString())
      );

      const employeesByDept = await Employee.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId), status: 'Active', department: { $ne: null } } },
        { $group: { _id: '$department', employeeIds: { $push: { $toString: '$_id' } }, count: { $sum: 1 } } },
      ]);

      const deptAttendance = employeesByDept
        .map((d: { _id: string; employeeIds: string[]; count: number }) => {
          const presentCount = d.employeeIds.filter((id) => presentEmployeeIds.has(id)).length;
          const pct = d.count > 0 ? Math.round((presentCount / d.count) * 1000) / 10 : 0;
          return { department: d._id, total: d.count, present: presentCount, percentage: pct };
        })
        .sort((a: { total: number }, b: { total: number }) => b.total - a.total);

      return {
        stats: {
          totalWorkforce: total, perm, cont,
          presentToday,
          presentPct: total > 0 ? Math.round((presentToday / total) * 1000) / 10 : 0,
          absent,
          absentPct: total > 0 ? Math.round((absent / total) * 1000) / 10 : 0,
          lateArrivals: late,
          avgDelay: 0,
        },
        departments: deptAttendance,
      };
    }, 300);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── HR: paginated daily records ───────────────────────────────────────────────

export const getAttendanceRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

    const now   = new Date();
    const year  = parseInt((req.query.year  as string) || String(now.getFullYear()));
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

    const cacheKey = `attendance:records:${companyId}:y${year}m${month}p${page}l${limit}`;

    const result = await getCached(cacheKey, async () => {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth   = new Date(year, month, 0, 23, 59, 59);

      const where = {
        companyId: new mongoose.Types.ObjectId(companyId),
        date: { $gte: startOfMonth, $lte: endOfMonth },
      };

      const [records, total] = await Promise.all([
        Attendance.find(where)
          .populate({ path: 'employeeId', select: 'employeeId department designation', populate: { path: 'userId', select: 'name' } })
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Attendance.countDocuments(where),
      ]);

      return { records, pagination: paginationMeta(total, page, limit) };
    }, 600);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── HR: manual attendance entry ───────────────────────────────────────────────

export const createAttendanceRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

    const { employeeId, date, checkIn, checkOut, status, notes } = req.body as {
      employeeId: string; date: string; checkIn?: string; checkOut?: string;
      status: string; notes?: string;
    };

    const emp = await Employee.findOne({ _id: employeeId, companyId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found in this company' }); return; }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date: attendanceDate },
      { $set: { companyId, checkIn, checkOut, status, notes, source: 'Manual' } },
      { upsert: true, new: true }
    );

    const now2 = new Date();
    const todayStr2 = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate()).toISOString().slice(0, 10);
    invalidate(`attendance:overview:${companyId}:${todayStr2}`);
    invalidatePrefix(`attendance:records:${companyId}`);
    logActivity(req, `Marked attendance for employee ${employeeId} on ${date}`, 'Attendance');
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Employee self check-in ────────────────────────────────────────────────────

export const selfCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await Employee.findOne({ userId: req.user!.userId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await Attendance.findOne({ employeeId: emp._id, date: today }).lean();
    if (existing && existing.checkIn) {
      res.status(409).json({ message: 'Already checked in today', record: existing });
      return;
    }

    const hour   = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 0);
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const record = await Attendance.findOneAndUpdate(
      { employeeId: emp._id, date: today },
      { $set: { companyId: emp.companyId, checkIn: timeStr, status: isLate ? 'Late' : 'Present', source: 'SelfCheckIn' } },
      { upsert: true, new: true }
    );

    const companyIdStr = emp.companyId?.toString();
    if (companyIdStr) {
      const todayKey = today.toISOString().slice(0, 10);
      invalidate(`attendance:overview:${companyIdStr}:${todayKey}`);
      invalidatePrefix(`attendance:records:${companyIdStr}`);
    }
    res.json({ message: 'Checked in successfully', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Employee self check-out ───────────────────────────────────────────────────

export const selfCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await Employee.findOne({ userId: req.user!.userId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await Attendance.findOne({ employeeId: emp._id, date: today }).lean();
    if (!existing || !existing.checkIn) {
      res.status(400).json({ message: 'No check-in found for today' });
      return;
    }
    if (existing.checkOut) {
      res.status(409).json({ message: 'Already checked out today', record: existing });
      return;
    }

    const hour    = now.getHours();
    const minute  = now.getMinutes();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    const record = await Attendance.findOneAndUpdate(
      { employeeId: emp._id, date: today },
      { $set: { checkOut: timeStr } },
      { new: true }
    );

    const companyIdStr2 = emp.companyId?.toString();
    if (companyIdStr2) {
      const todayKey2 = today.toISOString().slice(0, 10);
      invalidate(`attendance:overview:${companyIdStr2}:${todayKey2}`);
      invalidatePrefix(`attendance:records:${companyIdStr2}`);
    }
    res.json({ message: 'Checked out successfully', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Employee: today's status ──────────────────────────────────────────────────

export const getMyTodayStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await Employee.findOne({ userId: req.user!.userId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await Attendance.findOne({ employeeId: emp._id, date: today }).lean();
    res.json({ record: record || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
