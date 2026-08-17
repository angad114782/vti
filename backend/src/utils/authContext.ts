import { Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

/** Returns the authenticated user attached by the auth middleware. */
export function getAuth(req: Request) {
  return (req as AuthRequest).user!;
}

/** Returns the companyId from the authenticated user's JWT payload. */
export function getCompanyId(req: Request): string | undefined {
  return (req as AuthRequest).user?.companyId;
}

/** Returns the userId from the authenticated user's JWT payload. */
export function getUserId(req: Request): string {
  return (req as AuthRequest).user!.userId;
}

/** Returns the role from the authenticated user's JWT payload. */
export function getRole(req: Request): string {
  return (req as AuthRequest).user!.role;
}
