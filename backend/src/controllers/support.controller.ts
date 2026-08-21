import { Response } from 'express';
import SupportTicket from '../models/SupportTicket';
import SupportComment from '../models/SupportComment';
import Company from '../models/Company';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { escapeRegex, clampLimit } from '../utils/query';
import { getAuth } from '../utils/authContext';
import { getCompanyReference } from '../utils/companyReference';
import { logActivity } from '../utils/activity';
import { nextSupportTicketNumber } from '../utils/ticketNumber';
import { emitSupportComment, emitSupportTicketUpdate } from '../realtime/supportSocket';
import { emitUserNotification } from '../realtime/supportSocket';
import Notification from '../models/Notification';

const managementRoles = new Set(['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR']);
const companyScope = (req: AuthRequest) => req.user?.role === 'SUPER_ADMIN' ? {} : { companyId: req.user?.companyId };
const populateTicket = (query: any) => query.populate('userId', 'id name email role').populate('assignedTo', 'id name email role').populate('companyId', 'id name companyCode');

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const auth = getAuth(req); const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1); const limit = clampLimit(req.query.limit as string | undefined, 20); const skip = (page - 1) * limit;
  const where: Record<string, any> = { ...companyScope(req) };
  if (['EMPLOYEE', 'FINANCE', 'MANAGER', 'SUPERVISOR'].includes(auth.role)) where.userId = auth.userId;
  if (auth.role === 'SUPER_ADMIN' && req.query.company && req.query.company !== 'ALL') where.companyId = req.query.company;
  if (req.query.status && req.query.status !== 'ALL') where.status = req.query.status;
  if (req.query.priority && req.query.priority !== 'ALL') where.priority = req.query.priority;
  if (req.query.search) { const re = escapeRegex(String(req.query.search)); where.$or = [{ ticketNo: re }, { ticketNoSearch: re }, { subject: re }, { subjectSearch: re }, { category: re }, { categorySearch: re }]; }
  const [tickets, total, open, inProgress, resolved] = await Promise.all([
    populateTicket(SupportTicket.find(where).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit)), SupportTicket.countDocuments(where),
    SupportTicket.countDocuments({ ...companyScope(req), status: 'PENDING' }), SupportTicket.countDocuments({ ...companyScope(req), status: 'IN_PROGRESS' }), SupportTicket.countDocuments({ ...companyScope(req), status: 'RESOLVED' }),
  ]);
  res.json({ tickets, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, stats: { total, open, inProgress, resolved } });
};

export const getTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const auth = getAuth(req); const where: Record<string, any> = { _id: req.params.id, ...companyScope(req) };
  if (['EMPLOYEE', 'FINANCE', 'MANAGER', 'SUPERVISOR'].includes(auth.role)) where.userId = auth.userId;
  const ticket = await populateTicket(SupportTicket.findOne(where));
  if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; } res.json(ticket);
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const auth = getAuth(req); const { category, subject, description, priority } = req.body as Record<string, string>; const companyId = auth.role === 'SUPER_ADMIN' ? req.body.companyId : auth.companyId;
  if (!companyId || !category?.trim() || !subject?.trim() || !description?.trim()) { res.status(400).json({ message: 'Company, category, subject, and description are required' }); return; }
  if (auth.role === 'SUPER_ADMIN' && !await Company.exists({ _id: companyId, isDeleted: { $ne: true } })) { res.status(404).json({ message: 'Company not found' }); return; }
  const ticket = await SupportTicket.create({ ticketNo: await nextSupportTicketNumber(), userId: auth.userId, companyId, category: category.trim(), subject: subject.trim(), description: description.trim(), priority: (priority ?? 'MEDIUM') as any });
  logActivity(req, `Created support ticket ${ticket.ticketNo}: ${ticket.subject}`, 'Support'); res.status(201).json(await populateTicket(SupportTicket.findById(ticket._id)));
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const auth = getAuth(req); const existing = await SupportTicket.findOne({ _id: req.params.id, ...companyScope(req) });
  if (!existing || !managementRoles.has(auth.role)) { res.status(404).json({ message: 'Ticket not found or not permitted' }); return; }
  const { status, priority, assignedTo } = req.body as { status?: string; priority?: string; assignedTo?: string }; const update: Record<string, unknown> = {};
  if (status) { update.status = status; if (status === 'RESOLVED') update.resolvedAt = new Date(); if (status === 'CLOSED') update.closedAt = new Date(); } if (priority) update.priority = priority; if (assignedTo !== undefined) update.assignedTo = assignedTo || null;
  const ticket = await populateTicket(SupportTicket.findOneAndUpdate({ _id: existing._id }, update, { returnDocument: 'after' })); logActivity(req, `Updated support ticket ${existing.ticketNo}`, 'Support'); emitSupportTicketUpdate(existing._id.toString(), ticket); res.json(ticket);
};

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  const auth = getAuth(req); const ticket = await SupportTicket.findOne({ _id: req.params.id, ...companyScope(req), ...(['EMPLOYEE', 'FINANCE', 'MANAGER', 'SUPERVISOR'].includes(auth.role) ? { userId: auth.userId } : {}) }).select('_id');
  if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
  const comments = await SupportComment.find({ ticketId: ticket._id, ...(auth.role === 'SUPER_ADMIN' ? {} : { isInternal: false }) }).populate('authorId', 'id name email role').sort({ createdAt: 1 }); res.json({ comments });
};

export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const auth = getAuth(req); const ticket = await SupportTicket.findOne({ _id: req.params.id, ...companyScope(req), ...(['EMPLOYEE', 'FINANCE', 'MANAGER', 'SUPERVISOR'].includes(auth.role) ? { userId: auth.userId } : {}) }); const body = String(req.body.body ?? '').trim();
  if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; } if (!body) { res.status(400).json({ message: 'Comment is required' }); return; }
  const comment = await SupportComment.create({ ticketId: ticket._id, authorId: auth.userId, body, isInternal: Boolean(req.body.isInternal) && auth.role === 'SUPER_ADMIN' }); logActivity(req, `Commented on support ticket ${ticket.ticketNo}`, 'Support'); const populated: any = await SupportComment.findById(comment._id).populate('authorId', 'id name email role'); const commentPayload = { ...(populated?.toJSON?.() ?? populated?.toObject?.() ?? populated), id: populated?._id?.toString() ?? populated?.id }; emitSupportComment(ticket._id.toString(), commentPayload);
  const recipientIds = auth.role === 'SUPER_ADMIN' ? [String(ticket.userId)] : (await User.find({ role: 'SUPER_ADMIN', isActive: true }).select('_id').lean()).map((user) => String(user._id));
  await Promise.all(recipientIds.filter((id) => id !== auth.userId).map(async (userId) => {
    const notification: any = await Notification.create({ userId, companyId: ticket.companyId, type: 'SUPPORT_MESSAGE', title: `New reply on ${ticket.ticketNo}`, message: `${auth.role === 'SUPER_ADMIN' ? 'Support' : 'Customer'}: ${body.slice(0, 120)}`, entityType: 'SupportTicket', entityId: ticket._id, dedupeKey: `support:${comment._id}:${userId}` });
    emitUserNotification(userId, { ...(notification.toObject?.() ?? notification), id: notification._id.toString() }); return notification;
  }));
  res.status(201).json(commentPayload);
};

export const getCompaniesForSupport = async (_req: AuthRequest, res: Response): Promise<void> => {
  const req = _req; const filter: Record<string, any> = { isDeleted: { $ne: true } }; if (req.user?.role !== 'SUPER_ADMIN') filter._id = req.user?.companyId;
  const companies = await Company.find(filter).select('id name companyCode').sort({ name: 1 }).lean(); res.json(companies.map((c: any) => ({ id: c._id.toString(), name: c.name, companyCode: getCompanyReference(c._id, c.companyCode) })));
};

export const getSupportAgents = async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ role: { $in: ['SUPER_ADMIN', 'HR', 'COMPANY_ADMIN'] }, ...(req.user?.role === 'SUPER_ADMIN' ? {} : { companyId: req.user?.companyId }) }).select('id name email role').sort({ name: 1 }).lean(); res.json({ users });
};
