import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import LeaveRequest from '../models/LeaveRequest';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth.middleware';
import { parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId } from '../utils/authContext';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';
import { businessDateFor } from '../utils/attendance';
import AttendancePolicy from '../models/AttendancePolicy';
import { calculateAttendanceMetrics } from '../utils/attendanceRules';

const getCompanyTimezone = async (companyId: unknown): Promise<string> => {
  const company = await Company.findById(companyId).select('timezone').lean();
  return company?.timezone || process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
};

const getPolicyTiming = async (companyId: unknown): Promise<{ timing: string; graceMinutes: number }> => {
  const policy = await AttendancePolicy.findOne({ companyId: String(companyId) }).select('standardStart standardEnd graceMinutes').lean();
  return { timing: `${policy?.standardStart ?? '09:00'}-${policy?.standardEnd ?? '18:00'}`, graceMinutes: Number(policy?.graceMinutes ?? 0) };
};

// ── HR / Manager / Supervisor / Finance: overview + dept breakdown ────────────

export const getAttendanceOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) { res.status(400).json({ message: 'Company context required' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timezone = await getCompanyTimezone(companyId);
    const todayStr = businessDateFor(now, timezone);

    const result = await getCached(`attendance:overview:${companyId}:${todayStr}`, async () => {
      const [total, perm, todayRecords] = await Promise.all([
        Employee.countDocuments({ companyId, status: 'Active' }),
        Employee.countDocuments({ companyId, status: 'Active', employmentType: 'Permanent' }),
        Attendance.find({
          companyId: new mongoose.Types.ObjectId(companyId),
          businessDate: todayStr,
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
          .sort({ date: -1, createdAt: -1, _id: -1 })
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
    if (Number.isNaN(attendanceDate.getTime())) { res.status(400).json({ message: 'Invalid attendance date' }); return; }
    if (checkOut && !checkIn) { res.status(400).json({ message: 'Check-out requires check-in', code: 'CHECK_IN_REQUIRED' }); return; }
    const timePattern = /^\d{2}:\d{2}$/;
    if ((checkIn && !timePattern.test(checkIn)) || (checkOut && !timePattern.test(checkOut))) { res.status(400).json({ message: 'Attendance times must use HH:MM format' }); return; }
    if (checkIn && checkOut) {
      const [inHour, inMinute] = checkIn.split(':').map(Number);
      const [outHour, outMinute] = checkOut.split(':').map(Number);
      if ([inHour, inMinute, outHour, outMinute].some((value) => Number.isNaN(value) || value < 0 || value > 59) || inHour > 23 || outHour > 23) {
        res.status(400).json({ message: 'Attendance time is invalid' }); return;
      }
      const shiftTiming = emp.shiftTiming ?? '09:00-18:00';
      const [shiftStart, shiftEnd] = shiftTiming.split('-').map((value) => value.trim());
      const overnight = shiftEnd && shiftStart && shiftEnd <= shiftStart;
      if (!overnight && (outHour * 60 + outMinute) < (inHour * 60 + inMinute)) {
        res.status(400).json({ message: 'Check-out cannot be earlier than check-in', code: 'INVALID_TIME_RANGE' }); return;
      }
    }
    attendanceDate.setHours(0, 0, 0, 0);
    const timezone = await getCompanyTimezone(companyId);
    const policy = await getPolicyTiming(companyId);
    const metrics = calculateAttendanceMetrics(checkIn, checkOut, emp.shiftTiming ?? policy.timing);
    metrics.lateMinutes = Math.max(0, metrics.lateMinutes - policy.graceMinutes);

    const record = await Attendance.findOneAndUpdate(
      { companyId, employeeId, businessDate: date.slice(0, 10) },
      { $set: { companyId, date: attendanceDate, businessDate: date.slice(0, 10), timezone, checkIn, checkOut, status, notes, source: 'Manual', ...metrics } },
      { upsert: true, returnDocument: 'after' }
    );

    const now2 = new Date();
    const todayStr2 = businessDateFor(now2, timezone);
    invalidate(`attendance:overview:${companyId}:${todayStr2}`);
    invalidatePrefix(`attendance:records:${companyId}`);
    logActivity(req, `Marked attendance for employee ${employeeId} on ${date}`, 'Attendance');
    res.status(201).json(record);
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) {
      res.status(409).json({ message: 'Attendance already exists for this employee and business date', code: 'DUPLICATE_ATTENDANCE' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Employee self check-in ────────────────────────────────────────────────────

export const selfCheckIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await Employee.findOne({ userId: req.user!.userId, companyId: req.user!.companyId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timezone = await getCompanyTimezone(emp.companyId);
    const businessDate = businessDateFor(now, timezone);
    const existing = await Attendance.findOne({ companyId: emp.companyId, employeeId: emp._id, businessDate }).lean();
    if (existing && existing.checkIn) {
      res.status(409).json({ message: 'Already checked in today', record: existing });
      return;
    }

    const hour   = now.getHours();
    const minute = now.getMinutes();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const policy = await getPolicyTiming(emp.companyId);
    const metrics = calculateAttendanceMetrics(timeStr, undefined, emp.shiftTiming ?? policy.timing);
    metrics.lateMinutes = Math.max(0, metrics.lateMinutes - policy.graceMinutes);

    const record = await Attendance.findOneAndUpdate(
      { companyId: emp.companyId, employeeId: emp._id, businessDate },
      { $set: { date: today, companyId: emp.companyId, businessDate, timezone, checkIn: timeStr, status: metrics.lateMinutes > 0 ? 'Late' : 'Present', source: 'SelfCheckIn', ...metrics } },
      { upsert: true, returnDocument: 'after' }
    );

    const companyIdStr = emp.companyId?.toString();
    if (companyIdStr) {
      const todayKey = businessDateFor(now, timezone);
      invalidate(`attendance:overview:${companyIdStr}:${todayKey}`);
      invalidatePrefix(`attendance:records:${companyIdStr}`);
    }
    res.json({ message: 'Checked in successfully', record });
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) {
      res.status(409).json({ message: 'Already checked in today', code: 'DUPLICATE_ATTENDANCE' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ── Employee self check-out ───────────────────────────────────────────────────

export const selfCheckOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await Employee.findOne({ userId: req.user!.userId, companyId: req.user!.companyId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timezone = await getCompanyTimezone(emp.companyId);
    const businessDate = businessDateFor(now, timezone);
    const existing = await Attendance.findOne({ companyId: emp.companyId, employeeId: emp._id, businessDate }).lean();
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
    const policy = await getPolicyTiming(emp.companyId);
    const metrics = calculateAttendanceMetrics(existing.checkIn ?? undefined, timeStr, emp.shiftTiming ?? policy.timing);
    metrics.lateMinutes = Math.max(0, metrics.lateMinutes - policy.graceMinutes);

    const record = await Attendance.findOneAndUpdate(
      { companyId: emp.companyId, employeeId: emp._id, businessDate },
      { $set: { checkOut: timeStr, timezone, ...metrics } },
      { returnDocument: 'after' }
    );

    const companyIdStr2 = emp.companyId?.toString();
    if (companyIdStr2) {
      const todayKey2 = businessDateFor(now, timezone);
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
    const emp = await Employee.findOne({ userId: req.user!.userId, companyId: req.user!.companyId }).lean();
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timezone = await getCompanyTimezone(emp.companyId);
    const businessDate = businessDateFor(now, timezone);
    const record = await Attendance.findOne({ companyId: emp.companyId, employeeId: emp._id, businessDate }).lean();
    res.json({ record: record || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
