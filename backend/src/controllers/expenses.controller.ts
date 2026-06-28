import { Response } from 'express';
import Expense from '../models/Expense';
import Employee from '../models/Employee';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    const { status, category, search, page = '1', limit = '20' } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    if (search) {
      const users = await User.find({ name: new RegExp(search, 'i') }).select('_id').lean();
      const emps = await Employee.find({
        userId: { $in: users.map((u) => u._id) },
        ...(companyId ? { companyId } : {}),
      }).select('_id').lean();
      where.employeeId = { $in: emps.map((e) => e._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(where)
        .populate({ path: 'employeeId', populate: { path: 'userId', select: 'name' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(where),
    ]);

    const statsWhere = companyId ? { companyId } : {};
    const [pending, approved, rejected] = await Promise.all([
      Expense.countDocuments({ ...statsWhere, status: 'Pending' }),
      Expense.countDocuments({ ...statsWhere, status: 'Approved' }),
      Expense.countDocuments({ ...statsWhere, status: 'Rejected' }),
    ]);

    res.json({ expenses, total, page: parseInt(page), stats: { pending, approved, rejected } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const expense = await Expense.findByIdAndUpdate(id, { status }, { new: true });
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
