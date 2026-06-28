import mongoose, { Schema } from 'mongoose';

const approvalSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { type: String, required: true },
  details: { type: String, required: true },
  date: { type: Date, default: Date.now },
  priority: { type: String, default: 'P1' },
  status: { type: String, default: 'Pending' },
}, { timestamps: true });

approvalSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Approval', approvalSchema);
