import { Request, Response } from 'express';
import Company from '../models/Company';
import User from '../models/User';
import Employee from '../models/Employee';
import Document from '../models/Document';
import { escapeRegex } from '../utils/query';
import { getCompanyReference } from '../utils/companyReference';

const MAX_QUERY_LENGTH = 100;
const LIMIT = 5;

export const globalSearch = async (req: Request, res: Response): Promise<void> => {
  const raw = typeof req.query.q === 'string' ? req.query.q : '';
  const q = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);
  if (q.length < 2) { res.json({ query: q, companies: [], employees: [], users: [], documents: [] }); return; }

  const re = escapeRegex(q);
  const user = (req as any).user as { role?: string; companyId?: string } | undefined;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const companyScope = !isSuperAdmin && user?.companyId ? { companyId: user.companyId } : {};

  const companiesPromise = isSuperAdmin
    ? Company.find({ isDeleted: { $ne: true }, $or: [{ name: re }, { companyCode: re }, { email: re }, { industry: re }] })
      .select('_id name companyCode industry').sort({ name: 1 }).limit(LIMIT).lean()
    : Promise.resolve([]);

  const matchingUserIdsPromise = User.find({ ...companyScope, $or: [{ name: re }, { nameSearch: re }, { email: re }, { emailSearch: re }] }).select('_id').limit(100).lean();
  const employeesPromise = matchingUserIdsPromise.then((matchingUsers) => Employee.find({ ...companyScope, $or: [{ employeeId: re }, { employeeIdSearch: re }, { designation: re }, { designationSearch: re }, { department: re }, { departmentSearch: re }, { userId: { $in: matchingUsers.map((u) => u._id) } }] })
    .populate('userId', 'name email').populate('companyId', 'name companyCode').sort({ employeeId: 1 }).limit(LIMIT).lean());

  const usersPromise = User.find({ ...companyScope, $or: [{ name: re }, { nameSearch: re }, { email: re }, { emailSearch: re }] })
    .populate('companyId', 'name companyCode').select('name email role companyId').sort({ name: 1 }).limit(LIMIT).lean();

  const documentsPromise = Document.find({ ...companyScope, $or: [{ name: re }, { nameSearch: re }] })
    .select('_id name category companyId createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean();

  const [companies, employees, users, documents] = await Promise.all([companiesPromise, employeesPromise, usersPromise, documentsPromise]);

  res.json({
    query: q,
    companies: companies.map((c: any) => ({ id: c._id.toString(), type: 'company', name: c.name, companyCode: getCompanyReference(c._id, c.companyCode), subtitle: c.industry ?? 'Company' })),
    employees: employees.filter((e: any) => e.userId).map((e: any) => ({ id: e._id.toString(), type: 'employee', name: e.userId.name, employeeId: e.employeeId, companyId: e.companyId?._id?.toString(), companyName: e.companyId?.name, companyCode: getCompanyReference(e.companyId?._id, e.companyId?.companyCode), subtitle: e.department ?? e.designation ?? 'Employee' })),
    users: users.map((u: any) => ({ id: u._id.toString(), type: 'user', name: u.name, email: u.email, role: u.role, companyId: u.companyId?._id?.toString(), companyName: u.companyId?.name, companyCode: getCompanyReference(u.companyId?._id, u.companyId?.companyCode), subtitle: u.role })),
    documents: documents.map((d: any) => ({ id: d._id.toString(), type: 'document', name: d.name, companyId: d.companyId?.toString(), subtitle: d.category ?? 'Document' })),
  });
};
