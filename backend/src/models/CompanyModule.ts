import mongoose, { Schema } from 'mongoose';

const companyModuleSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  isEnabled: { type: Boolean, default: true },
});

companyModuleSchema.index({ companyId: 1, moduleId: 1 }, { unique: true });

companyModuleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('CompanyModule', companyModuleSchema);
