import mongoose, { Schema } from 'mongoose';
import { normalizeSearchText } from '../utils/query';

const supportTicketSchema = new Schema({
  ticketNo: { type: String, required: true, unique: true },
  ticketNoSearch: { type: String, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  category: { type: String, required: true },
  categorySearch: { type: String, index: true },
  subject: { type: String, required: true },
  subjectSearch: { type: String, index: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'PENDING' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  slaDueAt: Date,
  resolvedAt: Date,
  closedAt: Date,
  attachment: String,
}, { timestamps: true });

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ priority: 1, status: 1 });
supportTicketSchema.index({ companyId: 1, createdAt: -1 });
supportTicketSchema.index({ companyId: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
supportTicketSchema.index({ subject: 1 });

supportTicketSchema.pre('save', function () {
  this.set('ticketNoSearch', normalizeSearchText(this.get('ticketNo')));
  this.set('categorySearch', normalizeSearchText(this.get('category')));
  this.set('subjectSearch', normalizeSearchText(this.get('subject')));
});

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
