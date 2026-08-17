import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Company from '../models/Company';
import User from '../models/User';
import Subscription from '../models/Subscription';
import CompanyModule from '../models/CompanyModule';
import { escapeRegex, clampLimit } from '../utils/query';
import { logActivity } from '../utils/activity';

export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, plan, status, page = '1' } = req.query as Record<string, string>;
    const limit = clampLimit(req.query.limit as string | undefined);
    const skip = (parseInt(page) - 1) * limit;

    const where: Record<string, unknown> = { isDeleted: { $ne: true } };
    if (search) {
      const re = escapeRegex(search);
      where.$or = [
        { name: re },
        { email: re },
        { industry: re },
      ];
    }
    if (plan && plan !== 'ALL') where.plan = plan;
    if (status && status !== 'ALL') where.status = status;

    const [companies, total] = await Promise.all([
      Company.find(where).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Company.countDocuments(where),
    ]);

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
      companies: companies.map((c) => ({ ...c, id: c._id.toString(), _id: undefined, userCount: countMap[c._id.toString()] ?? 0 })),
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
      name, industry, email, phone, address, plan, status, maxUsers, planExpiry,
      adminName, adminEmail, adminPassword,
    } = req.body as Record<string, string>;

    if (!name)       { res.status(400).json({ message: 'Company name is required' }); return; }
    if (!adminName)  { res.status(400).json({ message: 'Admin name is required' }); return; }
    if (!adminEmail) { res.status(400).json({ message: 'Admin email is required' }); return; }

    const existing = await User.findOne({ email: adminEmail }).lean();
    if (existing) { res.status(409).json({ message: 'A user with this admin email already exists' }); return; }

    const company = await Company.create({
      name, industry, email, phone, address,
      plan: (plan ?? 'BASIC') as any,
      status: (status ?? 'TRIAL') as any,
      maxUsers: maxUsers ? parseInt(maxUsers) : 100,
      planExpiry: planExpiry ? new Date(planExpiry) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    let adminGeneratedPassword: string | undefined;
    try {
      const rawPassword = adminPassword ?? (() => {
        adminGeneratedPassword = crypto.randomBytes(12).toString('base64url');
        return adminGeneratedPassword;
      })();
      const hashed = await bcrypt.hash(rawPassword, 10);
      await User.create({
        name: adminName, email: adminEmail, password: hashed,
        role: 'COMPANY_ADMIN', companyId: company._id, isActive: true,
      });
    } catch (userErr) {
      await Company.findByIdAndDelete(company._id);
      console.error('Failed to create admin user, rolled back company:', userErr);
      res.status(500).json({ message: 'Failed to create admin user. Company creation rolled back.' });
      return;
    }

    logActivity(req, `Created company "${name}"`, 'Companies');
    res.status(201).json({
      ...company.toObject(), id: company._id.toString(),
      adminEmail,
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
    const { name, industry, email, phone, address, plan, status, maxUsers, planExpiry } = req.body as Record<string, string>;

    const update: Record<string, any> = {};
    if (name) update.name = name;
    if (industry !== undefined) update.industry = industry;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (address !== undefined) update.address = address;
    if (plan) update.plan = plan;
    if (status) update.status = status;
    if (maxUsers !== undefined) update.maxUsers = parseInt(maxUsers);
    if (planExpiry) update.planExpiry = new Date(planExpiry);

    const company = await Company.findByIdAndUpdate(id, update, { new: true });
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
      { new: true },
    );
    if (!company) { res.status(404).json({ message: 'Company not found' }); return; }
    await Subscription.findOneAndUpdate({ companyId: id }, { isActive: false });
    logActivity(req, `Archived company "${(company as any)?.name ?? id}"`, 'Companies');
    res.json({ message: 'Company archived successfully' });
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
};
