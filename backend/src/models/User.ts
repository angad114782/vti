import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR', 'SUPERVISOR', 'MANAGER', 'FINANCE', 'EMPLOYEE'],
    default: 'EMPLOYEE',
  },
  avatar: String,
  isActive: { type: Boolean, default: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true });

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('User', userSchema);
