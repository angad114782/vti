import mongoose, { Schema } from 'mongoose';

const leaveLedgerSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, required: true },
  source: { type: String, enum: ['Accrual', 'Usage', 'CarryForward', 'Adjustment'], required: true },
  amount: { type: Number, required: true },
  referenceId: { type: Schema.Types.ObjectId },
  effectiveDate: { type: Date, required: true },
  note: String,
}, { timestamps: true });

leaveLedgerSchema.index({ companyId: 1, employeeId: 1, leaveType: 1, effectiveDate: -1 });
leaveLedgerSchema.index({ companyId: 1, referenceId: 1, source: 1 }, { unique: true, sparse: true });

export default mongoose.model('LeaveLedger', leaveLedgerSchema);
