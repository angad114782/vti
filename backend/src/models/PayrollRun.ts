import mongoose, { Schema } from 'mongoose';

const payrollRunSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Processing', 'Approved', 'Finalized', 'Failed'], default: 'Draft' },
  idempotencyKey: { type: String },
  employeeCount: { type: Number, default: 0 },
  error: String,
}, { timestamps: true });

payrollRunSchema.index({ companyId: 1, month: 1, year: 1 }, { unique: true });
payrollRunSchema.index({ companyId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.model('PayrollRun', payrollRunSchema);
