import mongoose, { Schema } from 'mongoose';

const paymentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
  registrationId: { type: Schema.Types.ObjectId, ref: 'PendingRegistration', index: true },
  source: { type: String, enum: ['OFFLINE', 'RAZORPAY'], required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'NOT_RECORDED'], required: true, default: 'PENDING' },
  plan: { type: String, required: true },
  billingCycle: { type: String, default: 'Monthly' },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  paidAt: Date,
  reference: String,
  notes: String,
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  webhookEventId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

paymentSchema.index({ companyId: 1, createdAt: -1 });
paymentSchema.index({ source: 1, status: 1, createdAt: -1 });

paymentSchema.set('toJSON', { virtuals: true, transform: (_doc, ret: any) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; } });

export default mongoose.model('Payment', paymentSchema);
