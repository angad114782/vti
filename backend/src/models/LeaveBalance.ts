import mongoose, { Schema } from 'mongoose';

const leaveBalanceSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, required: true },
  openingDays: { type: Number, default: 0, min: 0 },
  accruedDays: { type: Number, default: 0, min: 0 },
  carryForwardDays: { type: Number, default: 0, min: 0 },
  adjustedDays: { type: Number, default: 0 },
  usedDays: { type: Number, default: 0, min: 0 },
  expiresAt: Date,
}, { timestamps: true });

leaveBalanceSchema.index({ companyId: 1, employeeId: 1, leaveType: 1 }, { unique: true });

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
