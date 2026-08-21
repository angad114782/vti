import mongoose, { Schema } from 'mongoose';

const attendanceCorrectionSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedCheckIn: String,
  requestedCheckOut: String,
  requestedStatus: { type: String, enum: ['Present', 'Late', 'Absent', 'Leave', 'Holiday'] },
  reason: { type: String, required: true, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewerNote: String,
}, { timestamps: true });

attendanceCorrectionSchema.index({ companyId: 1, status: 1, createdAt: -1 });
attendanceCorrectionSchema.index({ employeeId: 1, createdAt: -1 });

export default mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
