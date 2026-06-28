import { Request, Response } from 'express';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';
import RolePermission from '../models/RolePermission';
import Company from '../models/Company';

export const getModules = async (req: Request, res: Response) => {
  const { companyId } = req.query as { companyId?: string };

  const modules = await Module.find().sort({ createdAt: 1 });

  let companyModuleMap: Record<string, boolean> = {};
  if (companyId) {
    const cms = await CompanyModule.find({ companyId }).lean();
    for (const cm of cms) companyModuleMap[cm.moduleId.toString()] = cm.isEnabled;
  }

  const data = modules.map((m) => ({
    ...m.toJSON(),
    isEnabled: companyId ? (companyModuleMap[m._id.toString()] ?? false) : null,
  }));

  res.json({ modules: data });
};

export const getCompaniesForModules = async (_req: Request, res: Response) => {
  const companies = await Company.find().select('id name plan').sort({ name: 1 });
  res.json(companies);
};

export const toggleModule = async (req: Request, res: Response) => {
  const { companyId, moduleId, isEnabled } = req.body as {
    companyId: string;
    moduleId: string;
    isEnabled: boolean;
  };

  if (!companyId || !moduleId) {
    res.status(400).json({ message: 'companyId and moduleId required' });
    return;
  }

  const cm = await CompanyModule.findOneAndUpdate(
    { companyId, moduleId },
    { isEnabled },
    { upsert: true, new: true },
  );

  res.json(cm);
};

export const getPermissions = async (req: Request, res: Response) => {
  const { role } = req.query as { role?: string };

  const where = role ? { role } : {};
  const perms = await RolePermission.find(where).sort({ module: 1, permission: 1 });

  const grouped: Record<string, { permission: string; isGranted: boolean }[]> = {};
  for (const p of perms) {
    const mod = p.get('module') as string;
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod]!.push({ permission: p.get('permission'), isGranted: p.get('isGranted') });
  }

  res.json({ role: role ?? null, permissions: grouped });
};

export const updatePermission = async (req: Request, res: Response) => {
  const { role, permission, isGranted } = req.body as {
    role: string;
    permission: string;
    isGranted: boolean;
  };

  if (!role || !permission) {
    res.status(400).json({ message: 'role and permission required' });
    return;
  }

  const updated = await RolePermission.findOneAndUpdate(
    { role, permission },
    { isGranted },
    { new: true },
  );

  res.json(updated);
};
