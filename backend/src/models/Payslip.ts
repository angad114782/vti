import mongoose, { Schema } from 'mongoose';

const payslipSchema = new Schema({
  payslipId: { type: String, required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  period: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  netPay: { type: Number, required: true },
  status: { type: String, default: 'Processing' },
}, { timestamps: true });

payslipSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Payslip', payslipSchema);
