import mongoose, { Schema } from 'mongoose';

const moduleSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  availableFor: [{ type: String, enum: ['BASIC', 'PRO', 'ENTERPRISE'] }],
}, { timestamps: { createdAt: true, updatedAt: false } });

moduleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Module', moduleSchema);
