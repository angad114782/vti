import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError';
import { getCompanyId } from '../utils/authContext';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';

/**
 * Route middleware that blocks the request when the company has the named module disabled.
 * Usage: router.use('/payroll', requireModule('Payroll'), payrollHandler)
 */
export const requireModule = (moduleName: string) => async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      next(new AppError('FORBIDDEN', 'Company context required', 403));
      return;
    }

    const mod = await Module.findOne({ name: moduleName }).lean();
    if (!mod) {
      // Module not found in DB — treat as enabled (graceful degradation).
      next(new AppError('MODULE_NOT_CONFIGURED', `Module '${moduleName}' is not configured`, 403));
      return;
    }

    const enabled = await CompanyModule.findOne({
      companyId,
      moduleId: mod._id,
      isEnabled: true,
    }).lean();

    if (!enabled) {
      next(new AppError('MODULE_DISABLED', `Module '${moduleName}' is not enabled for your company`, 403));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
