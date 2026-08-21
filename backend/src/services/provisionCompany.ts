import mongoose, { ClientSession } from 'mongoose';
import Company from '../models/Company';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';
import { nextCompanyCode } from '../utils/companyCode';

export async function provisionCompany(input: { company: any; admin: { name: string; email: string; passwordHash: string }; plan: any; expiry: Date; adminActive?: boolean }, session: ClientSession) {
  const companyCode = await nextCompanyCode();
  const [company] = await Company.create([{ companyCode, ...input.company, plan: input.plan.type, status: 'ACTIVE', maxUsers: input.plan.maxUsers, planExpiry: input.expiry }], { session });
  const [subscription] = await Subscription.create([{ companyId: company._id, planId: input.plan._id, plan: input.plan.type, billingCycle: 'Monthly', amount: input.plan.price, startDate: new Date(), endDate: input.expiry, isActive: true }], { session });
  const modules = await Module.find({ availableFor: input.plan.type }).select('_id').session(session).lean();
  if (modules.length) await CompanyModule.insertMany(modules.map((m) => ({ companyId: company._id, moduleId: m._id, isEnabled: true })), { session });
  const [user] = await User.create([{ name: input.admin.name, email: input.admin.email, password: input.admin.passwordHash, role: 'COMPANY_ADMIN', companyId: company._id, isActive: input.adminActive ?? true }], { session });
  return { company, subscription, user };
}
