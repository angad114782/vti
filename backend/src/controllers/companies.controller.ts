import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Company from '../models/Company';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Plan from '../models/Plan';
import { escapeRegex, clampLimit } from '../utils/query';
import { logActivity } from '../utils/activity';
import { synchronizeCompanySubscription, synchronizeAllCompanySubscriptions } from '../utils/subscriptionAccess';
import { getCompanyReference } from '../utils/companyReference';
import { nextCompanyCode } from '../utils/companyCode';
import { withTransaction } from '../utils/transaction';
import RefreshToken from '../models/RefreshToken';
import Payment from '../models/Payment';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    await synchronizeAllCompanySubscriptions();
    const { search, plan, status, page = '1' } = req.query as Record<string, string>;
    const limit = clampLimit(req.query.limit as string | undefined);
    const skip = (parseInt(page) - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (search) {
      const re = escapeRegex(search);
      where.$or = [
        { $or: [{ name: re }, { nameSearch: re }] },
        { companyCode: re },
        { $or: [{ email: re }, { emailSearch: re }] },
        { industry: re },
      ];
    }
    if (plan && plan !== 'ALL') where.plan = plan;
    if (status && status !== 'ALL') where.status = status;

    const [companies, total] = await Promise.all([
      Company.find(where).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Company.countDocuments(where),
    ]);

    const syncedCompanies = await Promise.all(companies.map((company) => synchronizeCompanySubscription(company._id.toString())));

    const userCounts = await User.aggregate([
      { $match: { companyId: { $in: companies.map((c) => c._id) } } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    userCounts.forEach((u) => { countMap[u._id.toString()] = u.count; });

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const notDeleted = { isDeleted: { $ne: true } };
    const [totalCount, activeCount, trialCount, expiringCount] = await Promise.all([
      Company.countDocuments(notDeleted),
      Company.countDocuments({ ...notDeleted, status: 'ACTIVE' }),
      Company.countDocuments({ ...notDeleted, status: 'TRIAL' }),
      Company.countDocuments({ ...notDeleted, planExpiry: { $lte: in30, $gte: now } }),
    ]);

    res.json({
      companies: syncedCompanies.map((c) => ({ ...c, id: c!._id.toString(), companyCode: getCompanyReference(c!._id, (c as any).companyCode), _id: undefined, userCount: countMap[c!._id.toString()] ?? 0 })),
      pagination: { total, page: parseInt(page), limit, totalPages: Math.ceil(total / limit) },
      stats: { total: totalCount, active: activeCount, trial: trialCount, expiringSoon: expiringCount },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await synchronizeCompanySubscription(id);
    const company = await Company.findById(id).lean();
    if (!company || (company as any).isDeleted) { res.status(404).json({ message: 'Company not found' }); return; }

    const [userCount, subscription, modules] = await Promise.all([
      User.countDocuments({ companyId: company._id }),
      Subscription.findOne({ companyId: company._id }).lean(),
      CompanyModule.find({ companyId: company._id }).populate('moduleId').lean(),
    ]);

    res.json({
      ...company,
      id: company._id.toString(),
      _id: undefined,
      _count: { users: userCount },
      subscription,
      modules,
    });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, industry, email, phone, address, timezone, plan, status, maxUsers, planExpiry,
      adminName, adminEmail, adminPassword, paymentStatus, paymentReference, paymentNotes, paymentDate,
    } = req.body as Record<string, string>;

    if (!name)       { res.status(400).json({ message: 'Company name is required' }); return; }
    if (!adminName)  { res.status(400).json({ message: 'Admin name is required' }); return; }
    if (!adminEmail) { res.status(400).json({ message: 'Admin email is required' }); return; }

    const normalizedAdminEmail = normalizeEmail(adminEmail);
    const existing = await User.findOne({ email: normalizedAdminEmail }).lean();
    if (existing) { res.status(409).json({ message: 'A user with this admin email already exists' }); return; }

    const planType = (plan ?? 'BASIC').toUpperCase();
    const planData = await Plan.findOne({ type: planType, isActive: true }).lean();
    if (!planData) { res.status(400).json({ message: 'Selected plan is not available' }); return; }
    const expiry = planExpiry ? new Date(planExpiry) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const companyId = new mongoose.Types.ObjectId();
    const companyCode = await nextCompanyCode();
    let adminGeneratedPassword: string | undefined;
    const company = await withTransaction(async (session) => {
      const [createdCompany] = await Company.create([{
        _id: companyId,
        companyCode,
        name: name.trim(), industry, email: email ? normalizeEmail(email) : email, phone, address, timezone,
        plan: planType,
        status: (status ?? 'TRIAL') as any,
        maxUsers: planData.maxUsers,
        planExpiry: expiry,
      }], { session });
      await Subscription.create([{ companyId: createdCompany._id, planId: planData._id, plan: planType, amount: planData.price, startDate: new Date(), endDate: expiry, isActive: true }], { session });
      const eligibleModules = await Module.find({ availableFor: planType }).select('_id').session(session).lean();
      if (eligibleModules.length) {
        await CompanyModule.insertMany(eligibleModules.map((module) => ({ companyId: createdCompany._id, moduleId: module._id, isEnabled: true })), { ordered: false, session });
      }
      const rawPassword = adminPassword ?? (() => {
        adminGeneratedPassword = crypto.randomBytes(12).toString('base64url');
        return adminGeneratedPassword;
      })();
      const hashed = await bcrypt.hash(rawPassword, 12);
      await User.create([{ name: adminName.trim(), email: normalizedAdminEmail, password: hashed, role: 'COMPANY_ADMIN', companyId: createdCompany._id, isActive: true }], { session });
      return createdCompany;
    });

    logActivity(req, `Created company "${name}"`, 'Companies');
    if (paymentStatus) {
      const subscription = await Subscription.findOne({ companyId: company._id }).lean();
      await Payment.create({ companyId: company._id, subscriptionId: subscription?._id, source: 'OFFLINE', status: paymentStatus as any, plan: planType, billingCycle: 'Monthly', amount: planData.price, paidAt: paymentStatus === 'PAID' ? (paymentDate ? new Date(paymentDate) : new Date()) : undefined, reference: paymentReference, notes: paymentNotes });
      logActivity(req, `Recorded offline payment as ${paymentStatus}`, 'Payments');
    }
    res.status(201).json({
      ...company.toObject(), id: company._id.toString(), companyCode: getCompanyReference(company._id, company.companyCode),
      adminEmail: normalizedAdminEmail,
      ...(adminGeneratedPassword ? { adminGeneratedPassword } : {}),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name, industry, email, phone, address, timezone, plan, status, planExpiry } = req.body as Record<string, string>;

    const update: Record<string, any> = {};
    if (name) update.name = name;
    if (industry !== undefined) update.industry = industry;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (timezone !== undefined) update.timezone = timezone;
    let selectedPlan: Awaited<ReturnType<typeof Plan.findOne>> = null;
    if (plan) {
      selectedPlan = await Plan.findOne({ type: plan.toUpperCase(), isActive: true });
      if (!selectedPlan) { res.status(400).json({ message: 'Selected plan is not available' }); return; }
      update.plan = selectedPlan.type;
      update.maxUsers = selectedPlan.maxUsers;
    }
    if (status) update.status = status;
    if (planExpiry) update.planExpiry = new Date(planExpiry);

    const company = await Company.findByIdAndUpdate(id, update, { returnDocument: 'after' });
    if (!company) { res.status(404).json({ message: 'Company not found' }); return; }
    if (selectedPlan) {
      await Subscription.findOneAndUpdate(
        { companyId: id },
        { $set: { planId: selectedPlan._id, plan: selectedPlan.type, amount: selectedPlan.price, endDate: company.planExpiry ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true }, $setOnInsert: { companyId: id, startDate: new Date() } },
        { upsert: true, returnDocument: 'after' },
      );
      const eligibleModules = await Module.find({ availableFor: selectedPlan.type }).select('_id').lean();
      if (eligibleModules.length) await CompanyModule.bulkWrite(eligibleModules.map((module) => ({ updateOne: { filter: { companyId: id, moduleId: module._id }, update: { $setOnInsert: { companyId: id, moduleId: module._id, isEnabled: true } }, upsert: true } })) as any);
    }
    logActivity(req, `Updated company "${(company as any)?.name ?? id}"`, 'Companies');
    res.json(company);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const company = await Company.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date(), status: 'SUSPENDED' },
      { returnDocument: 'after' },
    );
    if (!company) { res.status(404).json({ message: 'Company not found' }); return; }
    await Subscription.findOneAndUpdate({ companyId: id }, { isActive: false });
    await User.updateMany({ companyId: id }, { $set: { isActive: false }, $inc: { sessionVersion: 1 } });
    await RefreshToken.deleteMany({ userId: { $in: await User.find({ companyId: id }).distinct('_id') } });
    logActivity(req, `Archived company "${(company as any)?.name ?? id}"`, 'Companies');
    res.json({ message: 'Company archived successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
