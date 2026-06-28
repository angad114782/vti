import mongoose, { Schema } from 'mongoose';

const employeeSchema = new Schema({
  employeeId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  department: String,
  designation: String,
  shiftType: String,
  shiftTiming: String,
  joiningDate: Date,
  accountHolder: String,
  bankName: String,
  branchName: String,
  annualCtc: Number,
  employmentType: { type: String, default: 'Permanent' },
  status: { type: String, default: 'Active' },
}, { timestamps: true });

employeeSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Employee', employeeSchema);
