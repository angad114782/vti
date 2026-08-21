import mongoose, { Schema } from 'mongoose';

const pendingRegistrationSchema = new Schema({
  company: { name: { type: String, required: true }, industry: String, email: String, phone: String, address: String, timezone: { type: String, default: 'Asia/Kolkata' } },
  admin: { name: { type: String, required: true }, email: { type: String, required: true, index: true }, passwordHash: { type: String, required: true } },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  plan: { type: String, required: true },
  billingCycle: { type: String, default: 'Monthly' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED'], default: 'PENDING_PAYMENT' },
  expiresAt: { type: Date, required: true, index: true },
  verificationTokenHash: String,
  verificationExpiresAt: Date,
  verifiedAt: Date,
}, { timestamps: true });

pendingRegistrationSchema.index({ 'admin.email': 1, status: 1 });
pendingRegistrationSchema.set('toJSON', { virtuals: true, transform: (_doc, ret: any) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; delete ret.admin?.passwordHash; delete ret.verificationTokenHash; } });
export default mongoose.model('PendingRegistration', pendingRegistrationSchema);
