import { Request, Response } from 'express';
import Office from '../models/Office';
import Department from '../models/Department';
import Holiday from '../models/Holiday';
import AttendancePolicy from '../models/AttendancePolicy';
import { requireCompanyId } from '../utils/scope';
import { validateId } from '../utils/validate';
import { getUserId } from '../utils/authContext';
import { logActivity } from '../utils/activity';

const clean = (value: unknown) => String(value ?? '').trim();
const validTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export const listOffices = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  res.json(await Office.find({ companyId }).sort({ name: 1 }).lean());
};

export const createOffice = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const name = clean(req.body.name); const code = clean(req.body.code).toUpperCase();
  if (!name || !code) { res.status(400).json({ message: 'Office name and code are required' }); return; }
  const office = await Office.create({ companyId, name, code, address: clean(req.body.address), timezone: clean(req.body.timezone) || 'Asia/Kolkata' });
  logActivity(req, `Created office ${code}`, 'Office'); res.status(201).json(office);
};

export const listDepartments = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  res.json(await Department.find({ companyId }).sort({ name: 1 }).lean());
};

export const createDepartment = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const name = clean(req.body.name); const code = clean(req.body.code || name.slice(0, 8)).toUpperCase();
  if (!name) { res.status(400).json({ message: 'Department name is required' }); return; }
  const department = await Department.create({ companyId, name, code });
  logActivity(req, `Created department ${name}`, 'Office'); res.status(201).json(department);
};

export const listHolidays = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const year = Number(req.query.year ?? new Date().getUTCFullYear());
  res.json(await Holiday.find({ companyId, dateKey: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } }).sort({ dateKey: 1 }).lean());
};

export const createHoliday = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const dateKey = clean(req.body.dateKey); const name = clean(req.body.name);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !name) { res.status(400).json({ message: 'Valid dateKey and holiday name are required' }); return; }
  const holiday = await Holiday.create({ companyId, dateKey, name, type: req.body.type, isOptional: Boolean(req.body.isOptional) });
  logActivity(req, `Created holiday ${name} on ${dateKey}`, 'Office'); res.status(201).json(holiday);
};

export const getAttendancePolicy = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  res.json(await AttendancePolicy.findOne({ companyId }).lean() ?? { companyId, standardStart: '09:00', standardEnd: '18:00', graceMinutes: 0, overtimeAfterMinutes: 0, breakMinutes: 60, weeklyOffs: [0], version: 1 });
};

export const updateAttendancePolicy = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const start = clean(req.body.standardStart || '09:00'); const end = clean(req.body.standardEnd || '18:00');
  if (!validTime(start) || !validTime(end)) { res.status(400).json({ message: 'Policy times must use HH:MM format' }); return; }
  const weeklyOffs = Array.isArray(req.body.weeklyOffs) ? req.body.weeklyOffs.map(Number).filter((day: number) => day >= 0 && day <= 6) : [0];
  const policy = await AttendancePolicy.findOneAndUpdate({ companyId }, { $set: { standardStart: start, standardEnd: end, graceMinutes: Math.max(0, Number(req.body.graceMinutes ?? 0)), overtimeAfterMinutes: Math.max(0, Number(req.body.overtimeAfterMinutes ?? 0)), breakMinutes: Math.max(0, Number(req.body.breakMinutes ?? 60)), weeklyOffs }, $inc: { version: 1 } }, { upsert: true, returnDocument: 'after' });
  logActivity(req, `Updated attendance policy by ${getUserId(req)}`, 'Attendance'); res.json(policy);
};

export const deleteHoliday = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req); const id = String(req.params.id); validateId(id);
  const deleted = await Holiday.findOneAndDelete({ _id: id, companyId });
  if (!deleted) { res.status(404).json({ message: 'Holiday not found' }); return; }
  res.json({ message: 'Holiday deleted' });
};
