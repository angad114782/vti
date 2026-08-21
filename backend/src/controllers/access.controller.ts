import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RolePermission from '../models/RolePermission';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';
import { DEFAULT_PERMISSIONS } from '../config/access';
import Company from '../models/Company';
import { getSubscriptionStatus, synchronizeCompanySubscription } from '../utils/subscriptionAccess';

export const getMyAccess = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  const modules = await Module.find().select('name').lean();
  const company = user.companyId ? await synchronizeCompanySubscription(user.companyId) : null;
  const subscription = company ? getSubscriptionStatus(company) : null;
  if (user.role === 'SUPER_ADMIN') {
    res.json({ role: user.role, permissions: ['*'], modules: modules.map((m) => ({ name: m.name, isEnabled: true })), subscription: null });
    return;
  }
  const [global, scoped, enabled] = await Promise.all([
    RolePermission.find({ role: user.role, companyId: { $exists: false } }).select('permission isGranted').lean(),
    user.companyId ? RolePermission.find({ role: user.role, companyId: user.companyId }).select('permission isGranted').lean() : [],
    user.companyId ? CompanyModule.find({ companyId: user.companyId, isEnabled: true }).select('moduleId').lean() : [],
  ]);
  const configured = new Map(global.map((p) => [p.permission, p.isGranted]));
  scoped.forEach((p) => configured.set(p.permission, p.isGranted));
  const candidates = new Set([...(DEFAULT_PERMISSIONS[user.role] ?? []).filter((p) => p !== '*'), ...configured.keys()]);
  const permissions = [...candidates].filter((p) => canGrant(user.role, p, configured));
  const enabledIds = new Set(enabled.map((m) => String(m.moduleId)));
  res.json({ role: user.role, permissions, modules: modules.map((m) => ({ name: m.name, isEnabled: enabledIds.has(String(m._id)) })), subscription });
};

function canGrant(role: string, permission: string, configured: Map<string, boolean>): boolean {
  return configured.has(permission) ? configured.get(permission) === true : (DEFAULT_PERMISSIONS[role]?.includes(permission) ?? false);
}
