import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document';
import Expense from '../models/Expense';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireCompanyId } from '../utils/scope';
import { AppError } from '../core/AppError';
import { getStoredFile, storageUsesMinio } from '../utils/objectStorage';
import { logActivity } from '../utils/activity';

const uploadRoot = path.resolve(__dirname, '..', '..', 'uploads');

export async function downloadFile(req: Request, res: Response): Promise<void> {
  const { category, filename } = req.params as { category: string; filename: string };
  if (!['documents', 'receipts'].includes(category) || !/^[a-zA-Z0-9_.-]+$/.test(filename)) {
    throw new AppError('NOT_FOUND', 'File not found', 404);
  }

  const companyId = requireCompanyId(req);
  const fileUrl = `/api/files/${category}/${filename}`;
  const auth = (req as AuthRequest).user!;

  if (category === 'documents') {
    const doc = await Document.findOne({ companyId, fileUrl }).lean();
    if (!doc) throw new AppError('NOT_FOUND', 'File not found', 404);
    const employeeVisible = ['All Employees', 'Public'].includes(doc.visibility);
    if (!employeeVisible && !['HR', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      throw new AppError('FORBIDDEN', 'You cannot access this document', 403);
    }
  } else {
    const expense = await Expense.findOne({ companyId, receiptUrl: fileUrl }).lean();
    if (!expense) throw new AppError('NOT_FOUND', 'File not found', 404);
    const employee = await import('../models/Employee').then(({ default: Employee }) => Employee.findOne({ _id: expense.employeeId, companyId }).select('userId').lean());
    const owner = employee?.userId?.toString() === auth.userId;
    if (!owner && !['HR', 'FINANCE', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(auth.role)) {
      throw new AppError('FORBIDDEN', 'You cannot access this receipt', 403);
    }
  }

  if (storageUsesMinio) {
    try {
      const stream = await getStoredFile(category, filename) as NodeJS.ReadableStream;
      logActivity(req, `Downloaded ${category === 'documents' ? 'document' : 'receipt'} ${filename}`, 'Files');
      stream.pipe(res);
    }
    catch { throw new AppError('NOT_FOUND', 'File not found', 404); }
    return;
  }
  const target = path.resolve(uploadRoot, category, filename);
  if (!target.startsWith(path.resolve(uploadRoot, category) + path.sep) || !fs.existsSync(target)) throw new AppError('NOT_FOUND', 'File not found', 404);
  logActivity(req, `Downloaded ${category === 'documents' ? 'document' : 'receipt'} ${filename}`, 'Files');
  res.sendFile(target);
}
