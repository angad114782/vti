import mongoose, { Schema } from 'mongoose';

const activityLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  action: { type: String, required: true },
  module: String,
  status: { type: String, default: 'Success' },
  ipAddress: String,
  userAgent: String,
}, { timestamps: { createdAt: true, updatedAt: false } });

activityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('ActivityLog', activityLogSchema);
