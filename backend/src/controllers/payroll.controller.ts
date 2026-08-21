import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/Employee';
import SalaryStructure from '../models/SalaryStructure';
import Payslip from '../models/Payslip';
import Attendance from '../models/Attendance';
import Expense from '../models/Expense';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId } from '../utils/authContext';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';
import PayrollRun from '../models/PayrollRun';
import { requireCompanyId } from '../utils/scope';
import { withTransaction } from '../utils/transaction';
import { calculatePayroll } from '../utils/payroll';
import { AuthRequest } from '../middleware/auth.middleware';
import PDFDocument from 'pdfkit';

export const getSalaryStructures = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, department, employmentType } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const cacheKey = `payroll:salaries:${companyId}:${JSON.stringify({ search, department, employmentType, page, limit })}`;

  const result = await getCached(cacheKey, async () => {
    const empWhere: Record<string, unknown> = { companyId };
    if (department && department !== 'ALL') empWhere.department = department;
    if (employmentType && employmentType !== 'ALL') empWhere.employmentType = employmentType;

    if (search) {
      const users = await User.find({ $or: [{ nameSearch: escapeRegex(search) }, { emailSearch: escapeRegex(search) }] }).select('_id').lean();
      empWhere.userId = { $in: users.map((u) => u._id) };
    }

    const [employees, filteredTotal] = await Promise.all([
      Employee.find(empWhere).populate('userId', 'name').sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      Employee.countDocuments(empWhere),
    ]);

    const empIds = employees.map((e) => e._id);
    const latestSalaries = companyId
      ? await SalaryStructure.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: { $in: empIds } } },
          { $sort: { createdAt: -1 } },
          { $group: { _id: '$employeeId', annualCtc: { $first: '$annualCtc' }, lastRevised: { $first: '$lastRevised' } } },
        ])
      : [];

    const salaryMap: Record<string, { annualCtc?: number; lastRevised?: Date }> = {};
    latestSalaries.forEach((s) => { salaryMap[s._id.toString()] = { annualCtc: s.annualCtc, lastRevised: s.lastRevised }; });

    const results = employees.map((e) => {
      const user = e.userId as unknown as { name: string } | null;
      const sal = salaryMap[e._id.toString()];
      return {
        id: e._id.toString(),
        employeeId: e.employeeId,
        name: user?.name ?? '',
        department: e.department,
        designation: e.designation,
        employmentType: e.employmentType,
        annualCtc: sal?.annualCtc ?? e.annualCtc,
        lastRevised: sal?.lastRevised,
      };
    });

    return { results, pagination: paginationMeta(filteredTotal, page, limit) };
  }, 600);

  res.json(result);
};

export const getPayslips = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, month, year, department, employmentType } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const cacheKey = `payroll:payslips:${companyId}:${JSON.stringify({ search, month, year, department, employmentType, page, limit })}`;

  const result = await getCached(cacheKey, async () => {
    const where: Record<string, unknown> = { companyId };
    if (month && month !== 'ALL') where.month = parseInt(month);
    if (year && year !== 'ALL') where.year = parseInt(year);

    const employeeWhere: Record<string, unknown> = { companyId };
    if (department && department !== 'ALL' && department !== 'All Departments') employeeWhere.department = department;
    if (employmentType && employmentType !== 'ALL' && employmentType !== 'All Employees') employeeWhere.employmentType = employmentType;
    if (search) {
      const normalizedSearch = search.trim().toLowerCase();
      const users = await User.find({ $or: [{ nameSearch: escapeRegex(normalizedSearch) }, { emailSearch: escapeRegex(normalizedSearch) }] }).select('_id').lean();
      employeeWhere.$or = [
        { userId: { $in: users.map((u) => u._id) } },
        { employeeIdSearch: escapeRegex(normalizedSearch) },
      ];
    }
    if (search || (department && department !== 'ALL') || (employmentType && employmentType !== 'ALL')) {
      const emps = await Employee.find(employeeWhere).select('_id').lean();
      where.employeeId = { $in: emps.map((e) => e._id) };
    }

    const [payslips, total] = await Promise.all([
      Payslip.find(where)
        .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
        .sort({ year: -1, month: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Payslip.countDocuments(where),
    ]);

    return { payslips, pagination: paginationMeta(total, page, limit) };
  }, 900);

  res.json(result);
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const runPayroll = async (req: Request, res: Response) => {
  try {
    const companyId = requireCompanyId(req);
    const { month, year, employeeIds } = req.body as { month: number; year: number; employeeIds?: string[] };
    if (!month || !year || month < 1 || month > 12) { res.status(400).json({ message: 'Valid month (1-12) and year are required' }); return; }
    const idempotencyKey = String(req.headers['idempotency-key'] ?? `${year}-${month}`);
    const result = await withTransaction(async (session) => {
      let run = await PayrollRun.findOne({ companyId, month, year }).session(session);
      if (run && run.status === 'Finalized') return { run, created: 0, skipped: 0, skippedEmployeeIds: [] as string[] };
      if (!run) run = await PayrollRun.create([{ companyId, month, year, status: 'Processing', idempotencyKey }], { session }).then(([createdRun]) => createdRun);
      if (!run) throw new Error('Unable to create payroll run');
      const payrollRun = run;
      const empWhere: Record<string, unknown> = { companyId, status: 'Active' };
      if (employeeIds?.length) {
        const selectedIds = [...new Set(employeeIds.map(String))];
        const validObjectIds = selectedIds.filter((id) => mongoose.isValidObjectId(id));
        if (validObjectIds.length !== selectedIds.length) throw new Error('Invalid employee selection');
        empWhere._id = { $in: validObjectIds };
      }
      const employees = await Employee.find(empWhere).session(session).lean();
      if (!employees.length) throw new Error('No active employees found for payroll run');
      if (employeeIds?.length && employees.length !== new Set(employeeIds.map(String)).size) {
        throw new Error('One or more selected employees are not active in this company');
      }
      const ids = employees.map((e) => e._id);
      const [latestSalaries, attendanceAgg, expenseAgg, existingPayslips] = await Promise.all([
        SalaryStructure.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: { $in: ids } } },
          { $match: { $or: [{ effectiveFrom: { $exists: false } }, { effectiveFrom: { $lte: new Date(year, month, 0, 23, 59, 59) } }], $and: [{ $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gte: new Date(year, month - 1, 1) } }] }] } },
          { $sort: { effectiveFrom: -1, createdAt: -1 } }, { $group: { _id: '$employeeId', annualCtc: { $first: '$annualCtc' }, basicAnnual: { $first: '$basicAnnual' }, allowancesAnnual: { $first: '$allowancesAnnual' }, deductionsAnnual: { $first: '$deductionsAnnual' } } },
        ]).session(session),
        Attendance.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: { $in: ids }, date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) }, status: { $in: ['Absent', 'Leave'] } } },
          { $group: { _id: '$employeeId', absentDays: { $sum: { $cond: [{ $in: ['$status', ['Absent', 'Leave']] }, 1, 0] } }, overtimeMinutes: { $sum: { $ifNull: ['$overtimeMinutes', 0] } } } },
        ]).session(session),
        Expense.aggregate([
          { $match: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: { $in: ids }, status: 'Approved', createdAt: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) } } },
          { $group: { _id: '$employeeId', reimbursementAmount: { $sum: '$amount' } } },
        ]).session(session),
        Payslip.find({ companyId, employeeId: { $in: ids }, month, year }).select('employeeId').session(session).lean(),
      ]);
      const salaryMap = new Map(latestSalaries.map((s) => [s._id.toString(), { annualCtc: Number(s.annualCtc ?? 0), basicAnnual: s.basicAnnual, allowancesAnnual: s.allowancesAnnual, deductionsAnnual: s.deductionsAnnual }]));
      const absentMap = new Map(attendanceAgg.map((a) => [a._id.toString(), Number(a.absentDays ?? 0)]));
      const overtimeMap = new Map(attendanceAgg.map((a) => [a._id.toString(), Number(a.overtimeMinutes ?? 0)]));
      const reimbursementMap = new Map(expenseAgg.map((e) => [e._id.toString(), Number(e.reimbursementAmount ?? 0)]));
      const existingSet = new Set(existingPayslips.map((p) => p.employeeId.toString()));
      const skippedEmployeeIds = employees.filter((e) => existingSet.has(e._id.toString())).map((e) => e.employeeId);
      const period = `${MONTH_NAMES[month - 1]} ${year}`;
      const operations = employees.filter((e) => !existingSet.has(e._id.toString())).map((emp) => {
        const salary = salaryMap.get(emp._id.toString());
        const annualCtc = salary?.annualCtc ?? emp.annualCtc ?? 0;
        const monthDays = new Date(year, month, 0).getDate();
        const monthStart = new Date(year, month - 1, 1); const monthEnd = new Date(year, month, 0);
        const employmentStart = emp.joiningDate && new Date(emp.joiningDate) > monthStart ? new Date(emp.joiningDate) : monthStart;
        const employmentEnd = emp.terminatedAt && new Date(emp.terminatedAt) < monthEnd ? new Date(emp.terminatedAt) : monthEnd;
        const payableDays = employmentEnd < employmentStart ? 0 : Math.min(monthDays, Math.floor((employmentEnd.getTime() - employmentStart.getTime()) / 86400000) + 1);
        const overtimeMinutes = overtimeMap.get(emp._id.toString()) ?? 0;
        const reimbursementAmount = reimbursementMap.get(emp._id.toString()) ?? 0;
        const calculated = calculatePayroll({ annualCtc, absentDays: absentMap.get(emp._id.toString()) ?? 0, monthDays, payableDays, overtimeMinutes, reimbursementAmount, basicAnnual: salary?.basicAnnual, allowancesAnnual: salary?.allowancesAnnual, deductionsAnnual: salary?.deductionsAnnual });
        const grossWithAllowance = calculated.grossSalary;
        const absentDays = absentMap.get(emp._id.toString()) ?? 0;
        const totalDeductions = calculated.totalDeductions;
        const netPay = calculated.netPay;
        return { updateOne: { filter: { companyId: new mongoose.Types.ObjectId(companyId), employeeId: emp._id, month, year }, update: { $setOnInsert: { payslipId: `PS-${companyId}-${year}${String(month).padStart(2, '0')}-${emp.employeeId}`, employeeId: emp._id, companyId: new mongoose.Types.ObjectId(companyId), period, month, year, grossSalary: grossWithAllowance, totalDeductions, netPay, status: 'Calculated' as const, paymentStatus: 'UNPAID' as const, payrollRunId: payrollRun._id, snapshot: { annualCtc, absentDays, overtimeMinutes, reimbursementAmount, payableDays, grossWithAllowance, totalDeductions, netPay } } }, upsert: true } };
      });
      if (operations.length) await Payslip.bulkWrite(operations, { session, ordered: true });
      payrollRun.status = 'Approved'; payrollRun.employeeCount = employees.length; await payrollRun.save({ session });
      return { run: payrollRun, created: operations.length, skipped: skippedEmployeeIds.length, skippedEmployeeIds };
    });
    invalidatePrefix(`payroll:payslips:${companyId}`); invalidatePrefix(`payroll:salaries:${companyId}`); invalidate(`ca:dashboard:${companyId}`);
    logActivity(req, `Ran payroll for ${MONTH_NAMES[month - 1]} ${year}: ${result.created} payslips created`, 'Payroll');
    res.status(201).json({ message: `Payroll processed for ${MONTH_NAMES[month - 1]} ${year}`, period: `${MONTH_NAMES[month - 1]} ${year}`, month, year, created: result.created, skipped: result.skipped, skippedEmployeeIds: result.skippedEmployeeIds, runId: result.run._id });
  } catch (err) {
    if (err instanceof Error && err.message === 'No active employees found for payroll run') { res.status(404).json({ message: err.message }); return; }
    if (err instanceof Error && (err.message === 'Invalid employee selection' || err.message === 'One or more selected employees are not active in this company')) { res.status(400).json({ message: err.message, code: 'INVALID_EMPLOYEE_SELECTION' }); return; }
    if ((err as { code?: number })?.code === 11000) { res.status(409).json({ message: 'Payroll for this period is already being processed', code: 'DUPLICATE_PAYROLL_RUN' }); return; }
    throw err;
  }
};

/** Marks one finalized payslip as paid. Payment is deliberately separate from payroll finalization. */
export const markPayslipPaid = async (req: AuthRequest, res: Response) => {
  const companyId = requireCompanyId(req);
  const payslip = await Payslip.findOneAndUpdate(
    { _id: req.params.id, companyId, status: 'Finalized', paymentStatus: { $in: ['UNPAID', 'FAILED'] } },
    { $set: { status: 'Paid', paymentStatus: 'PAID', paidAt: new Date() } },
    { new: true },
  );
  if (!payslip) {
    const existing = await Payslip.findOne({ _id: req.params.id, companyId }).select('status paymentStatus').lean();
    if (!existing) { res.status(404).json({ message: 'Payslip not found' }); return; }
    res.status(409).json({ message: 'Only finalized unpaid payslips can be marked as paid', code: 'INVALID_PAYMENT_TRANSITION' }); return;
  }
  invalidatePrefix(`payroll:payslips:${companyId}`);
  invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Marked payslip ${payslip.payslipId} as paid`, 'Payroll');
  res.json(payslip);
};

export const finalizePayroll = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const run = await PayrollRun.findOne({ _id: req.params.id, companyId });
  if (!run) { res.status(404).json({ message: 'Payroll run not found' }); return; }
  if (run.status === 'Finalized') { res.status(409).json({ message: 'Payroll run is already finalized', code: 'INVALID_TRANSITION' }); return; }
  if (run.status !== 'Approved' && run.status !== 'Processing') { res.status(409).json({ message: `Cannot finalize payroll in ${run.status} state`, code: 'INVALID_TRANSITION' }); return; }
  run.status = 'Finalized';
  await withTransaction(async (session) => {
    run!.status = 'Finalized';
    await run!.save({ session });
    await Payslip.updateMany({ companyId, payrollRunId: run!._id, status: { $in: ['Calculated', 'Approved'] } }, { $set: { status: 'Finalized' } }, { session });
  });
  res.json(run);
};

/** Streams a tenant-safe finalized payslip PDF. */
export const downloadPayslip = async (req: AuthRequest, res: Response) => {
  const companyId = requireCompanyId(req);
  const payslip = await Payslip.findOne({ _id: req.params.id, companyId }).populate({ path: 'employeeId', populate: { path: 'userId', select: 'name email' } }).lean() as any;
  if (!payslip) { res.status(404).json({ message: 'Payslip not found' }); return; }
  const employee = payslip.employeeId;
  if (req.user?.role === 'EMPLOYEE' && employee?.userId?._id?.toString() !== req.user.userId) {
    res.status(403).json({ message: 'You cannot access this payslip' }); return;
  }
  if (!['Finalized', 'Paid'].includes(payslip.status)) {
    res.status(409).json({ message: 'Payslip is not finalized yet', code: 'PAYSLIP_NOT_FINALIZED' }); return;
  }
  const pdf = new PDFDocument({ size: 'A4', margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${payslip.payslipId}.pdf"`);
  pdf.pipe(res);
  pdf.fontSize(20).text('Vook Payslip', { align: 'center' });
  pdf.moveDown().fontSize(11).text(`Payslip ID: ${payslip.payslipId}`);
  pdf.text(`Period: ${payslip.period}`);
  pdf.text(`Employee: ${employee?.userId?.name ?? 'Employee'}`);
  pdf.text(`Employee ID: ${employee?.employeeId ?? ''}`);
  pdf.moveDown().fontSize(13).text('Salary Summary');
  pdf.fontSize(11).text(`Gross salary: ${payslip.grossSalary}`);
  pdf.text(`Deductions: ${payslip.totalDeductions}`);
  pdf.text(`Net pay: ${payslip.netPay}`);
  pdf.text(`Status: ${payslip.status}`);
  pdf.end();
};
