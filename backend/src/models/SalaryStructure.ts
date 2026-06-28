import mongoose, { Schema } from 'mongoose';

const salaryStructureSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  role: { type: String, required: true },
  employmentType: { type: String, default: 'Permanent' },
  annualCtc: { type: Number, required: true },
  lastRevised: { type: Date, required: true },
}, { timestamps: true });

salaryStructureSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('SalaryStructure', salaryStructureSchema);
