import { Request } from 'express';
import { AppError } from '../core/AppError';
import { getCompanyId } from './authContext';

export function requireCompanyId(req: Request): string {
  const companyId = getCompanyId(req);
  if (!companyId) throw new AppError('COMPANY_CONTEXT_REQUIRED', 'Company context required', 403);
  return companyId;
}

export function companyScope(req: Request): { companyId: string } {
  return { companyId: requireCompanyId(req) };
}

export function assertCompanyId(value: unknown, companyId: string): void {
  if (!value || String(value) !== companyId) {
    throw new AppError('FORBIDDEN', 'Resource does not belong to this company', 403);
  }
}
