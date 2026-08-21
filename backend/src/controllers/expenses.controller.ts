import { Request, Response } from 'express';
import Expense from '../models/Expense';
import Employee from '../models/Employee';
import User from '../models/User';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { buildWorkflowState, resolveWorkflowUpdate } from '../utils/workflow';
import { getCompanyId } from '../utils/authContext';
import { validateId } from '../utils/validate';
import { invalidate } from '../utils/cache';
import { requireCompanyId } from '../utils/scope';

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    const { status, category, search } = req.query as Record<string, string>;
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

    const where: Record<string, unknown> = { companyId };
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    if (search) {
      const users = await User.find({ $or: [{ nameSearch: escapeRegex(search) }, { emailSearch: escapeRegex(search) }] }).select('_id').lean();
      const emps = await Employee.find({
        userId: { $in: users.map((u) => u._id) },
        companyId,
      }).select('_id').lean();
      where.employeeId = { $in: emps.map((e) => e._id) };
    }

    const [expenses, total] = await Promise.all([
      Expense.find(where)
        .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(where),
    ]);

    const statsWhere = { companyId };
    const [pending, approved, rejected] = await Promise.all([
      Expense.countDocuments({ ...statsWhere, status: 'Pending' }),
      Expense.countDocuments({ ...statsWhere, status: 'Approved' }),
      Expense.countDocuments({ ...statsWhere, status: 'Rejected' }),
    ]);

    res.json({ expenses, pagination: paginationMeta(total, page, limit), stats: { pending, approved, rejected } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    validateId(id);
    const { status } = req.body as { status: string };
    const companyId = requireCompanyId(req);
    const existing = await Expense.findOne({ _id: id, companyId });
    if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
    if (!existing.pendingRole || !existing.workflowStep) {
      const state = await buildWorkflowState(req, 'expense');
      existing.pendingRole = state.pendingRole;
      existing.workflowStep = state.workflowStep;
      existing.workflowType = state.workflowType;
      await existing.save();
    }

    if (existing.requesterUserId?.toString() === (req as any).user?.userId) {
      res.status(403).json({ message: 'A requester cannot approve or reject their own expense' });
      return;
    }
    const snapshot = existing.workflowSnapshot as any;
    const result = await resolveWorkflowUpdate(req, 'expense', existing.workflowStep as number, status, snapshot, existing.delegatedTo?.toString());
    if (result.error) { res.status(403).json({ message: result.error }); return; }
    const update = result.update;
    if (!update) { res.status(400).json({ message: 'No workflow update generated' }); return; }

    const expectedVersion = Number((req.body as Record<string, unknown>).version ?? existing.version ?? 0);
  const expense = await Expense.findOneAndUpdate({ _id: id, companyId, version: expectedVersion, status: 'Pending' }, { $set: update, $inc: { version: 1 } }, { returnDocument: 'after' });
    if (!expense) { res.status(409).json({ message: 'Expense was already processed or changed', code: 'VERSION_CONFLICT' }); return; }
    if (companyId) invalidate(`ca:dashboard:${companyId}`);
    logActivity(req, `Expense ${update.status} — ${existing.get('category')} ₹${existing.get('amount')}`, 'Expenses');
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
