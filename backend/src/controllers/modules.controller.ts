import { Request, Response } from 'express';
import Module from '../models/Module';
import CompanyModule from '../models/CompanyModule';
import RolePermission from '../models/RolePermission';
import Company from '../models/Company';
import { validateId } from '../utils/validate';
import { DEFAULT_PERMISSIONS, PERMISSIONS } from '../config/access';

const PERMISSION_GROUPS: Record<string, string[]> = {
  ATTENDANCE: [PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_EDIT],
  WORKFORCE: [PERMISSIONS.WORKFORCE_VIEW, PERMISSIONS.WORKFORCE_EDIT],
  REPORTS: [PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_DOWNLOAD],
  PAYROLL: [PERMISSIONS.PAYROLL_VIEW, PERMISSIONS.PAYROLL_PROCESS],
};

const permissionGroup = (permission: string) => Object.entries(PERMISSION_GROUPS).find(([, values]) => values.includes(permission))?.[0] ?? 'GENERAL';

export const getModules = async (req: Request, res: Response) => {
  const { companyId } = req.query as { companyId?: string };

  const modules = await Module.find().sort({ createdAt: 1 });

  let companyModuleMap: Record<string, boolean> = {};
  if (companyId) {
    validateId(companyId);
    if (!await Company.exists({ _id: companyId })) { res.status(404).json({ message: 'Company not found' }); return; }
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
  validateId(companyId);
  validateId(moduleId);
  if (typeof isEnabled !== 'boolean') { res.status(400).json({ message: 'isEnabled must be boolean' }); return; }
  const [company, module] = await Promise.all([Company.exists({ _id: companyId }), Module.exists({ _id: moduleId })]);
  if (!company || !module) { res.status(404).json({ message: 'Company or module not found' }); return; }

  const cm = await CompanyModule.findOneAndUpdate(
    { companyId, moduleId },
    { isEnabled },
    { upsert: true, returnDocument: "after" },
  );

  res.json(cm);
};

export const getPermissions = async (req: Request, res: Response) => {
  const { role } = req.query as { role?: string };

  const where = role ? { role, companyId: { $exists: false } } : { companyId: { $exists: false } };
  const perms = await RolePermission.find(where).sort({ module: 1, permission: 1 });

  const grouped: Record<string, { permission: string; isGranted: boolean }[]> = {};
  for (const p of perms) {
    const mod = p.get('module') as string;
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod]!.push({ permission: p.get('permission'), isGranted: p.get('isGranted') });
  }

  // Return the catalogue defaults even when a fresh environment has not been seeded.
  if (role) {
    for (const [module, names] of Object.entries(PERMISSION_GROUPS)) {
      grouped[module] ??= [];
      for (const permission of names) {
        if (!grouped[module]!.some((item) => item.permission === permission)) {
          grouped[module]!.push({
            permission,
            isGranted: DEFAULT_PERMISSIONS[role]?.includes('*') || DEFAULT_PERMISSIONS[role]?.includes(permission) || false,
          });
        }
      }
    }
    const dashboard = perms.find((p) => p.get('permission') === PERMISSIONS.DASHBOARD);
    grouped.GENERAL ??= [{
      permission: PERMISSIONS.DASHBOARD,
      isGranted: dashboard?.get('isGranted') ?? DEFAULT_PERMISSIONS[role]?.includes(PERMISSIONS.DASHBOARD) ?? false,
    }];
  }

  res.json({ role: role ?? null, permissions: grouped });
};

export const createModule = async (req: Request, res: Response) => {
  const { name, description, availableFor } = req.body as {
    name: string; description?: string; availableFor?: string[];
  };
  if (!name) { res.status(400).json({ message: 'Name is required' }); return; }
  const existing = await Module.findOne({ name }).lean();
  if (existing) { res.status(409).json({ message: 'A module with this name already exists' }); return; }
  const mod = await Module.create({ name, description, availableFor: availableFor ?? [] });
  res.status(201).json(mod);
};

export const updateModule = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { name, description, availableFor } = req.body as {
    name?: string; description?: string; availableFor?: string[];
  };
  validateId(id);
  const mod = await Module.findByIdAndUpdate(
    id,
    {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(availableFor ? { availableFor } : {}),
    },
    { returnDocument: 'after' },
  );
  if (!mod) { res.status(404).json({ message: 'Module not found' }); return; }
  res.json(mod);
};

export const deleteModule = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  validateId(id);
  const inUse = await CompanyModule.countDocuments({ moduleId: id });
  if (inUse > 0) {
    res.status(409).json({ message: `Cannot delete — this module is assigned to ${inUse} company/companies` });
    return;
  }
  await Module.findByIdAndDelete(id);
  res.json({ message: 'Module deleted' });
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
  if (typeof isGranted !== 'boolean') { res.status(400).json({ message: 'isGranted must be boolean' }); return; }

  const updated = await RolePermission.findOneAndUpdate(
    { role, permission, companyId: { $exists: false } },
    { $set: { role, module: permissionGroup(permission), permission, isGranted } },
    { returnDocument: 'after', upsert: true },
  );
  res.json(updated);
};
