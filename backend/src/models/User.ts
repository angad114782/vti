import mongoose, { Schema } from 'mongoose';
import { normalizeSearchText } from '../utils/query';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  emailSearch: { type: String, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  nameSearch: { type: String, index: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'SUPERVISOR', 'MANAGER', 'FINANCE', 'EMPLOYEE'],
    default: 'EMPLOYEE',
  },
  avatar: String,
  isActive: { type: Boolean, default: true },
  sessionVersion: { type: Number, default: 0, min: 0 },
  failedLoginAttempts: { type: Number, default: 0, min: 0 },
  loginLockedUntil: { type: Date },
  passwordChangedAt: { type: Date },
  passwordHistory: { type: [{ type: String }], default: [] },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

userSchema.index({ companyId: 1 });
userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ companyId: 1, isActive: 1 });
userSchema.index({ companyId: 1, name: 1 });
userSchema.index({ companyId: 1, email: 1 });

userSchema.pre('save', function () {
  this.set('nameSearch', normalizeSearchText(this.get('name')));
  this.set('emailSearch', normalizeSearchText(this.get('email')));
});

userSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const update: any = this.getUpdate() ?? {};
  const source = update.$set ?? update;
  if (source.name !== undefined) source.nameSearch = normalizeSearchText(source.name);
  if (source.email !== undefined) source.emailSearch = normalizeSearchText(source.email);
  if (update.$set) update.$set = source;
  this.setUpdate(update);
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  },
});

export default mongoose.model('User', userSchema);
