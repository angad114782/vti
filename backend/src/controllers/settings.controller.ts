import { Request, Response } from 'express';
import PlatformSetting from '../models/PlatformSetting';
import { AuthRequest } from '../middleware/auth.middleware';
import { logActivity } from '../utils/activity';

export const getPlatformSettings = async (_req: Request, res: Response) => {
  const settings = await PlatformSetting.find().lean();
  res.json(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])));
};

export const updatePlatformSettings = async (req: AuthRequest, res: Response) => {
  const allowed = ['general', 'security', 'notifications', 'system'];
  const entries = Object.entries(req.body ?? {}).filter(([key]) => allowed.includes(key));
  if (!entries.length) { res.status(400).json({ message: 'At least one valid settings section is required' }); return; }
  for (const [key, value] of entries) {
    await PlatformSetting.findOneAndUpdate({ key }, { $set: { value, updatedBy: req.user?.userId } }, { upsert: true, returnDocument: 'after' });
  }
  logActivity(req, `Updated platform settings: ${entries.map(([key]) => key).join(', ')}`, 'Settings');
  res.json(Object.fromEntries(entries));
};
