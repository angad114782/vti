import { Request, Response } from 'express';
import AttendanceCorrection from '../models/AttendanceCorrection';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { AuthRequest } from '../middleware/auth.middleware';
import { getCompanyId, getUserId } from '../utils/authContext';
import { requireCompanyId } from '../utils/scope';
import { withTransaction } from '../utils/transaction';
import { logActivity } from '../utils/activity';

export const createAttendanceCorrection = async (req: AuthRequest, res: Response) => {
  const companyId = requireCompanyId(req);
  const emp = await Employee.findOne({ userId: req.user!.userId, companyId }).select('_id').lean();
  if (!emp) { res.status(404).json({ message: 'Employee profile not found' }); return; }
  const { attendanceId, checkIn, checkOut, status, reason } = req.body as Record<string, string>;
  if (!attendanceId || !reason?.trim()) { res.status(400).json({ message: 'Attendance record and correction reason are required' }); return; }
  const attendance = await Attendance.findOne({ _id: attendanceId, companyId, employeeId: emp._id }).select('_id').lean();
  if (!attendance) { res.status(404).json({ message: 'Attendance record not found' }); return; }
  const existing = await AttendanceCorrection.findOne({ attendanceId, status: 'Pending' }).lean();
  if (existing) { res.status(409).json({ message: 'A correction is already pending for this attendance record' }); return; }
  const correction = await AttendanceCorrection.create({ companyId, employeeId: emp._id, attendanceId, requestedBy: req.user!.userId, requestedCheckIn: checkIn, requestedCheckOut: checkOut, requestedStatus: status as any, reason: reason.trim() });
  res.status(201).json(correction);
};

export const getAttendanceCorrections = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const status = typeof req.query.status === 'string' ? req.query.status as 'Pending' | 'Approved' | 'Rejected' | 'ALL' : 'Pending';
  const corrections = await AttendanceCorrection.find({ companyId, ...(status !== 'ALL' ? { status } : {}) }).sort({ createdAt: -1 }).populate('employeeId', 'employeeId').populate('requestedBy', 'name email').lean();
  res.json({ corrections });
};

export const reviewAttendanceCorrection = async (req: AuthRequest, res: Response) => {
  const companyId = requireCompanyId(req);
  const { status, reviewerNote } = req.body as { status: string; reviewerNote?: string };
  if (!['Approved', 'Rejected'].includes(status)) { res.status(400).json({ message: 'Status must be Approved or Rejected' }); return; }
  const result = await withTransaction(async (session) => {
    const correction = await AttendanceCorrection.findOneAndUpdate({ _id: req.params.id, companyId, status: 'Pending' }, { $set: { status, reviewerNote, reviewedBy: getUserId(req), reviewedAt: new Date() } }, { returnDocument: 'after', session }).lean();
    if (!correction) return null;
    if (status === 'Approved') {
      await Attendance.updateOne({ _id: correction.attendanceId, companyId, employeeId: correction.employeeId }, { $set: { ...(correction.requestedCheckIn !== undefined ? { checkIn: correction.requestedCheckIn } : {}), ...(correction.requestedCheckOut !== undefined ? { checkOut: correction.requestedCheckOut } : {}), ...(correction.requestedStatus ? { status: correction.requestedStatus } : {}) } }, { session });
    }
    return correction;
  });
  if (!result) { res.status(409).json({ message: 'Correction was already reviewed', code: 'VERSION_CONFLICT' }); return; }
  logActivity(req, `Attendance correction ${status}`, 'Attendance');
  res.json(result);
};
