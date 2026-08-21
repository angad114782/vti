import { Request, Response, NextFunction } from 'express';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth.middleware';

export type SubscriptionState = 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED' | 'UNKNOWN';

export interface SubscriptionStatus {
  state: SubscriptionState;
  plan: string | null;
  planExpiry: string | null;
  gracePeriodEnd: string | null;
  daysRemaining: number | null;
  readOnly: boolean;
}

export function getSubscriptionStatus(company: { status?: string; plan?: string; planExpiry?: Date | string | null }): SubscriptionStatus {
  if (company.status === 'SUSPENDED') return { state: 'SUSPENDED', plan: company.plan ?? null, planExpiry: toIso(company.planExpiry), gracePeriodEnd: null, daysRemaining: 0, readOnly: true };
  if (company.status === 'EXPIRED') {
    const expiry = company.planExpiry ? new Date(company.planExpiry) : null;
    const graceEnd = expiry ? new Date(expiry.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    return { state: 'EXPIRED', plan: company.plan ?? null, planExpiry: toIso(company.planExpiry), gracePeriodEnd: graceEnd?.toISOString() ?? null, daysRemaining: 0, readOnly: true };
  }
  if (!company.planExpiry) return { state: 'UNKNOWN', plan: company.plan ?? null, planExpiry: null, gracePeriodEnd: null, daysRemaining: null, readOnly: false };

  const expiry = new Date(company.planExpiry);
  const graceEnd = new Date(expiry.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000));
  if (now < expiry) return { state: 'ACTIVE', plan: company.plan ?? null, planExpiry: expiry.toISOString(), gracePeriodEnd: graceEnd.toISOString(), daysRemaining, readOnly: false };
  if (now < graceEnd) return { state: 'GRACE_PERIOD', plan: company.plan ?? null, planExpiry: expiry.toISOString(), gracePeriodEnd: graceEnd.toISOString(), daysRemaining: Math.max(0, Math.ceil((graceEnd.getTime() - now.getTime()) / 86400000)), readOnly: true };
  return { state: 'EXPIRED', plan: company.plan ?? null, planExpiry: expiry.toISOString(), gracePeriodEnd: graceEnd.toISOString(), daysRemaining: 0, readOnly: true };
}

/** Persists the date-derived state so admin lists and access checks stay consistent. */
export async function synchronizeCompanySubscription(companyId: string) {
  const company = await Company.findById(companyId).lean();
  if (!company) return null;
  const subscription = getSubscriptionStatus(company);
  const nextStatus = subscription.state === 'GRACE_PERIOD' ? 'GRACE_PERIOD' : subscription.state === 'EXPIRED' ? 'EXPIRED' : subscription.state === 'ACTIVE' && company.status === 'GRACE_PERIOD' ? 'ACTIVE' : null;
  if (nextStatus && company.status !== nextStatus) {
    await Company.updateOne({ _id: companyId }, { $set: { status: nextStatus } });
    return { ...company, status: nextStatus };
  }
  return company;
}

/** Bulk sync used by Super Admin company listings so status filters see current states. */
export async function synchronizeAllCompanySubscriptions() {
  const now = new Date();
  const graceCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  await Promise.all([
    Company.updateMany(
      { isDeleted: { $ne: true }, status: { $in: ['ACTIVE', 'TRIAL'] }, planExpiry: { $lte: now, $gt: graceCutoff } },
      { $set: { status: 'GRACE_PERIOD' } },
    ),
    Company.updateMany(
      { isDeleted: { $ne: true }, status: { $in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }, planExpiry: { $lte: graceCutoff } },
      { $set: { status: 'EXPIRED' } },
    ),
    Company.updateMany(
      { isDeleted: { $ne: true }, status: 'GRACE_PERIOD', planExpiry: { $gt: now } },
      { $set: { status: 'ACTIVE' } },
    ),
  ]);
}

function toIso(value?: Date | string | null): string | null { return value ? new Date(value).toISOString() : null; }

export const requireSubscriptionAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const user = (req as AuthRequest).user;
  if (!user?.companyId || user.role === 'SUPER_ADMIN') { next(); return; }
  const company = await synchronizeCompanySubscription(user.companyId);
  if (!company) { res.status(403).json({ message: 'Company account not found', code: 'COMPANY_NOT_FOUND' }); return; }
  const subscription = getSubscriptionStatus(company);
  if (subscription.state === 'SUSPENDED' || subscription.state === 'EXPIRED') {
    res.status(403).json({ message: 'Subscription expired. Please renew your plan.', code: 'SUBSCRIPTION_EXPIRED', subscription });
    return;
  }
  if (subscription.state === 'GRACE_PERIOD' && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    res.status(403).json({ message: 'Subscription is in the grace period. Account changes are read-only until renewal.', code: 'SUBSCRIPTION_READ_ONLY', subscription });
    return;
  }
  next();
};
