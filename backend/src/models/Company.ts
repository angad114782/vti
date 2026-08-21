import mongoose, { Schema } from 'mongoose';
import { normalizeSearchText } from '../utils/query';

const companySchema = new Schema({
  name: { type: String, required: true },
  nameSearch: { type: String, index: true },
  // Human-facing identifier; MongoDB _id remains the canonical relationship key.
  // `unique` already creates the index; keeping `index: true` here creates a
  // second companyCode_1 definition and can break legacy index reconciliation.
  companyCode: { type: String, unique: true, sparse: true },
  industry: String,
  industrySearch: { type: String, index: true },
  email: String,
  emailSearch: { type: String, index: true },
  phone: String,
  address: String,
  timezone: { type: String, default: 'Asia/Kolkata' },
  logo: String,
  status: { type: String, enum: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED'], default: 'TRIAL' },
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
companySchema.index({ name: 1 });
companySchema.index({ email: 1 });

companySchema.pre('save', function () {
  this.set('nameSearch', normalizeSearchText(this.get('name')));
  this.set('industrySearch', normalizeSearchText(this.get('industry')));
  this.set('emailSearch', normalizeSearchText(this.get('email')));
});

companySchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const update: any = this.getUpdate() ?? {};
  const source = update.$set ?? update;
  if (source.name !== undefined) source.nameSearch = normalizeSearchText(source.name);
  if (source.industry !== undefined) source.industrySearch = normalizeSearchText(source.industry);
  if (source.email !== undefined) source.emailSearch = normalizeSearchText(source.email);
  if (update.$set) update.$set = source;
  this.setUpdate(update);
});

companySchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Company', companySchema);
