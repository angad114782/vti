import mongoose, { Schema } from 'mongoose';

const leaveRequestSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: String,
  status: { type: String, default: 'Pending' },
  workflowType: { type: String, default: 'leave' },
  workflowStep: { type: Number, default: 1 },
  pendingRole: { type: String, default: 'SUPERVISOR' },
}, { timestamps: true });

leaveRequestSchema.index({ companyId: 1, createdAt: -1 });
leaveRequestSchema.index({ companyId: 1, status: 1 });
leaveRequestSchema.index({ employeeId: 1, createdAt: -1 });
leaveRequestSchema.index({ employeeId: 1, status: 1, startDate: 1 });

leaveRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('LeaveRequest', leaveRequestSchema);
