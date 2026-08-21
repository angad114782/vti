import mongoose, { Schema } from 'mongoose';

const approvalSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { type: String, required: true },
  details: { type: String, required: true },
  date: { type: Date, default: Date.now },
  priority: { type: String, default: 'P1' },
  status: { type: String, default: 'Pending' },
  workflowType: { type: String, default: 'correction' },
  workflowStep: { type: Number, default: 1 },
  pendingRole: { type: String, default: 'SUPERVISOR' },
  version: { type: Number, default: 0 },
  requesterUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  workflowVersion: { type: Number, default: 1 },
  workflowSnapshot: { type: Schema.Types.Mixed },
  approvalDueAt: Date,
  delegatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  escalatedAt: Date,
}, { timestamps: true });

approvalSchema.index({ companyId: 1, createdAt: -1 });
approvalSchema.index({ companyId: 1, status: 1 });
approvalSchema.index({ employeeId: 1, createdAt: -1 });

approvalSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Approval', approvalSchema);
