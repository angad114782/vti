import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /modules — all modules with optional company toggle state
export const getModules = async (req: Request, res: Response) => {
  const { companyId } = req.query as { companyId?: string };

  const modules = await prisma.module.findMany({ orderBy: { createdAt: 'asc' } });

  let companyModuleMap: Record<string, boolean> = {};
  if (companyId) {
    const cms = await prisma.companyModule.findMany({ where: { companyId } });
    for (const cm of cms) companyModuleMap[cm.moduleId] = cm.isEnabled;
  }

  const data = modules.map((m) => ({
    ...m,
    isEnabled: companyId ? (companyModuleMap[m.id] ?? false) : null,
  }));

  res.json({ modules: data });
};

// GET /modules/companies — companies dropdown
export const getCompaniesForModules = async (_req: Request, res: Response) => {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, plan: true },
    orderBy: { name: 'asc' },
  });
  res.json(companies);
};

// PUT /modules/toggle — toggle a module for a company
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

  const cm = await prisma.companyModule.upsert({
    where: { companyId_moduleId: { companyId, moduleId } },
    update: { isEnabled },
    create: { companyId, moduleId, isEnabled },
  });

  res.json(cm);
};

// GET /modules/permissions?role=Administrator
export const getPermissions = async (req: Request, res: Response) => {
  const { role } = req.query as { role?: string };

  const where = role ? { role } : {};
  const perms = await prisma.rolePermission.findMany({ where, orderBy: [{ module: 'asc' }, { permission: 'asc' }] });

  // Group by module
  const grouped: Record<string, { permission: string; isGranted: boolean }[]> = {};
  for (const p of perms) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module]!.push({ permission: p.permission, isGranted: p.isGranted });
  }

  res.json({ role: role ?? null, permissions: grouped });
};

// PUT /modules/permissions — update a single permission toggle
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

  const updated = await prisma.rolePermission.update({
    where: { role_permission: { role, permission } },
    data: { isGranted },
  });

  res.json(updated);
};
