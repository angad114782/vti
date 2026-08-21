import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import RolePermission from '../models/RolePermission';
import { canUsePermission } from '../config/access';

/** Enforces the effective permission for the authenticated user's tenant. */
export const requirePermission = (permission: string) => async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = req.user;
  if (!user) { res.status(401).json({ message: 'Unauthorized' }); return; }
  if (user.role === 'SUPER_ADMIN') { next(); return; }
  try {
    const configured = user.companyId
      ? await RolePermission.findOne({ companyId: user.companyId, role: user.role, permission }).lean()
      : null;
    const global = configured ?? await RolePermission.findOne({ companyId: { $exists: false }, role: user.role, permission }).lean();
    if (!canUsePermission(user.role, permission, global?.isGranted)) {
      res.status(403).json({ message: `Permission denied: ${permission}`, code: 'PERMISSION_DENIED' });
      return;
    }
    next();
  } catch (err) { next(err); }
};
