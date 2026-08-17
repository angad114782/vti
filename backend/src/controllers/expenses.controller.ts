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

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    const { status, category, search } = req.query as Record<string, string>;
    const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

    const where: Record<string, unknown> = { companyId };
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    if (search) {
      const users = await User.find({ name: escapeRegex(search) }).select('_id').lean();
      const emps = await Employee.find({
        userId: { $in: users.map((u) => u._id) },
        companyId,
      }).select('_id').lean();
      where.employeeId = { $in: emps.map((e) => e._id) };
    }

    const [expenses, total] = await Promise.all([
      Expense.find(where)
        .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
        .sort({ createdAt: -1 })
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
    const existing = await Expense.findById(id);
    if (!existing) { res.status(404).json({ message: 'Expense not found' }); return; }
    if (!existing.pendingRole || !existing.workflowStep) {
      const state = await buildWorkflowState(req, 'expense');
      existing.pendingRole = state.pendingRole;
      existing.workflowStep = state.workflowStep;
      existing.workflowType = state.workflowType;
      await existing.save();
    }

    const result = await resolveWorkflowUpdate(req, 'expense', existing.workflowStep as number, status);
    if (result.error) { res.status(403).json({ message: result.error }); return; }
    const update = result.update;
    if (!update) { res.status(400).json({ message: 'No workflow update generated' }); return; }

    const expense = await Expense.findByIdAndUpdate(id, update, { new: true });
    const companyId = getCompanyId(req);
    if (companyId) invalidate(`ca:dashboard:${companyId}`);
    logActivity(req, `Expense ${update.status} — ${existing.get('category')} ₹${existing.get('amount')}`, 'Expenses');
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
