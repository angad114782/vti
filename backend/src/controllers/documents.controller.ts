import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getDocuments = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, category, visibility } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (category && category !== 'ALL') where.category = category;
  if (visibility && visibility !== 'ALL') where.visibility = visibility;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const docs = await prisma.document.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(docs);
};

export const createDocument = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { name, category, visibility, version, fileSize } = req.body as Record<string, string>;

  if (!name || !category) { res.status(400).json({ message: 'Name and category required' }); return; }

  const doc = await prisma.document.create({
    data: { name, category, uploadedBy: 'HR Admin', companyId: companyId!, visibility: visibility ?? 'All Employees', version: version ?? 'v1.0', fileSize: fileSize ?? '—' },
  });
  res.status(201).json(doc);
};

export const deleteDocument = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.document.delete({ where: { id } });
  res.json({ message: 'Document deleted' });
};
