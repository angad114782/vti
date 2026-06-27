import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const getEmployee = async (userId: string) => {
  return prisma.employee.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true, avatar: true } } },
  });
};

// GET /api/employee/profile
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

// GET /api/employee/attendance
export const getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const now   = new Date();
    const year  = parseInt((req.query.year  as string) || String(now.getFullYear()));
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));

    // Get approved leaves for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth   = new Date(year, month, 0);
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: emp.id,
        status: 'Approved',
        startDate: { lte: endOfMonth },
        endDate:   { gte: startOfMonth },
      },
    });

    const leaveDays = new Set<number>();
    leaves.forEach((l) => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 === month) leaveDays.add(d.getDate());
      }
    });

    // Generate daily records
    const daysInMonth = endOfMonth.getDate();
    const records: { date: string; day: string; status: string; checkIn: string; checkOut: string; hours: string; ot: string }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let present = 0; let absent = 0; let late = 0; let totalHours = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dt    = new Date(year, month - 1, d);
      const dayOfWeek = dt.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFuture  = dt > now;

      let status = '';
      let checkIn = '—'; let checkOut = '—'; let hours = '—'; let ot = '—';

      if (isWeekend) {
        status = 'Weekend';
      } else if (isFuture) {
        status = 'Upcoming';
      } else if (leaveDays.has(d)) {
        status = 'Leave';
        absent++;
      } else {
        const seed  = (emp.id.charCodeAt(0) + d) % 10;
        const isLate = seed < 2;
        const h     = 8 + (seed % 2);
        const min   = isLate ? 15 + (seed * 7) % 30 : (seed * 3) % 30;
        checkIn     = isLate ? `09:${String(min).padStart(2, '0')} AM` : `08:${String(min).padStart(2, '0')} AM`;
        checkOut    = `05:${String(30 + (seed % 30)).padStart(2, '0')} PM`;
        const hrsNum = h + (seed % 2 === 0 ? 0.5 : 0);
        hours       = `${hrsNum}h`;
        ot          = seed > 7 ? `${seed - 7}h` : '—';
        totalHours += hrsNum;
        status      = isLate ? 'Late' : 'Present';
        if (isLate) late++; else present++;
      }

      records.push({ date: `${String(d).padStart(2, '0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]}`, day: days[dayOfWeek]!, status, checkIn, checkOut, hours, ot });
    }

    const workingDays = records.filter((r) => r.status !== 'Weekend' && r.status !== 'Upcoming').length;

    res.json({
      records,
      stats: {
        present,
        late,
        absent: workingDays - present - late,
        totalHours: Math.round(totalHours),
        workingDays,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/employee/leaves
export const getMyLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: emp.id },
      orderBy: { createdAt: 'desc' },
    });

    const pending  = leaves.filter((l) => l.status === 'Pending').length;
    const approved = leaves.filter((l) => l.status === 'Approved').length;
    const rejected = leaves.filter((l) => l.status === 'Rejected').length;

    // Leave balance (fixed quota - approved days used)
    const usedCasual  = leaves.filter((l) => l.leaveType === 'Casual'  && l.status === 'Approved').reduce((s, l) => s + l.days, 0);
    const usedSick    = leaves.filter((l) => l.leaveType === 'Sick'    && l.status === 'Approved').reduce((s, l) => s + l.days, 0);
    const usedEarned  = leaves.filter((l) => l.leaveType === 'Earned'  && l.status === 'Approved').reduce((s, l) => s + l.days, 0);

    res.json({
      leaves,
      stats: { pending, approved, rejected, total: leaves.length },
      balance: [
        { type: 'Casual Leave',  total: 12, used: usedCasual,  remaining: Math.max(0, 12 - usedCasual)  },
        { type: 'Sick Leave',    total: 10, used: usedSick,    remaining: Math.max(0, 10 - usedSick)    },
        { type: 'Earned Leave',  total: 15, used: usedEarned,  remaining: Math.max(0, 15 - usedEarned)  },
        { type: 'Optional Leave',total: 3,  used: 0,           remaining: 3                              },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/employee/leaves
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

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        companyId:  emp.companyId,
        leaveType,
        startDate:  start,
        endDate:    end,
        days,
        reason,
        status:     'Pending',
      },
    });

    res.status(201).json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/employee/payslips
export const getMyPayslips = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const payslips = await prisma.payslip.findMany({
      where: { employeeId: emp.id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    res.json(payslips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/employee/expenses
export const getMyExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const expenses = await prisma.expense.findMany({
      where: { employeeId: emp.id },
      orderBy: { createdAt: 'desc' },
    });

    const pending  = expenses.filter((e) => e.status === 'Pending').length;
    const approved = expenses.filter((e) => e.status === 'Approved').length;
    const total    = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({ expenses, stats: { pending, approved, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/employee/expenses
export const submitExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const emp = await getEmployee(req.user!.userId);
    if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }

    const { category, amount, description } = req.body as {
      category: string; amount: number; description: string;
    };

    const expense = await prisma.expense.create({
      data: {
        employeeId:  emp.id,
        companyId:   emp.companyId,
        category,
        amount:      Number(amount),
        description,
        status:      'Pending',
      },
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/employee/documents
export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    const docs = await prisma.document.findMany({
      where: {
        companyId: companyId ?? undefined,
        visibility: { in: ['All Employees', 'Public'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
