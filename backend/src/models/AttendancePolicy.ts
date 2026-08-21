import mongoose, { Schema } from 'mongoose';

const attendancePolicySchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
  standardStart: { type: String, default: '09:00' },
  standardEnd: { type: String, default: '18:00' },
  graceMinutes: { type: Number, default: 0, min: 0, max: 720 },
  overtimeAfterMinutes: { type: Number, default: 0, min: 0, max: 1440 },
  breakMinutes: { type: Number, default: 60, min: 0, max: 720 },
  weeklyOffs: { type: [Number], default: [0] },
  version: { type: Number, default: 1 },
}, { timestamps: true });
export default mongoose.model('AttendancePolicy', attendancePolicySchema);
