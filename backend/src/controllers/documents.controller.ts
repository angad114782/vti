import { Request, Response } from 'express';
import Document from '../models/Document';
import { escapeRegex, parsePagination, paginationMeta } from '../utils/query';
import { logActivity } from '../utils/activity';
import { getCompanyId, getAuth } from '../utils/authContext';
import { validateId } from '../utils/validate';
import { requireCompanyId } from '../utils/scope';

export const getDocuments = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const { search, category, visibility } = req.query as Record<string, string>;
  const { page, limit, skip } = parsePagination(req.query as Record<string, string>);

  const where: Record<string, unknown> = { companyId };
  if (category && category !== 'ALL') where.category = category;
  if (visibility && visibility !== 'ALL') where.visibility = visibility;
  if (search) where.nameSearch = escapeRegex(search);

  const [docs, total] = await Promise.all([
    Document.find(where).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Document.countDocuments(where),
  ]);
  res.json({ documents: docs, pagination: paginationMeta(total, page, limit) });
};

export const createDocument = async (req: Request, res: Response) => {
  const companyId = requireCompanyId(req);
  const { name, category, visibility, version, fileSize, fileUrl } = req.body as Record<string, string>;

  if (!name || !category) { res.status(400).json({ message: 'Name and category required' }); return; }

  const doc = await Document.create({
    name,
    category,
    uploadedBy: getAuth(req).email,
    companyId,
    visibility: visibility ?? 'All Employees',
    version: version ?? 'v1.0',
    fileSize: fileSize ?? '—',
    fileUrl,
  });
  logActivity(req, `Created document "${name}"`, 'Documents');
  res.status(201).json(doc);
};

export const deleteDocument = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  validateId(id);
  const companyId = requireCompanyId(req);
  const doc = await Document.findOne({ _id: id, companyId }).lean();
  if (!doc) { res.status(404).json({ message: 'Document not found' }); return; }
  await Document.deleteOne({ _id: id, companyId });
  logActivity(req, `Deleted document "${(doc as any)?.name ?? id}"`, 'Documents');
  res.json({ message: 'Document deleted' });
};
