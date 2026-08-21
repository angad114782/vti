import mongoose, { Schema } from 'mongoose';

const officeSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  address: String,
  timezone: { type: String, default: 'Asia/Kolkata' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
officeSchema.index({ companyId: 1, code: 1 }, { unique: true });
officeSchema.index({ companyId: 1, name: 1 }, { unique: true });
export default mongoose.model('Office', officeSchema);
