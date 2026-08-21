import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Employee from '../models/Employee';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId, getRole, getUserId } from '../utils/authContext';
import { validateId } from '../utils/validate';
import { getCached, invalidate, invalidatePrefix } from '../utils/cache';
import { requireCompanyId } from '../utils/scope';
import Sequence from '../models/Sequence';
import { withTransaction } from '../utils/transaction';
import EmployeeHistory from '../models/EmployeeHistory';
import IdempotencyKey from '../models/IdempotencyKey';
import { resolveEmployeeTransition } from '../utils/workflow';

export const getEmployees = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const privileged = ['HR', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'FINANCE'].includes(getRole(req));
  const listProjection = privileged ? '-accountHolder -bankName -branchName' : '-accountHolder -bankName -branchName -annualCtc';
  const { search, department, status } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const cacheKey = `hr:employees:${companyId}:${JSON.stringify({ search, department, status, page, limit })}`;

  const result = await getCached(cacheKey, async () => {
    const where: Record<string, unknown> = { companyId };
    if (department && department !== 'ALL') where.department = department;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      const re = escapeRegex(search);
      const matchingUsers = await User.find({ $or: [{ nameSearch: re }, { emailSearch: re }] }).select('_id').lean();
      where.$or = [
        { userId: { $in: matchingUsers.map((u) => u._id) } },
        { employeeIdSearch: re },
        { designationSearch: re },
        { departmentSearch: re },
      ];
    }

    const [employees, filteredTotal, total, active] = await Promise.all([
      Employee.find(where)
        .select(listProjection)
        .populate('userId', 'id name email role')
        .sort({ createdAt: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(where),
      Employee.countDocuments({ companyId }),
      Employee.countDocuments({ companyId, status: 'Active' }),
    ]);

    const deptAgg = companyId ? await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$department' } },
    ]) : [];

    return {
      employees,
      pagination: paginationMeta(filteredTotal, page, limit),
      stats: { total, active, inactive: total - active, departments: deptAgg.length },
    };
  }, 300);

  res.json(result);
};

export const getEmployee = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  validateId(id);
  const companyId = requireCompanyId(req);
  const privileged = ['HR', 'COMPANY_ADMIN', 'SUPER_ADMIN', 'FINANCE'].includes(getRole(req));
  const projection = privileged ? undefined : '-accountHolder -bankName -branchName -annualCtc';
  const emp = await Employee.findOne({ _id: id, companyId }).select(projection ?? '').populate('userId', 'name email avatar role');
  if (!emp) { res.status(404).json({ message: 'Employee not found' }); return; }
  res.json(emp);
};

export const createEmployee = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const { name, department, designation, shiftType, shiftTiming, joiningDate, annualCtc, employmentType, bankName, branchName, accountHolder, managerId } = req.body as Record<string, string>;
  const email = String((req.body as Record<string, unknown>).email ?? '').trim().toLowerCase();

  if (!name || !email) { res.status(400).json({ message: 'Name and email required' }); return; }
  if (managerId) {
    const manager = await Employee.findOne({ _id: managerId, companyId }).select('_id').lean();
    if (!manager) { res.status(400).json({ message: 'Manager must belong to this company' }); return; }
  }

  const idempotencyKey = req.get('Idempotency-Key')?.trim();
  const operation = 'create-employee';
  const requestHash = crypto.createHash('sha256').update(JSON.stringify({
    name, email, department, designation, shiftType, shiftTiming, joiningDate, annualCtc, employmentType, bankName, branchName, accountHolder,
  })).digest('hex');
  let idempotencyRecord;
  if (idempotencyKey) {
    if (idempotencyKey.length > 200) { res.status(400).json({ message: 'Idempotency-Key is too long' }); return; }
    idempotencyRecord = await IdempotencyKey.findOne({ companyId, operation, key: idempotencyKey });
    if (idempotencyRecord) {
      if (idempotencyRecord.requestHash !== requestHash) {
        res.status(409).json({ message: 'Idempotency key was already used with a different request', code: 'IDEMPOTENCY_KEY_REUSED' });
        return;
      }
      if (idempotencyRecord.status === 'Completed' && idempotencyRecord.responseBody) {
        res.status(201).json(idempotencyRecord.responseBody);
        return;
      }
      res.status(409).json({ message: 'Employee creation is already in progress', code: 'DUPLICATE_OPERATION' });
      return;
    }
    try {
      idempotencyRecord = await IdempotencyKey.create({ companyId, operation, key: idempotencyKey, requestHash });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const existingRecord = await IdempotencyKey.findOne({ companyId, operation, key: idempotencyKey });
      if (existingRecord?.requestHash !== requestHash) {
        res.status(409).json({ message: 'Idempotency key was already used with a different request', code: 'IDEMPOTENCY_KEY_REUSED' });
        return;
      }
      if (existingRecord?.status === 'Completed' && existingRecord.responseBody) {
        res.status(201).json(existingRecord.responseBody);
        return;
      }
      res.status(409).json({ message: 'Employee creation is already in progress', code: 'DUPLICATE_OPERATION' });
      return;
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (idempotencyRecord) await IdempotencyKey.deleteOne({ _id: idempotencyRecord._id });
    res.status(409).json({ message: 'A user with this email already exists' });
    return;
  }

  const employeeId = await Sequence.findOneAndUpdate(
    { companyId, key: 'employee' },
    { $inc: { value: 1 }, $setOnInsert: { companyId, key: 'employee' } },
    { upsert: true, returnDocument: 'after' }
  ).then((sequence) => `EMP${String(sequence.value).padStart(3, '0')}`);
  const generatedPassword = crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  const { user, emp } = await withTransaction(async (session) => {
    const [createdUsers] = await User.create([{ email, password: hashedPassword, name, role: 'EMPLOYEE', companyId }], { session });
    const [createdEmployees] = await Employee.create([{
      employeeId, userId: createdUsers._id, companyId, department, designation, shiftType, shiftTiming,
      managerId: managerId || undefined,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      annualCtc: annualCtc ? parseFloat(annualCtc) : null,
      employmentType: employmentType ?? 'Permanent', bankName, branchName, accountHolder,
    }], { session });
    await EmployeeHistory.create([{
      companyId,
      employeeId: createdEmployees._id,
      actorId: getUserId(req),
      effectiveFrom: joiningDate ? new Date(joiningDate) : new Date(),
      changes: { created: true },
      snapshot: {
        department, designation, managerId: managerId || null, annualCtc: annualCtc ? parseFloat(annualCtc) : null,
        employmentType: employmentType ?? 'Permanent', status: 'Active',
      },
    }], { session });
    return { user: createdUsers, emp: createdEmployees };
  });

  const populated = await Employee.findById(emp._id).populate('userId', 'id name email role');
  invalidatePrefix(`hr:employees:${companyId}`);
  invalidatePrefix(`ca:departments:${companyId}`);
  invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Created employee ${name} (${employeeId})`, 'Employees');
  const responseBody = { ...((populated as any)?.toObject() ?? populated), generatedPassword };
  if (idempotencyRecord) {
    await IdempotencyKey.updateOne({ _id: idempotencyRecord._id }, { $set: { status: 'Completed', employeeId: emp._id, responseBody } });
  }
  res.status(201).json(responseBody);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const id = req.params.id as string;
  validateId(id);
  const { department, designation, shiftType, shiftTiming, annualCtc, status, bankName, branchName, accountHolder, managerId } = req.body as Record<string, string>;

  const target = await Employee.findOne({ _id: id, companyId }).lean();
  if (!target) { res.status(404).json({ message: 'Employee not found' }); return; }
  if (target.companyId?.toString() !== companyId) { res.status(403).json({ message: 'Forbidden' }); return; }
  if (managerId) {
    if (managerId === id) { res.status(400).json({ message: 'Employee cannot manage themselves' }); return; }
    const manager = await Employee.findOne({ _id: managerId, companyId }).select('_id').lean();
    if (!manager) { res.status(400).json({ message: 'Manager must belong to this company' }); return; }
  }
  if (status) {
    const transition = resolveEmployeeTransition(target.status, status);
    if (!transition.valid) { res.status(409).json({ message: transition.error, code: 'INVALID_TRANSITION' }); return; }
  }

  const update: Record<string, unknown> = {};
  if (department !== undefined) update.department = department;
  if (designation !== undefined) update.designation = designation;
  if (shiftType !== undefined) update.shiftType = shiftType;
  if (shiftTiming !== undefined) update.shiftTiming = shiftTiming;
  if (annualCtc !== undefined) update.annualCtc = parseFloat(annualCtc);
  if (status !== undefined) update.status = status;
  if (bankName !== undefined) update.bankName = bankName;
  if (branchName !== undefined) update.branchName = branchName;
  if (accountHolder !== undefined) update.accountHolder = accountHolder;
  if (managerId !== undefined) update.managerId = managerId || null;

  const expectedVersion = Number((req.body as Record<string, unknown>).version ?? target.version ?? 0);
  const emp = await withTransaction(async (session) => {
    const updated = await Employee.findOneAndUpdate(
      { _id: id, companyId, version: expectedVersion },
      { $set: update, $inc: { version: 1 } },
      { returnDocument: 'after', session }
    );
    if (!updated) return null;
    const changes: Record<string, { before: unknown; after: unknown }> = {};
    for (const field of Object.keys(update)) {
      const before = (target as Record<string, unknown>)[field];
      const after = (updated as unknown as Record<string, unknown>)[field];
      if (String(before ?? '') !== String(after ?? '')) changes[field] = { before, after };
    }
    if (Object.keys(changes).length) {
      const effectiveFrom = new Date();
      await EmployeeHistory.updateOne(
        { companyId, employeeId: updated._id, effectiveTo: null },
        { $set: { effectiveTo: effectiveFrom } },
        { session }
      );
      await EmployeeHistory.create([{
        companyId,
        employeeId: updated._id,
        actorId: getUserId(req),
        effectiveFrom,
        changes,
        snapshot: {
          department: updated.department,
          designation: updated.designation,
          managerId: updated.managerId,
          annualCtc: updated.annualCtc,
          status: updated.status,
        },
      }], { session });
    }
    return updated;
  });
  if (!emp) { res.status(409).json({ message: 'Employee was changed by another user', code: 'VERSION_CONFLICT' }); return; }
  await emp.populate('userId', 'id name email');
  const empName = (emp as any)?.userId?.name ?? target.employeeId;
  invalidatePrefix(`hr:employees:${companyId}`);
  invalidatePrefix(`ca:departments:${companyId}`);
  invalidate(`ca:dashboard:${companyId}`);
  logActivity(req, `Updated employee ${empName}`, 'Employees');
  res.json(emp);
};

export const employeeAction = async (req: Request, res: Response) => {
  const action = (req.body as { action: string }).action;
  const statusByAction: Record<string, string> = {
    start_onboarding: 'Onboarding', activate: 'Active', start_notice: 'NoticePeriod', terminate: 'Terminated', archive: 'Archived',
  };
  const requestedStatus = statusByAction[action];
  if (!requestedStatus) { res.status(400).json({ message: 'Unsupported employee action' }); return; }
  const companyId = requireCompanyId(req);
  const employee = await Employee.findOne({ _id: req.params.id, companyId }).select('status').lean();
  if (!employee) { res.status(404).json({ message: 'Employee not found' }); return; }
  const transition = resolveEmployeeTransition(employee.status, requestedStatus);
  if (!transition.valid) { res.status(409).json({ message: transition.error, code: 'INVALID_TRANSITION' }); return; }
  req.body = { ...req.body, status: requestedStatus };
  return updateEmployee(req, res);
};

export const getEmployeeHistory = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const id = req.params.id as string;
  validateId(id);
  const employee = await Employee.findOne({ _id: id, companyId }).select('_id').lean();
  if (!employee) { res.status(404).json({ message: 'Employee not found' }); return; }
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
  const where = { companyId, employeeId: employee._id };
  const [history, total] = await Promise.all([
    EmployeeHistory.find(where).sort({ effectiveFrom: -1, _id: -1 }).skip(skip).limit(limit).populate('actorId', 'name email').lean(),
    EmployeeHistory.countDocuments(where),
  ]);
  res.json({ history, pagination: paginationMeta(total, page, limit) });
};

export const getDepartments = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  if (!companyId) { res.json([]); return; }
  const result = await getCached(`ca:departments:${companyId}`, async () => {
    const depts = await Employee.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
    ]);
    return depts.map((d: { _id: string; count: number }) => ({ name: d._id, count: d.count }));
  }, 900);
  res.json(result);
};
