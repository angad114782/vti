import mongoose, { Schema } from 'mongoose';

const holidaySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['PUBLIC', 'OPTIONAL', 'COMPANY'], default: 'COMPANY' },
  isOptional: { type: Boolean, default: false },
}, { timestamps: true });
holidaySchema.index({ companyId: 1, dateKey: 1 }, { unique: true });
export default mongoose.model('Holiday', holidaySchema);
