import mongoose, { Schema } from 'mongoose';

const attendanceSchema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  companyId:  { type: Schema.Types.ObjectId, ref: 'Company',  required: true },
  date:       { type: Date, required: true },
  businessDate: { type: String },
  timezone: { type: String, default: 'Asia/Kolkata' },
  checkIn:    { type: String },
  checkOut:   { type: String },
  status:     { type: String, enum: ['Present', 'Late', 'Absent', 'Leave', 'Holiday'], default: 'Present' },
  source:     { type: String, enum: ['Manual', 'SelfCheckIn'], default: 'Manual' },
  notes:      { type: String },
  workedMinutes: { type: Number, min: 0 },
  lateMinutes: { type: Number, min: 0, default: 0 },
  overtimeMinutes: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

// Unique record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, employeeId: 1, businessDate: 1 }, { unique: true });
attendanceSchema.index({ companyId: 1, date: -1 });
attendanceSchema.index({ companyId: 1, status: 1, date: -1 });
attendanceSchema.index({ employeeId: 1, date: -1 });

attendanceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: unknown, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

export default mongoose.model('Attendance', attendanceSchema);
