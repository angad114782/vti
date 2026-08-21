import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireCompanyId } from '../utils/scope';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = requireCompanyId(req);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const notifications = await Notification.find({ userId: req.user!.userId, companyId })
    .sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ notifications, unread: await Notification.countDocuments({ userId: req.user!.userId, companyId, readAt: { $exists: false } }) });
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const companyId = requireCompanyId(req);
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId, companyId },
    { $set: { readAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!notification) { res.status(404).json({ message: 'Notification not found' }); return; }
  res.json(notification);
};
