import { Request, Response } from 'express';
import SupportTicket from '../models/SupportTicket';
import Company from '../models/Company';
import { escapeRegex, clampLimit } from '../utils/query';
import { getUserId } from '../utils/authContext';
import { logActivity } from '../utils/activity';

export const getTickets = async (req: Request, res: Response) => {
  const page = (req.query.page as string) || '1';
  const limit = clampLimit(req.query.limit as string | undefined);
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const company = req.query.company as string | undefined;
  const skip = (parseInt(page) - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (priority && priority !== 'ALL') where.priority = priority;
  if (company && company !== 'ALL') where.companyId = company;
  if (search) {
    const re = escapeRegex(search);
    where.$or = [
      { subject: re },
      { ticketNo: re },
      { category: re },
    ];
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(where)
      .populate('userId', 'id name email role')
      .populate('companyId', 'id name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(where),
  ]);

  const [totalAll, open, inProgress, resolved] = await Promise.all([
    SupportTicket.countDocuments(),
    SupportTicket.countDocuments({ status: 'PENDING' }),
    SupportTicket.countDocuments({ status: 'IN_PROGRESS' }),
    SupportTicket.countDocuments({ status: 'RESOLVED' }),
  ]);

  res.json({
    tickets,
    pagination: { total, page: parseInt(page), limit, totalPages: Math.ceil(total / limit) },
    stats: { total: totalAll, open, inProgress, resolved },
  });
};

export const getTicket = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const ticket = await SupportTicket.findById(id)
    .populate('userId', 'id name email role')
    .populate('companyId', 'id name');
  if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
  res.json(ticket);
};

export const createTicket = async (req: Request, res: Response) => {
  const { category, subject, description, priority, companyId } = req.body as {
    category: string; subject: string; description: string;
    priority?: string; companyId?: string;
  };

  const userId = getUserId(req);
  const today = new Date();
  const datePart = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear()}`;
  const prefix = `TKT-${datePart}-`;
  const countToday = await SupportTicket.countDocuments({ ticketNo: { $regex: `^${prefix}` } });
  const ticketNo = `${prefix}${String(countToday + 1).padStart(4, '0')}`;

  const ticket = await SupportTicket.create({
    ticketNo,
    userId,
    companyId: companyId || null,
    category,
    subject,
    description,
    priority: (priority ?? 'MEDIUM') as any,
  });

  const populated = await SupportTicket.findById((ticket as any)._id)
    .populate('userId', 'id name email role')
    .populate('companyId', 'id name');

  logActivity(req, `Created support ticket ${ticketNo}: ${subject}`, 'Support');
  res.status(201).json(populated);
};

export const updateTicket = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, priority } = req.body as { status?: string; priority?: string };

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (priority) update.priority = priority;

  const ticket = await SupportTicket.findByIdAndUpdate(id, update, { new: true })
    .populate('userId', 'id name email role')
    .populate('companyId', 'id name');

  if (ticket) {
    const changes = [status && `status → ${status}`, priority && `priority → ${priority}`].filter(Boolean).join(', ');
    logActivity(req, `Updated ticket ${(ticket as any).ticketNo}: ${changes}`, 'Support');
  }
  res.json(ticket);
};

export const getCompaniesForSupport = async (_req: Request, res: Response) => {
  const companies = await Company.find().select('id name').sort({ name: 1 });
  res.json(companies);
};
