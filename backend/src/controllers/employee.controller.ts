import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Employee from '../models/Employee';
import LeaveRequest from '../models/LeaveRequest';
import Attendance from '../models/Attendance';
import Payslip from '../models/Payslip';
import Expense from '../models/Expense';
import Document from '../models/Document';
import { parsePagination, paginationMeta } from '../utils/query';
import { buildWorkflowState } from '../utils/workflow';

const getEmployee = async (userId: string) => {
  return Employee.findOne({ userId }).populate('userId', 'name email avatar');
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee profile not found' }); return; }
    res.json(emp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const year  = parseInt((req.query.year  as string) || String(now.getFullYear()));
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth   = new Date(year, month, 0, 23, 59, 59);

    const [attendanceRows, leaves] = await Promise.all([
      Attendance.find({
        employeeId: emp._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }).lean(),
      LeaveRequest.find({
        employeeId: emp._id,
        status: 'Approved',
        startDate: { $lte: endOfMonth },
        endDate:   { $gte: startOfMonth },
      }).lean(),
    ]);

    // Build a day→record map
    const recordByDay = new Map<number, typeof attendanceRows[0]>();
    attendanceRows.forEach((r) => {
      const d = new Date(r.date as unknown as string).getDate();
      recordByDay.set(d, r);
    });

    // Build a set of approved leave days in this month
    const leaveDays = new Set<number>();
    leaves.forEach((l) => {
      const s = new Date(l.startDate as unknown as string);
      const e = new Date(l.endDate as unknown as string);
      for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
        if (dt.getMonth() + 1 === month && dt.getFullYear() === year) {
          leaveDays.add(dt.getDate());
        }
      }
    });

    const daysInMonth = endOfMonth.getDate();
    const monthNames  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayNames    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    type DayRecord = { date: string; day: string; status: string; checkIn: string; checkOut: string; hours: string; ot: string };
    const records: DayRecord[] = [];
    let present = 0; let absent = 0; let late = 0; let totalHours = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dt        = new Date(year, month - 1, d);
      const dayOfWeek = dt.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFuture  = dt > now;

      const dateLabel = `${String(d).padStart(2, '0')} ${monthNames[month - 1]}`;
      const dayLabel  = dayNames[dayOfWeek]!;

      if (isWeekend) {
        records.push({ date: dateLabel, day: dayLabel, status: 'Weekend', checkIn: '—', checkOut: '—', hours: '—', ot: '—' });
        continue;
      }
      if (isFuture) {
        records.push({ date: dateLabel, day: dayLabel, status: 'Upcoming', checkIn: '—', checkOut: '—', hours: '—', ot: '—' });
        continue;
      }

      const row = recordByDay.get(d);
      if (row) {
        const ciStr  = row.checkIn  || '—';
        const coStr  = row.checkOut || '—';
        let hrsLabel = '—';
        if (row.checkIn && row.checkOut) {
          const [ciH, ciM] = row.checkIn.split(':').map(Number);
          const [coH, coM] = row.checkOut.split(':').map(Number);
          const hrs = (coH! - ciH!) + (coM! - ciM!) / 60;
          if (hrs > 0) {
            totalHours += hrs;
            hrsLabel = `${Math.floor(hrs)}h ${Math.round((hrs % 1) * 60)}m`;
          }
        }
        if (row.status === 'Present') present++;
        else if (row.status === 'Late') late++;
        else if (row.status === 'Absent') absent++;
        records.push({ date: dateLabel, day: dayLabel, status: row.status, checkIn: ciStr, checkOut: coStr, hours: hrsLabel, ot: '—' });
      } else if (leaveDays.has(d)) {
        records.push({ date: dateLabel, day: dayLabel, status: 'Leave', checkIn: '—', checkOut: '—', hours: '—', ot: '—' });
      } else {
        // Past working day with no record = Absent
        absent++;
        records.push({ date: dateLabel, day: dayLabel, status: 'Absent', checkIn: '—', checkOut: '—', hours: '—', ot: '—' });
      }
    }

    const workingDays = records.filter((r) => r.status !== 'Weekend' && r.status !== 'Upcoming').length;

    res.json({
      records,
      stats: { present, late, absent, totalHours: Math.round(totalHours), workingDays },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const leaves = await LeaveRequest.find({ employeeId: emp._id }).sort({ createdAt: -1 }).lean();

    const pending  = leaves.filter((l) => l.status === 'Pending').length;
    const approved = leaves.filter((l) => l.status === 'Approved').length;
    const rejected = leaves.filter((l) => l.status === 'Rejected').length;

    const usedCasual = leaves.filter((l) => l.leaveType === 'Casual'  && l.status === 'Approved').reduce((s, l) => s + (l.days as number), 0);
    const usedSick   = leaves.filter((l) => l.leaveType === 'Sick'    && l.status === 'Approved').reduce((s, l) => s + (l.days as number), 0);
    const usedEarned = leaves.filter((l) => l.leaveType === 'Earned'  && l.status === 'Approved').reduce((s, l) => s + (l.days as number), 0);

    res.json({
      leaves,
      stats: { pending, approved, rejected, total: leaves.length },
      balance: [
        { type: 'Casual Leave',   total: 12, used: usedCasual,  remaining: Math.max(0, 12 - usedCasual)  },
        { type: 'Sick Leave',     total: 10, used: usedSick,    remaining: Math.max(0, 10 - usedSick)    },
        { type: 'Earned Leave',   total: 15, used: usedEarned,  remaining: Math.max(0, 15 - usedEarned)  },
        { type: 'Optional Leave', total: 3,  used: 0,           remaining: 3                              },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const { leaveType, startDate, endDate, reason } = req.body as {
      leaveType: string; startDate: string; endDate: string; reason: string;
    };

    const start = new Date(startDate);
    const end   = new Date(endDate);
    const days  = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
    const workflowState = await buildWorkflowState(req, 'leave');

    const leave = await LeaveRequest.create({
      employeeId: emp._id,
      companyId:  emp.get('companyId'),
      leaveType,
      startDate:  start,
      endDate:    end,
      days,
      reason,
      status:     'Pending',
      ...workflowState,
    });

    res.status(201).json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyPayslips = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const payslips = await Payslip.find({ employeeId: emp._id }).sort({ year: -1, month: -1 }).lean();
    res.json(payslips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const expenses = await Expense.find({ employeeId: emp._id }).sort({ createdAt: -1 }).lean();

    const pending  = expenses.filter((e) => e.status === 'Pending').length;
    const approved = expenses.filter((e) => e.status === 'Approved').length;
    const total    = expenses.reduce((s, e) => s + (e.amount as number), 0);

    res.json({ expenses, stats: { pending, approved, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const submitExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const { category, amount, description, receiptUrl } = req.body as {
      category: string; amount: number; description: string; receiptUrl?: string;
    };
    const workflowState = await buildWorkflowState(req, 'expense');

    const expense = await Expense.create({
      employeeId:  emp._id,
      companyId:   emp.get('companyId'),
      category,
      amount:      Number(amount),
      description,
      receiptUrl,
      status:      'Pending',
      ...workflowState,
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, email } = req.body as { name?: string; email?: string };
    if (email) {
      const conflict = await User.findOne({ email, _id: { $ne: userId } }).lean();
      if (conflict) { res.status(409).json({ message: 'Email already in use' }); return; }
    }
    const updated = await User.findByIdAndUpdate(userId, { ...(name ? { name } : {}), ...(email ? { email } : {}) }, { new: true }).select('name email').lean();
    if (!updated) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) { res.status(403).json({ message: 'Company context required' }); return; }
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
    const where = { companyId, visibility: { $in: ['All Employees', 'Public'] } };
    const [docs, total] = await Promise.all([
      Document.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Document.countDocuments(where),
    ]);
    res.json({ documents: docs, pagination: paginationMeta(total, page, limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
