import mongoose, { Schema } from 'mongoose';

const shiftSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  department: { type: String, required: true },
  date: { type: Date, required: true },
  shiftName: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['Assigned', 'Completed', 'Cancelled'], default: 'Assigned' },
  notes: { type: String },
  version: { type: Number, default: 0 },
}, { timestamps: true });

shiftSchema.index({ companyId: 1, date: 1 });
shiftSchema.index({ companyId: 1, department: 1, date: 1 });
shiftSchema.index({ employeeId: 1, date: 1 }, { unique: true });

shiftSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Shift', shiftSchema);
