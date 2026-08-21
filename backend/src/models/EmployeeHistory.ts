import mongoose, { Schema } from 'mongoose';

const employeeHistorySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  changes: { type: Schema.Types.Mixed, required: true },
  snapshot: { type: Schema.Types.Mixed },
}, { timestamps: true });

employeeHistorySchema.index({ companyId: 1, employeeId: 1, effectiveFrom: -1 });
employeeHistorySchema.index({ companyId: 1, employeeId: 1, effectiveTo: 1 });

export default mongoose.model('EmployeeHistory', employeeHistorySchema);
