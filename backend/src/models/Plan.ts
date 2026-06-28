import mongoose, { Schema } from 'mongoose';

const planSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['BASIC', 'PRO', 'ENTERPRISE'], unique: true },
  price: { type: Number, required: true },
  maxUsers: { type: Number, required: true },
  features: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

planSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Plan', planSchema);
