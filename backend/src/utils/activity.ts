import { Request } from 'express';
import ActivityLog from '../models/ActivityLog';

interface ActivityUser {
  userId?: string;
  companyId?: string;
}

export const logActivity = async (
  req: Request & { user?: ActivityUser; requestId?: string },
  action: string,
  module: string,
  status = 'Success',
): Promise<void> => {
  try {
    await ActivityLog.create({
      userId:    req.user?.userId,
      companyId: req.user?.companyId,
      action,
      module,
      status,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
    });
  } catch (err: unknown) {
    console.error('[ActivityLog] Failed to write log:', err instanceof Error ? err.message : err);
  }
};
