import mongoose, { Schema } from 'mongoose';

const companySchema = new Schema({
  name: { type: String, required: true },
  industry: String,
  email: String,
  phone: String,
  address: String,
  logo: String,
  status: { type: String, enum: ['ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED'], default: 'TRIAL' },
  plan: { type: String, default: 'BASIC' },
  maxUsers: { type: Number, default: 100 },
  trialEndDate: Date,
  planExpiry: Date,
  isDeleted:  { type: Boolean, default: false, index: true },
  deletedAt:  { type: Date },
}, { timestamps: true });

companySchema.index({ status: 1 });
companySchema.index({ plan: 1 });
companySchema.index({ status: 1, plan: 1 });

companySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Company', companySchema);
