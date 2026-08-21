import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import Company from '../models/Company';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string; companyId?: string; sessionVersion?: number };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('email role companyId isActive sessionVersion').lean();
    if (!user || !user.isActive || Number(user.sessionVersion ?? 0) !== Number(decoded.sessionVersion ?? 0)) {
      res.status(401).json({ message: 'Session is no longer valid' });
      return;
    }
    if (user.companyId) {
      const company = await Company.findById(user.companyId).select('status isDeleted').lean();
      if (!company || company.isDeleted || ['SUSPENDED', 'EXPIRED'].includes(company.status)) {
        res.status(403).json({ message: 'Company account is not active', code: 'COMPANY_INACTIVE' });
        return;
      }
    }
    req.user = { userId: user._id.toString(), email: user.email, role: user.role, companyId: user.companyId?.toString(), sessionVersion: Number(user.sessionVersion ?? 0) };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
};
