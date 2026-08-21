import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = req.user?.role === 'SUPER_ADMIN' ? undefined : req.user?.companyId;
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const where: Record<string, unknown> = { userId: req.user!.userId, ...(companyId ? { companyId } : {}) };
  const notifications = await Notification.find({ ...where, readAt: { $exists: false } })
    .sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ notifications: notifications.map((notification: any) => ({ ...notification, id: notification._id.toString() })), unread: await Notification.countDocuments({ ...where, readAt: { $exists: false } }) });
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = req.user?.role === 'SUPER_ADMIN' ? undefined : req.user?.companyId;
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId, ...(companyId ? { companyId } : {}) },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!notification) { res.status(404).json({ message: 'Notification not found' }); return; }
  res.json(notification);
};
