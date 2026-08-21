import mongoose, { Schema } from 'mongoose';
import { normalizeSearchText } from '../utils/query';

const documentSchema = new Schema({
  name: { type: String, required: true },
  nameSearch: { type: String, index: true },
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
documentSchema.index({ companyId: 1, name: 1 });

documentSchema.pre('save', function () {
  this.set('nameSearch', normalizeSearchText(this.get('name')));
});

documentSchema.pre(['findOneAndUpdate', 'updateOne'], function () {
  const update: any = this.getUpdate() ?? {};
  const source = update.$set ?? update;
  if (source.name !== undefined) source.nameSearch = normalizeSearchText(source.name);
  if (update.$set) update.$set = source;
  this.setUpdate(update);
});

documentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Document', documentSchema);
