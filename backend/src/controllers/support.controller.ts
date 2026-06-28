import { Request, Response } from 'express';
import SupportTicket from '../models/SupportTicket';
import Company from '../models/Company';

export const getTickets = async (req: Request, res: Response) => {
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '10';
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const company = req.query.company as string | undefined;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (priority && priority !== 'ALL') where.priority = priority;
  if (company && company !== 'ALL') where.companyId = company;
  if (search) {
    where.$or = [
      { subject: new RegExp(search, 'i') },
      { ticketNo: new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') },
    ];
  }

  const [tickets, total] = await Promise.all([
    SupportTicket.find(where)
      .populate('userId', 'id name email role')
      .populate('companyId', 'id name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
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
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
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

  const user = (req as unknown as { user: { id: string } }).user;
  const ticketNo = `#TKT${Date.now().toString().slice(-6)}`;

  const ticket = await SupportTicket.create({
    ticketNo,
    userId: user.id,
    companyId: companyId || null,
    category,
    subject,
    description,
    priority: (priority ?? 'MEDIUM') as any,
  });

  const populated = await SupportTicket.findById((ticket as any)._id)
    .populate('userId', 'id name email role')
    .populate('companyId', 'id name');

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

  res.json(ticket);
};

export const getCompaniesForSupport = async (_req: Request, res: Response) => {
  const companies = await Company.find().select('id name').sort({ name: 1 });
  res.json(companies);
};
