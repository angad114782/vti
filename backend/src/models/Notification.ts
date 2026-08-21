import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  entityType: String,
  entityId: Schema.Types.ObjectId,
  readAt: Date,
  dedupeKey: { type: String, required: true },
}, { timestamps: true });

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ companyId: 1, dedupeKey: 1 }, { unique: true });

export default mongoose.model('Notification', notificationSchema);
