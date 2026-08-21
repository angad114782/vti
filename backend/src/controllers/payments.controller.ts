import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Subscription from '../models/Subscription';
import { clampLimit } from '../utils/query';
import { logActivity } from '../utils/activity';

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { source, status, plan, companyId, page = '1' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (source && source !== 'ALL') where.source = source;
    if (status && status !== 'ALL') where.status = status;
    if (plan && plan !== 'ALL') where.plan = plan;
    if (companyId) where.companyId = companyId;
    const limit = clampLimit(req.query.limit as string | undefined, 10);
    const skip = (Math.max(1, Number(page)) - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('companyId', 'name companyCode').lean(),
      Payment.countDocuments(where),
    ]);
    res.json({ payments: payments.map((payment: any) => ({ ...payment, company: payment.companyId && typeof payment.companyId === 'object' ? payment.companyId : undefined })), pagination: { total, page: Number(page), limit, totalPages: Math.ceil(total / limit) } });
  } catch { res.status(500).json({ message: 'Internal server error' }); }
};

export const createOfflinePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, subscriptionId, plan, billingCycle = 'Monthly', amount, status = 'PENDING', paidAt, reference, notes } = req.body;
    const subscription = subscriptionId ? await Subscription.findById(subscriptionId) : await Subscription.findOne({ companyId });
    if (!subscription) { res.status(404).json({ message: 'Subscription not found' }); return; }
    const payment = await Payment.create({ companyId, subscriptionId: subscription._id, source: 'OFFLINE', plan: plan ?? subscription.plan, billingCycle, amount: amount ?? subscription.amount, status, paidAt: status === 'PAID' ? (paidAt ? new Date(paidAt) : new Date()) : undefined, reference, notes });
    logActivity(req, `Recorded offline payment as ${status}`, 'Payments');
    res.status(201).json(payment);
  } catch (err: any) { res.status(err?.code === 11000 ? 409 : 500).json({ message: err?.code === 11000 ? 'Payment reference already exists' : 'Internal server error' }); }
};

export const updatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status, paidAt, reference, notes } = req.body;
    const update: any = { ...(status ? { status } : {}), ...(reference !== undefined ? { reference } : {}), ...(notes !== undefined ? { notes } : {}) };
    if (status === 'PAID') update.paidAt = paidAt ? new Date(paidAt) : new Date();
    const payment = await Payment.findOneAndUpdate({ _id: id, source: 'OFFLINE' }, update, { returnDocument: 'after' });
    if (!payment) { res.status(404).json({ message: 'Offline payment not found' }); return; }
    logActivity(req, `Updated offline payment to ${payment.get('status')}`, 'Payments');
    res.json(payment);
  } catch { res.status(500).json({ message: 'Internal server error' }); }
};

export const getMyPayments = async (req: any, res: Response): Promise<void> => {
  try { res.json(await Payment.find({ companyId: req.user.companyId }).sort({ createdAt: -1 }).lean()); }
  catch { res.status(500).json({ message: 'Internal server error' }); }
};
