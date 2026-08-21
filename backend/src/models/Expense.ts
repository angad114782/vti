import mongoose, { Schema } from 'mongoose';

const expenseSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: String,
  receiptUrl: String,
  status: { type: String, default: 'Pending' },
  version: { type: Number, default: 0 },
  workflowType: { type: String, default: 'expense' },
  workflowStep: { type: Number, default: 1 },
  pendingRole: { type: String, default: 'MANAGER' },
  requesterUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  workflowVersion: { type: Number, default: 1 },
  workflowSnapshot: { type: Schema.Types.Mixed },
  approvalDueAt: Date,
  delegatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  escalatedAt: Date,
}, { timestamps: true });

expenseSchema.index({ companyId: 1, createdAt: -1 });
expenseSchema.index({ companyId: 1, status: 1 });
expenseSchema.index({ employeeId: 1, createdAt: -1 });

expenseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Expense', expenseSchema);
