import mongoose, { Schema } from 'mongoose';
import { normalizeSearchText } from '../utils/query';

const employeeSchema = new Schema({
  employeeId: { type: String, required: true },
  employeeIdSearch: { type: String, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  department: String,
  departmentSearch: { type: String, index: true },
  designation: String,
  designationSearch: { type: String, index: true },
  shiftType: String,
  shiftTiming: String,
  joiningDate: Date,
  accountHolder: String,
  bankName: String,
  branchName: String,
  annualCtc: Number,
  employmentType: { type: String, default: 'Permanent' },
  status: { type: String, enum: ['Invited', 'Onboarding', 'Active', 'Inactive', 'NoticePeriod', 'Terminated', 'Archived'], default: 'Active' },
  version: { type: Number, default: 0 },
  terminatedAt: Date,
}, { timestamps: true });

employeeSchema.index({ companyId: 1 });
employeeSchema.index({ companyId: 1, department: 1 });
employeeSchema.index({ companyId: 1, status: 1 });
employeeSchema.index({ companyId: 1, department: 1, status: 1 });
employeeSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, designation: 1 });

employeeSchema.pre('save', function () {
  this.set('employeeIdSearch', normalizeSearchText(this.get('employeeId')));
  this.set('departmentSearch', normalizeSearchText(this.get('department')));
  this.set('designationSearch', normalizeSearchText(this.get('designation')));
});

employeeSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const update: any = this.getUpdate() ?? {};
  const source = update.$set ?? update;
  if (source.employeeId !== undefined) source.employeeIdSearch = normalizeSearchText(source.employeeId);
  if (source.department !== undefined) source.departmentSearch = normalizeSearchText(source.department);
  if (source.designation !== undefined) source.designationSearch = normalizeSearchText(source.designation);
  if (update.$set) update.$set = source;
  this.setUpdate(update);
});

employeeSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Employee', employeeSchema);
