import mongoose, { Schema } from 'mongoose';

const payslipSchema = new Schema({
  payslipId: { type: String, required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  period: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  status: { type: String, enum: ['Processing', 'Calculated', 'Approved', 'Finalized', 'Paid', 'Voided'], default: 'Processing' },
  paymentStatus: { type: String, enum: ['UNPAID', 'PROCESSING', 'PAID', 'FAILED'], default: 'UNPAID' },
  paidAt: Date,
  payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun' },
  snapshot: { type: Schema.Types.Mixed },
}, { timestamps: true });

payslipSchema.index({ companyId: 1, year: -1, month: -1 });
payslipSchema.index({ companyId: 1, status: 1 });
payslipSchema.index({ employeeId: 1, year: -1, month: -1 });
payslipSchema.index({ companyId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

payslipSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Payslip', payslipSchema);
