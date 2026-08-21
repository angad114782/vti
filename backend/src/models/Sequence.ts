import mongoose, { Schema } from 'mongoose';

const sequenceSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  key: { type: String, required: true },
  value: { type: Number, default: 0 },
}, { timestamps: true });

sequenceSchema.index({ companyId: 1, key: 1 }, { unique: true });

export default mongoose.model('Sequence', sequenceSchema);
