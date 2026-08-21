import mongoose from 'mongoose';
import Notification from '../models/Notification';

export async function createNotification(input: {
  userId: mongoose.Types.ObjectId | string;
  companyId: mongoose.Types.ObjectId | string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId | string;
  dedupeKey: string;
}): Promise<void> {
  await Notification.updateOne(
    { companyId: input.companyId, dedupeKey: input.dedupeKey },
    { $setOnInsert: input },
    { upsert: true },
  );
}
