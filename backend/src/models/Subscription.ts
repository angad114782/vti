import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
  plan: { type: String, enum: ['BASIC', 'PRO', 'ENTERPRISE'], required: true },
  billingCycle: { type: String, default: 'Monthly' },
  amount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

subscriptionSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Subscription', subscriptionSchema);
