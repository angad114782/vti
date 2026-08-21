import { Request } from 'express';
import ActivityLog from '../models/ActivityLog';

interface ActivityUser {
  userId?: string;
  companyId?: string;
}

export const logActivity = (
  req: Request & { user?: ActivityUser },
  action: string,
  module: string,
  status = 'Success',
): void => {
  ActivityLog.create({
    userId:    req.user?.userId,
    companyId: req.user?.companyId,
    action,
    module,
    status,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  }).catch((err: unknown) => {
    console.error('[ActivityLog] Failed to write log:', err instanceof Error ? err.message : err);
  });
};
