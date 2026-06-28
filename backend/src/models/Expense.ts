import mongoose, { Schema } from 'mongoose';

const expenseSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: String,
  receiptUrl: String,
  status: { type: String, default: 'Pending' },
}, { timestamps: true });

expenseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Expense', expenseSchema);
