import { Request, Response } from 'express';
import Document from '../models/Document';

const getCompanyId = (req: Request) => (req as unknown as { user: { companyId?: string } }).user.companyId;

export const getDocuments = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { search, category, visibility } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { companyId };
  if (category && category !== 'ALL') where.category = category;
  if (visibility && visibility !== 'ALL') where.visibility = visibility;
  if (search) where.name = new RegExp(search, 'i');

  const docs = await Document.find(where).sort({ createdAt: -1 });
  res.json(docs);
};

export const createDocument = async (req: Request, res: Response) => {
  const companyId = getCompanyId(req);
  const { name, category, visibility, version, fileSize } = req.body as Record<string, string>;

  if (!name || !category) { res.status(400).json({ message: 'Name and category required' }); return; }

  const doc = await Document.create({
    name,
    category,
    uploadedBy: 'HR Admin',
    companyId,
    visibility: visibility ?? 'All Employees',
    version: version ?? 'v1.0',
    fileSize: fileSize ?? '—',
  });
  res.status(201).json(doc);
};

export const deleteDocument = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await Document.findByIdAndDelete(id);
  res.json({ message: 'Document deleted' });
};
