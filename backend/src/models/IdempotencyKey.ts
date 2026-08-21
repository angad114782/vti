import mongoose, { Schema } from 'mongoose';

const idempotencyKeySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  key: { type: String, required: true },
  requestHash: { type: String, required: true },
  operation: { type: String, required: true },
  status: { type: String, enum: ['Processing', 'Completed'], default: 'Processing' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  responseBody: { type: Schema.Types.Mixed },
}, { timestamps: true });

idempotencyKeySchema.index({ companyId: 1, operation: 1, key: 1 }, { unique: true });
// Idempotency records are a replay-safety window, not permanent business data.
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);
