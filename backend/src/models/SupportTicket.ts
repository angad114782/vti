import mongoose, { Schema } from 'mongoose';

const supportTicketSchema = new Schema({
  ticketNo: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  category: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'PENDING' },
  attachment: String,
}, { timestamps: true });

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ priority: 1, status: 1 });
supportTicketSchema.index({ companyId: 1, createdAt: -1 });

supportTicketSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // Rename populated fields to match frontend expectations
    if (ret.userId !== undefined) { ret.user = ret.userId; delete ret.userId; }
    if (ret.companyId !== undefined) { ret.company = ret.companyId; delete ret.companyId; }
  },
});

export default mongoose.model('SupportTicket', supportTicketSchema);
