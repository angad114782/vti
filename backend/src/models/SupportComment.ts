import mongoose, { Schema } from 'mongoose';

const supportCommentSchema = new Schema({
  ticketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  isInternal: { type: Boolean, default: false },
}, { timestamps: true });

supportCommentSchema.index({ ticketId: 1, createdAt: 1 });

supportCommentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('SupportComment', supportCommentSchema);
