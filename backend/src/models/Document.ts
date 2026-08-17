import mongoose, { Schema } from 'mongoose';

const documentSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  fileSize: String,
  version: String,
  visibility: { type: String, default: 'All Employees' },
  fileUrl: String,
}, { timestamps: true });

documentSchema.index({ companyId: 1, createdAt: -1 });
documentSchema.index({ companyId: 1, visibility: 1 });
documentSchema.index({ companyId: 1, category: 1 });

documentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Document', documentSchema);
