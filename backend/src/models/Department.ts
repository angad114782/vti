import mongoose, { Schema } from 'mongoose';

const departmentSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
departmentSchema.index({ companyId: 1, code: 1 }, { unique: true });
departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });
export default mongoose.model('Department', departmentSchema);
