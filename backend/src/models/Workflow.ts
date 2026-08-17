import mongoose, { Schema } from 'mongoose';

const workflowStepSchema = new Schema({
  order:          { type: Number, required: true },
  role:           { type: String, required: true },
  action:         { type: String, required: true },
  escalateAfter:  { type: Number, default: 0 },  // hours; 0 = no escalation
}, { _id: false });

const workflowSchema = new Schema({
  companyId:     { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  type:          { type: String, enum: ['leave', 'expense', 'correction'], required: true },
  steps:         { type: [workflowStepSchema], default: [] },
  autoEscalate:  { type: Boolean, default: false },
  escalateHours: { type: Number, default: 24 },
}, { timestamps: true });

workflowSchema.index({ companyId: 1, type: 1 }, { unique: true });

workflowSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Workflow', workflowSchema);
