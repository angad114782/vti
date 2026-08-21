import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/AppError';

/** Rejects non-ObjectId strings before they reach Mongoose. */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

export function validateId(id: string): void {
  const result = objectIdSchema.safeParse(id);
  if (!result.success) throw new AppError('VALIDATION_ERROR', 'Invalid ID format', 400);
}

/** Middleware factory — parses req.body against a zod schema, rejects with 400 on failure. */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: 'Validation error', errors: result.error.flatten().fieldErrors });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Employee Profile ─────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name:  z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email').optional(),
});

// ── Companies ────────────────────────────────────────────────────────────────
const planEnum = z.string().min(1);
const companyStatusEnum = z.enum(['ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED']);

export const createCompanySchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().min(1).optional(),
  plan: planEnum.optional(),
  status: companyStatusEnum.optional(),
  planExpiry: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  adminName: z.string().min(1, 'Admin name is required'),
  adminEmail: z.string().email('Admin email must be valid'),
  adminPassword: z.string().min(8).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID']).optional(),
  paymentReference: z.string().max(200).optional(),
  paymentNotes: z.string().max(2000).optional(),
  paymentDate: z.string().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

// ── Employees ────────────────────────────────────────────────────────────────
export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().optional(),
  designation: z.string().optional(),
  shiftType: z.string().optional(),
  shiftTiming: z.string().optional(),
  joiningDate: z.string().optional(),
  annualCtc: z.coerce.number().min(0).optional(),
  employmentType: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountHolder: z.string().optional(),
  managerId: objectIdSchema.optional(),
});

export const updateEmployeeSchema = z.object({
  department: z.string().optional(),
  designation: z.string().optional(),
  shiftType: z.string().optional(),
  shiftTiming: z.string().optional(),
  annualCtc: z.coerce.number().min(0).optional(),
  status: z.enum(['Invited', 'Onboarding', 'Active', 'Inactive', 'NoticePeriod', 'Terminated', 'Archived']).optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountHolder: z.string().optional(),
  managerId: objectIdSchema.optional(),
  version: z.coerce.number().int().nonnegative().optional(),
});

// ── Leaves / Approvals ───────────────────────────────────────────────────────
const leaveStatusEnum = z.enum(['Pending', 'Approved', 'Rejected']);
const approvalStatusEnum = z.enum(['Pending', 'Approved', 'Rejected']);

export const applyLeaveSchema = z.object({
  leaveType: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'endDate must be YYYY-MM-DD'),
  reason: z.string().optional(),
  isHalfDay: z.boolean().optional(),
});

export const updateLeaveStatusSchema = z.object({
  status: leaveStatusEnum,
  version: z.coerce.number().int().nonnegative().optional(),
});

export const updateApprovalSchema = z.object({
  status: approvalStatusEnum,
  version: z.coerce.number().int().nonnegative().optional(),
});

// ── Expenses ─────────────────────────────────────────────────────────────────
export const submitExpenseSchema = z.object({
  category: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected']),
  version: z.coerce.number().int().nonnegative().optional(),
});

// ── Documents ────────────────────────────────────────────────────────────────
export const createDocumentSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  visibility: z.string().optional(),
  version: z.string().optional(),
  fileSize: z.string().optional(),
  fileUrl: z.string().optional(),
});

// ── Attendance ───────────────────────────────────────────────────────────────
export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'date must be YYYY-MM-DD'),
  checkIn:    z.string().regex(/^\d{2}:\d{2}$/, 'checkIn must be HH:MM').optional(),
  checkOut:   z.string().regex(/^\d{2}:\d{2}$/, 'checkOut must be HH:MM').optional(),
  status:     z.enum(['Present', 'Late', 'Absent', 'Leave', 'Holiday']),
  notes:      z.string().optional(),
});

export const createAttendanceCorrectionSchema = z.object({
  attendanceId: objectIdSchema,
  checkIn: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  checkOut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(['Present', 'Late', 'Absent', 'Leave', 'Holiday']).optional(),
  reason: z.string().trim().min(3).max(1000),
});

export const reviewAttendanceCorrectionSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  reviewerNote: z.string().max(1000).optional(),
});

// ── Company-Admin Users ──────────────────────────────────────────────────────
const userRoleEnum = z.enum(['COMPANY_ADMIN', 'HR', 'SUPERVISOR', 'MANAGER', 'FINANCE', 'EMPLOYEE']);

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleEnum,
  password: z.string().min(8).optional(),
});

export const updateUserSchema = z.object({
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
});

// ── Subscriptions / Plans ────────────────────────────────────────────────────
export const createPlanSchema = z.object({
  name: z.string().min(1),
  type: planEnum,
  price: z.coerce.number().min(0),
  maxUsers: z.coerce.number().int().min(1),
  features: z.array(z.string()).optional(),
});

export const updatePlanSchema = z.object({
  name: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  maxUsers: z.coerce.number().int().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const assignPlanSchema = z.object({
  companyId: z.string().min(1),
  plan: planEnum,
  billingCycle: z.enum(['Monthly', 'Quarterly', 'Annual']).optional(),
  months: z.coerce.number().int().min(1).max(36).optional(),
});

export const updateSubscriptionSchema = z.object({
  billingCycle: z.enum(['Monthly', 'Quarterly', 'Annual']).optional(),
  isActive: z.boolean().optional(),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export const createOfflinePaymentSchema = z.object({
  companyId: objectIdSchema,
  subscriptionId: objectIdSchema.optional(),
  plan: z.string().min(1).optional(),
  billingCycle: z.enum(['Monthly', 'Quarterly', 'Annual']).optional(),
  amount: z.coerce.number().min(0).optional(),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  paidAt: z.string().optional(), reference: z.string().max(200).optional(), notes: z.string().max(2000).optional(),
});
export const updatePaymentSchema = z.object({ status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(), paidAt: z.string().optional(), reference: z.string().max(200).optional(), notes: z.string().max(2000).optional() });
export const checkoutSchema = z.object({
  company: z.object({ name: z.string().min(1), industry: z.string().optional(), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional(), address: z.string().optional(), timezone: z.string().optional() }),
  admin: z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(8) }), plan: z.string().min(1),
});
export const verifyEmailSchema = z.object({ token: z.string().min(32) });

// ── Payroll ──────────────────────────────────────────────────────────────────
export const runPayrollSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  employeeIds: z.array(z.string()).optional(),
});

// ── Shifts ───────────────────────────────────────────────────────────────────
export const createShiftSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'date must be YYYY-MM-DD'),
  shiftName: z.enum(['Morning', 'Evening', 'Night']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().optional(),
});

export const updateShiftSchema = z.object({
  shiftName: z.enum(['Morning', 'Evening', 'Night']).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  status: z.enum(['Assigned', 'Completed', 'Cancelled']).optional(),
  notes: z.string().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
});

export const workflowActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  version: z.coerce.number().int().nonnegative().optional(),
  reason: z.string().max(1000).optional(),
});

export const employeeActionSchema = z.object({
  action: z.enum(['activate', 'start_onboarding', 'start_notice', 'terminate', 'archive']),
  version: z.coerce.number().int().nonnegative().optional(),
});
