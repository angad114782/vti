import { Request, Response } from 'express';
import { PrismaClient, TicketStatus, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

export const getTickets = async (req: Request, res: Response) => {
  const page = (req.query.page as string) || '1';
  const limit = (req.query.limit as string) || '10';
  const search = req.query.search as string | undefined;
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const company = req.query.company as string | undefined;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status as TicketStatus;
  if (priority && priority !== 'ALL') where.priority = priority as TicketPriority;
  if (company && company !== 'ALL') where.companyId = company;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { ticketNo: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const [totalAll, open, inProgress, resolved] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'PENDING' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
  ]);

  res.json({
    tickets,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    stats: { total: totalAll, open, inProgress, resolved },
  });
};

export const getTicket = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      company: { select: { id: true, name: true } },
    },
  });
  if (!ticket) { res.status(404).json({ message: 'Ticket not found' }); return; }
  res.json(ticket);
};

export const createTicket = async (req: Request, res: Response) => {
  const { category, subject, description, priority, companyId } = req.body as {
    category: string; subject: string; description: string;
    priority?: TicketPriority; companyId?: string;
  };

  const user = (req as unknown as { user: { id: string } }).user;
  const ticketNo = `#TKT${Date.now().toString().slice(-6)}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNo,
      userId: user.id,
      companyId: companyId || null,
      category,
      subject,
      description,
      priority: priority ?? 'MEDIUM',
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      company: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(ticket);
};

export const updateTicket = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, priority } = req.body as { status?: TicketStatus; priority?: TicketPriority };

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { ...(status && { status }), ...(priority && { priority }) },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      company: { select: { id: true, name: true } },
    },
  });

  res.json(ticket);
};

export const getCompaniesForSupport = async (_req: Request, res: Response) => {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  res.json(companies);
};
