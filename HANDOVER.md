# Vook (VTI) — Project Handover & Session Context

> **Generated:** 2026-08-16 (Session 20 — TanStack Query migration + node-cache backend + Support activity logging fix)
> **Purpose:** Complete context for continuing work in a new AI session.
> Load with: `/read d:/Projects/vook/vti/HANDOVER.md`
> **Mirror:** [`../HANDOVER.md`](../HANDOVER.md) — keep both files in sync.

---

## 1. What Is This Project?

**Vook / VTI** is a multi-tenant HR/Payroll/Attendance/Approvals SaaS platform.

**Stack:**
- **Backend:** Express 5 + Mongoose + MongoDB, TypeScript — `d:/Projects/vook/vti/backend/`
- **Frontend:** React 19 + Vite + TypeScript + Tailwind 4 + Zustand + Axios + Recharts + Radix — `d:/Projects/vook/vti/frontend/`
- **Monorepo scripts:** `d:/Projects/vook/vti/package.json` — `npm run dev`, `npm run build`, `npm run seed`

**Roles:** SUPER_ADMIN, COMPANY_ADMIN, HR, FINANCE, MANAGER, SUPERVISOR, EMPLOYEE

---

## 2. Production Readiness Summary (Session 5 Audit)

| Area | Readiness | Status |
|---|---|---|
| Core HR (attendance, employees, leaves, expenses, documents) | ~90% | Production-viable; all APIs real |
| Payroll processing (run, generate, compliance) | ~50% | Run endpoint works; Step 3 UI shows fake ₹ amounts; compliance is stub |
| Billing & payments (SaaS subscriptions) | ~40% | Admin records only, no gateway |
| Reports & analytics | ~75% | All 4 report types wired; Super Admin revenue trend chart live |
| Settings pages | ~92% | All role settings wired; toast feedback on all save/error; auth store updates live |
| DevOps & quality (tests, CI, error UX) | ~35% | Deploy exists; zero tests |

**Overall:** ~70% complete. HR MVP (no payroll run, no payment) is ~90%.

**Backend status: 100% real** — all 17 controllers, 60+ endpoints, 20 models hit the database. Zero stubs.

---

## 3. TypeScript Status

Run before each session:

```bash
cd vti/backend  && npx tsc --noEmit
cd vti/frontend && npx tsc --noEmit
```

Last verified Session 20: **0 errors** in both backend and frontend.

---

## 4. Dev Server Commands

```bash
# Both (from repo root)
cd d:/Projects/vook/vti
npm run dev

# Backend only
cd d:/Projects/vook/vti/backend
npm run dev        # nodemon + ts-node → http://localhost:5001

# Frontend only
cd d:/Projects/vook/vti/frontend
npm run dev        # vite → http://localhost:5173
```

Backend port: `process.env.PORT || 5001`.
Frontend proxy: `/api` and `/uploads` → backend (see `vite.config.ts`).

Frontend proxy targets backend port **5001** in `vite.config.ts`.

---

## 5. Environment Variables (backend `.env`)

See `vti/backend/.env.example`:

```
MONGODB_URI=mongodb://...
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRES_IN=15m          # optional
JWT_REFRESH_EXPIRES_IN=7d          # optional
PORT=5001                           # optional
NODE_ENV=development                # optional
CLIENT_URL=http://localhost:5173   # optional in dev, required in prod
SUPER_ADMIN_EMAIL=admin@vook.com   # seed only
SUPER_ADMIN_PASSWORD=Admin@123     # seed only
```

Upload storage is local disk at `backend/uploads/{documents,receipts,general}/` — not configurable via env.

---

## 6. Key Architecture Patterns

### Server-Side Pagination (every list endpoint)
**Backend:**
```typescript
const { page, limit, skip } = parsePagination(req.query as Record<string, string>);
const [items, total] = await Promise.all([
  Model.find(where).sort(...).skip(skip).limit(limit).lean(),
  Model.countDocuments(where),
]);
res.json({ items, pagination: paginationMeta(total, page, limit) });
```

**Frontend:**
```typescript
import { useDebouncedValue } from '../../hooks/useDebouncedValue';   // ← correct path
import PaginationBar from '../../components/data/Pagination';
import type { Pagination } from '../../api/hr';

const [pagination, setPagination] = useState<Pagination>({ total:0, page:1, limit:20, totalPages:1 });
const [page, setPage] = useState(1);
const debouncedSearch = useDebouncedValue(search, 300);
// reset page to 1 on search/filter change
```

### Multi-Tenancy
Every controller scopes queries by `companyId` from `req.user`:
```typescript
import { getCompanyId } from '../utils/authContext';  // ← canonical helper
const companyId = getCompanyId(req);  // returns string | undefined
const where = { companyId };
```
**Do NOT use** the old `(req as unknown as {...}).user.companyId` pattern — it has been removed from all controllers.

### Status String Casing
- Mongoose models: **Capitalized** — `'Pending'`, `'Approved'`, `'Rejected'`, `'Active'`, `'Inactive'`, `'Present'`, `'Late'`, `'Absent'`
- Company status: **ALL_CAPS** — `'ACTIVE'`, `'TRIAL'`, `'EXPIRED'`, `'SUSPENDED'`
- User role: **ALL_CAPS** — `'HR'`, `'MANAGER'`, `'EMPLOYEE'`, etc.

### `.lean()` Rule
After `.lean()`, Mongoose returns plain JS objects — use **direct property access** (`doc.status`), never `.get('field')`.

### Activity Logging
```typescript
import { logActivity } from '../utils/activity';
logActivity(req, `Created employee ${name}`, 'Employees'); // fire-and-forget
```

### useDebouncedValue Location
**IMPORTANT:** `useDebouncedValue` lives at `vti/frontend/src/hooks/useDebouncedValue.ts`
**NOT** in `components/data/` — that path is wrong and will cause a TS error.

### File Uploads (local disk)
```typescript
// Backend: vti/backend/src/middleware/upload.ts
// HR: POST /api/hr/documents/upload  → { fileUrl, fileSize, name }
// Employee: POST /api/employee/expenses/upload → { fileUrl }
// Static serve: GET /uploads/* from backend/uploads/
```

### Atomic Company Creation (Session 5)
`POST /api/companies` now creates Company + COMPANY_ADMIN user in one request.
- `adminName` + `adminEmail` are **required** on creation
- `adminPassword` is optional — auto-generated (12-byte base64url) if omitted
- Response includes `adminGeneratedPassword` (one-time) only when auto-generated
- If user creation fails, company is rolled back (deleted) and 500 returned
- Duplicate `adminEmail` returns 409 before any DB write

```typescript
// createCompanySchema (validate.ts) now includes:
adminName: z.string().min(1),
adminEmail: z.string().email(),
adminPassword: z.string().min(8).optional(),
```

### User Profile Update (Session 6)
Two endpoints added for updating name/email, accessible to all roles:

**`PATCH /api/auth/me`** — any authenticated role (HR, Manager, Finance, Supervisor, etc.)
- Body: `{ name?: string, email?: string }` (validated by `updateProfileSchema`)
- Returns `{ name, email }` on success; 409 if email already taken

**`PATCH /api/employee/profile`** — EMPLOYEE role (and HR, SUPER_ADMIN)
- Same body/response shape; same validation schema
- Used by `EmployeeSettingsPage` Save Changes button

Frontend:
- `employeeApi.updateProfile(data)` in `api/employee.ts` calls `PATCH /employee/profile`
- HR/Manager/Finance/Supervisor settings pages call `api.patch('/auth/me', ...)` directly

---

## 7. Backend Routes

| Route prefix | File |
|---|---|
| `/api/auth` | auth.routes.ts |
| `/api/companies` | companies.routes.ts |
| `/api/subscriptions` | subscriptions.routes.ts |
| `/api/activity` | activity.routes.ts |
| `/api/modules` | modules.routes.ts |
| `/api/support` | support.routes.ts |
| `/api/hr` | hr.routes.ts |
| `/api/finance` | finance.routes.ts |
| `/api/employee` | employee.routes.ts |
| `/api/company-admin` | company-admin.routes.ts |
| `/uploads/*` | static (index.ts) |
| `/api/health` | inline (index.ts) |

### HR Routes (`/api/hr/*`)
```
GET  /employees              managerAccess
GET  /employees/departments  managerAccess
GET  /employees/:id          managerAccess
POST /employees              hrOnly + validateBody
PATCH /employees/:id         hrOnly + validateBody
GET  /attendance             managerAccess   ← overview (stats + dept breakdown)
GET  /attendance/records     managerAccess   ← paginated daily records
POST /attendance             hrOnly          ← manual entry
POST /documents/upload       hrOnly          ← multer file upload
GET  /leaves                 managerAccess
PATCH /leaves/:id            managerAccess
GET  /approvals              managerAccess
PATCH /approvals/:id         managerAccess
GET  /payroll/salary         hrOnly          ← read-only
GET  /payroll/payslips       hrOnly          ← read-only
POST /payroll/run            hrOnly          ← generate payslips
GET  /reports/workforce      managerAccess
GET  /reports/leave          managerAccess
GET  /reports/payroll        managerAccess
GET  /reports/attendance     managerAccess
GET  /shifts                 managerAccess
POST /shifts                 hrOnly
PATCH /shifts/:id            hrOnly
GET  /documents              hrOnly
POST /documents              hrOnly
DELETE /documents/:id        hrOnly
```

### Employee Routes (`/api/employee/*`)
```
GET   /profile
PATCH /profile               ← update name/email (updateProfileSchema)
GET   /attendance             ← monthly records
GET  /attendance/today       ← today's check-in record or null
POST /attendance/checkin     ← self check-in
POST /attendance/checkout    ← self check-out
GET  /leaves
POST /leaves
GET  /payslips
GET  /expenses
POST /expenses/upload        ← multer receipt upload
POST /expenses
GET  /documents
```

### Company-Admin Routes (`/api/company-admin/*`)
```
GET  /dashboard
GET|POST|PATCH|DELETE /users
GET  /departments
GET|PATCH /company
GET|PATCH /modules/:moduleId
GET  /activity
GET|PUT /role-permissions
GET  /workflows
PUT  /workflows/:type        ← leave | expense | correction
GET  /reports/workforce
GET  /reports/leave
GET  /reports/payroll
GET  /reports/attendance
```

---

## 8. Backend Models (all in `vti/backend/src/models/`)

| Model | Key fields | Notes |
|---|---|---|
| **Attendance** | employeeId, companyId, date, checkIn, checkOut, status, source, notes | Unique (employeeId, date) |
| **Company** | …existing fields… + `isDeleted` (Boolean, indexed) + `deletedAt` (Date) | Soft delete — hard delete replaced |
| **Workflow** | companyId, type (leave/expense/correction), steps[], autoEscalate | Config only — step order enforced; no timer/auto-escalation |
| ActivityLog | userId, companyId, action, module, status | Audit trail |
| Approval | employeeId, companyId, type, details, date, priority, status, workflowStep, pendingRole | |
| Company | name, industry, email, phone, address, logo, plan, status, maxUsers, planExpiry | |
| CompanyModule | Per-tenant module toggles | Route-enforced via `requireModule` middleware (Payroll + Expenses) |
| Document | name, category, uploadedBy, companyId, fileSize, fileUrl | Upload via multer; no disk cleanup on delete |
| Employee | employeeId, userId, companyId, department, designation, shiftType, annualCtc, bankName, branchName, accountHolder | |
| Expense | employeeId, companyId, category, amount, receiptUrl, status, workflowStep, pendingRole | Receipt upload via multer |
| LeaveRequest | employeeId, companyId, leaveType, startDate, endDate, days, reason, status, workflowStep, pendingRole | |
| Module | Feature module definitions | |
| Payslip | payslipId, employeeId, companyId, period, month, year, grossSalary, totalDeductions, **netPay**, status | Run endpoint exists; schema has grossSalary + totalDeductions |
| Plan | Pricing tiers | |
| RefreshToken | Token rotation storage | |
| RolePermission | role, module, permission, isGranted, companyId | Stored, not route-enforced |
| SalaryStructure | employeeId, companyId, annualCtc, lastRevised | |
| Shift | employeeId, companyId, department, date, shiftName, startTime, endTime, status | Live shift management |
| Subscription | companyId, plan, billingCycle, amount, dates, isActive | No payment gateway |
| SupportTicket | Support ticket fields | |
| User | email, password, name, role, avatar, isActive, companyId | bcryptjs v3.0.3 |

**Missing models (not yet implemented):** `PlatformSettings`, `NotificationPreference`, `PaymentTransaction`, `ComplianceSettings`

---

## 9. Frontend API Files (`vti/frontend/src/api/`)

| File | What it covers |
|---|---|
| `axios.ts` | Base axios instance, 401→refresh→retry interceptor |
| `hr.ts` | employees, leaves, approvals, salary, payslips, documents, attendance, shifts, reports, **uploadDocumentFile**, **runPayroll** |
| `finance.ts` | attendance, employees, salary, payslips, expenses, reports, **runPayroll** |
| `companyAdmin.ts` | dashboard, users CRUD, departments, company, modules, activity, role-permissions, **workflows**, **reports (4 types)** |
| `companies.ts` | getAll, getOne, create (returns `CreateCompanyResponse` with optional `adminGeneratedPassword`), update, delete |
| `employee.ts` | profile, attendance, leaves, expenses, payslips, documents, **uploadReceiptFile** |
| `activity.ts` | getAll, getCompanies |
| `subscriptions.ts` | subscriptions CRUD + plans + **`getRevenueTrend()`** (new) |
| `modules.ts` | modules |
| `support.ts` | support tickets |

### Shared Types
- `Pagination` interface: `{ total, page, limit, totalPages }` — exported from `vti/frontend/src/api/hr.ts`
- `AttendanceRecord` (HR-side): exported from `vti/frontend/src/api/hr.ts`
- `TodayAttendance` (employee self-service): exported from `vti/frontend/src/api/employee.ts`
- `WorkflowData`, `WorkflowStep`: exported from `vti/frontend/src/api/companyAdmin.ts`
- `CreateCompanyResponse`: exported from `vti/frontend/src/api/companies.ts` — extends `Company` with `adminEmail` + optional `adminGeneratedPassword`

---

## 10. What Is FULLY DONE (real APIs, wired UI)

### Backend — core platform
- JWT auth with access + refresh token rotation, `/auth/me`, `PATCH /auth/me`, change-password
- Auth hydration on frontend boot via `authStore.hydrate()` in `main.tsx`
- RBAC middleware `requireRole()` (role-level; permission/module toggles stored but not route-enforced)
- Security: helmet, cors, compression, morgan, rate-limit (global 500/15m + login 20/15m)
- Bcrypt (10 rounds, bcryptjs v3.0.3), env validation at boot, graceful shutdown
- `GET /api/health`
- Pagination helpers: `parsePagination`, `paginationMeta`, `escapeRegex`
- Zod validation on mutating endpoints
- Activity logging: `logActivity(req, action, module)`
- `.lean()` on read-only queries
- **File uploads** — multer + local disk (`middleware/upload.ts`), documents + expense receipts
- **Attendance** — full implementation (model + controller + routes + self check-in/out)
- **Workflows** — config CRUD (model + controller + routes); step order enforced on approve/reject; no auto-escalation timer
- **Reports** — 4 aggregation endpoints across CA, HR, Finance, Manager roles
- **Shifts** — live shift management model + controller + routes
- **Payroll run** — `POST /hr/payroll/run` and `POST /finance/payroll/run` exist and generate payslips
- **Atomic company creation** — `POST /api/companies` creates Company + COMPANY_ADMIN user; rollback on failure; one-time generated password returned

### Controllers — all real (17 files)
`auth`, `companies`, `subscriptions`, `activity`, `modules`, `support`, `employees`, `attendance`, `leaves`, `approvals`, `expenses`, `documents`, `payroll`, `company-admin`, `employee`, `workflows`, `shifts`

### Frontend — fully wired pages (~51 screens)

**Super-Admin:** Dashboard (with live Revenue Trend chart), Companies (with admin credential creation + GeneratedPasswordModal), Subscriptions, Activity, Modules, Support

**Company-Admin:** Dashboard, Attendance (3 tabs), Approvals, Reports (CSV), Roles & Permissions, Workflows, Users, Departments, Activity, Modules, Company Settings; payroll sub-pages: Salary Structure, Payslips, Overview, Run (API wired, Step 3 UI has fake summary), Reports

**HR:** Dashboard, Employees (full CRUD modal), Attendance (overview + records + manual entry), Leave Management, Approvals, Payroll lists, Documents (upload/delete), Shifts

**Finance:** Dashboard, Salary Structure, Payslips, Expenses (approve/reject), Reports

**Manager:** Dashboard, Workforce, Approvals, Attendance (overview + daily records), Reports

**Supervisor:** Dashboard, Workforce, Attendance (overview + daily records), Shift Management, Approvals

**Employee:** Dashboard, My Attendance (check-in/out + monthly), My Leave, My Expenses (receipt upload), My Payslips (row-click detail modal; Download disabled pending PDF), Documents (Eye+Download open fileUrl), Settings (profile save + password change real)

**TanStack Query + node-cache:** Full client-side cache layer across all 57 frontend pages. Server-side in-memory TTL cache on 8 expensive read endpoints. See Section 15 for architecture details.

---

## 11. What Is NOT Done / Known Gaps (priority order)

### P0 — Breaks usability on live data

| # | Feature | Location | What's needed |
|---|---|---|---|
| 1 | **HR manual attendance uses raw MongoDB `_id`** | `pages/hr/AttendancePage.tsx` Add Record modal | Replace ObjectId text input with employee search dropdown using `hrApi.getEmployees()` |
| 2 | **Super-admin Settings General/Notifications/System tabs fake** | `pages/super-admin/SettingsPage.tsx` | Needs `PlatformSettings` model + GET/PUT backend endpoint; General tab has hardcoded "WorkManage SaaS" |

**Resolved in Session 6 (no longer gaps):**
- ✅ CARunPayrollPage Step 3 hardcoded ₹ amounts removed
- ✅ Employee password change wired to `POST /auth/change-password`
- ✅ Employee profile Save button wired to `PATCH /employee/profile`
- ✅ HR/Manager/Finance/Supervisor settings profile save wired to `PATCH /auth/me`
- ✅ Finance settings password change wired to `POST /auth/change-password`
- ✅ Finance settings hardcoded `FIN-001` / `Finance & Payroll` removed
- ✅ Documents Eye+Download buttons open `fileUrl` in new tab
- ✅ MyPayslips Eye button shows real payslip data; hardcoded `+4.2%` removed
- ✅ `CACompanySettingsPage.tsx` deleted (was orphaned)

**Resolved in Session 13 (no longer gaps):**
- ✅ **Plans fully dynamic** — removed all hardcoded `BASIC`/`PRO`/`ENTERPRISE` references from frontend and backend. Backend: Company/Subscription/Module models have no enum constraint on plan fields; `validate.ts` uses `z.string().min(1)` instead of `z.enum([...])`. Frontend: new `utils/planColors.ts` with `getPlanBadge(planType, allPlans)` assigns badge colours by price-sorted index from a PALETTE array (so cheapest plan = index 0, regardless of name). `DashboardPage.tsx`, `CompaniesPage.tsx`, `SubscriptionsPage.tsx`, `ModulesPage.tsx`, `CASettingsPage.tsx` all removed their hardcoded plan colour maps and now call `getPlanBadge` with live plans from `subscriptionsApi.getPlans()`. `subscriptions.ts` and `companies.ts` API types changed `plan: 'BASIC' | 'PRO' | 'ENTERPRISE'` → `plan: string`. `SubscriptionsPage` "My Plans" tab removed hardcoded `highlight = p.type === 'PRO'`; now highlights middle plan by index.

**Resolved in Session 12 (no longer gaps):**
- ✅ **Module auto-provision on plan assignment** — `subscriptions.controller.ts` `assignPlan` now calls `Module.find({ availableFor: plan })` after updating Company, then `CompanyModule.bulkWrite(...)` with `$setOnInsert` (so existing company admin toggles are never overwritten). New companies assigned a BASIC plan get 3 modules; PRO/ENTERPRISE get more.
- ✅ **Module Catalogue CRUD** — Super Admin Modules page now has a "Module Catalogue" tab (3 tabs total: Module Access, Module Catalogue, Role Permissions). The tab shows all modules in a table with plan availability badges (colour-coded BASIC/PRO/ENTERPRISE). Supports: Add Module (modal with name, description, plan checkboxes), Edit Module (same modal pre-filled), Delete Module (confirmation dialog; backend blocks deletion if module is assigned to any company with a 409 error).
- ✅ **Backend CRUD routes for modules** — `POST /modules`, `PUT /modules/:id`, `DELETE /modules/:id` added to `modules.routes.ts`, all scoped to SUPER_ADMIN. `createModule`, `updateModule`, `deleteModule` added to `modules.controller.ts`.
- ✅ **Frontend API** — `modulesApi.createModule`, `updateModule`, `deleteModule` added to `api/modules.ts`.

**Resolved in Session 11 (no longer gaps):**
- ✅ **Activity Log tab no longer shows "Logged In" entries** — backend `activity.controller.ts` now sets `where.action = { $ne: 'Logged In' }` when `type === 'activity'`; login entries are exclusively in the Login Log tab
- ✅ **CAModulesPage crash fixed** — `getModules` in `company-admin.controller.ts` now remaps `moduleId` (Mongoose populate field) → `module` before sending response; frontend `CAModule` type expects `module`, not `moduleId`; page also guards with `.filter((m) => m.module)` in case of orphaned rows



- ✅ **Activity Logs — Companies/Subscriptions/Auth/Users/Settings now log real actions** — `companies.controller.ts` now calls `logActivity` on create/update/archive; `subscriptions.controller.ts` logs `assignPlan` + `updateSubscription`; `auth.controller.ts` logs `changePassword` + `updateMe`; `company-admin.controller.ts` logs `createUser`, `updateUser`, `deleteUser`, `updateCompany`
- ✅ **Activity Logs — MODULES constant corrected** — was `['Auth', 'Payroll', 'Workforce', ...]`; now includes all 14 modules including `'Support'` (added Session 20)
- ✅ **Activity Logs — ROLES constant corrected** — was `['SUPER_ADMIN', 'HR', ...]`; now includes all 7 roles including `COMPANY_ADMIN` and `FINANCE`
- ✅ **Activity Logs — moduleColors updated** — added entries for `Companies`, `Subscriptions`, `Users`, `Settings`

**Resolved in Session 10 (no longer gaps):**
- ✅ **Activity Logs — User/Role/Company columns now populate** — `activity.controller.ts` now transforms Mongoose populated `userId`/`companyId` fields → `user`/`company` before sending response; frontend `ActivityLog` type expected `log.user`/`log.company` which previously were always `undefined`
- ✅ **Activity Logs — Action strings no longer contain raw MongoDB ObjectIds** — all controller `logActivity()` calls updated to use human-readable names: `employees.controller.ts` uses `userId.name`, `approvals.controller.ts` and `leaves.controller.ts` use `employeeId.userId.name`, `expenses.controller.ts` uses category + amount, `documents.controller.ts` fetches doc name before delete, `shifts.controller.ts` uses shiftName + date
- ✅ **Activity Logs — Login log includes userAgent** — `auth.controller.ts` `ActivityLog.create()` now includes `userAgent: req.headers['user-agent']`
- ✅ **Activity Logs — Time format improved** — `fmtTime` now shows `HH:MM:SS` + full date with year; `fmtFull` in detail modal also shows seconds
- ✅ **Activity Logs — Module filter matches real DB values** — `MODULES` constant updated from `['Workforce', 'Shift Management', ...]` to `['Auth', 'Employees', 'Attendance', 'Leaves', 'Approvals', 'Expenses', 'Documents', 'Payroll', 'Shifts']`
- ✅ **Activity Logs — Role filter now includes all roles** — `ROLES` constant and `roleMeta` updated to include `COMPANY_ADMIN` and `FINANCE`; `moduleColors` keys updated to match real module names
- ✅ **Activity Logs — Company filter excludes deleted companies** — `getCompaniesFilter` in `activity.controller.ts` now adds `{ isDeleted: { $ne: true } }` filter

**Resolved in Session 9 (no longer gaps):**
- ✅ **Soft delete for companies** — `DELETE /api/companies/:id` now sets `isDeleted: true + deletedAt + status: SUSPENDED` instead of hard-deleting; subscription is simultaneously set `isActive: false`
- ✅ **"Unknown Company" in subscriptions fixed** — subscriptions controller filters out rows where `company == null` or `company.isDeleted == true`; company search in subscriptions also excludes deleted companies
- ✅ **Companies list/stats exclude deleted records** — all `countDocuments` and `find` queries in `getCompanies` now include `{ isDeleted: { $ne: true } }`
- ✅ **Archive modal UX** — delete confirmation in `CompaniesPage.tsx` now says "Archive Company" with a note that data is preserved

**Resolved in Session 8 (no longer gaps):**
- ✅ **Super Admin Revenue Trend chart** — `GET /api/subscriptions/revenue-trend` endpoint added; chart now renders with live data in `DashboardPage.tsx` (Recharts `LineChart` wired to real subscription aggregation by month)

**Resolved in Session 7 (no longer gaps):**
- ✅ **HR Attendance Add Record** — employee dropdown replaces raw MongoDB `_id` input; loads employees via `hrApi.getEmployees({ limit: '200' })`
- ✅ **Toast system** — `sonner` installed; `<Toaster>` in `App.tsx`; `src/utils/errorUtils.ts` with `extractError()` used everywhere
- ✅ **Global 5xx toast** — axios interceptor shows "Server error. Please try again." on 500+ responses
- ✅ **Manager Settings Security tab** — password change fully wired (state + handler + `POST /auth/change-password`)
- ✅ **Supervisor Settings Security tab** — same fix; password change wired
- ✅ **CASettingsPage** — `handleSave` now has `catch` block with toast; initial load catch also toasts
- ✅ **Auth store updates on profile save** — all settings pages call `setUser()` after PATCH so sidebar name/email updates live; new `setUser` action added to `authStore.ts`
- ✅ **Silent catches fixed in 10 pages** — HR Approvals, Leave Management, Document delete, CA Approvals, CA Users (role change + toggle active), CA Workflows (load + save), Finance Expenses, Employee Expenses, Employee Leave — all now show toast errors

### P1 — Compliance / completeness

| # | Feature | Location | What's needed |
|---|---|---|---|
| 6 | **CACompliancePage is a stub** | `pages/company-admin/CACompliancePage.tsx` | Build `ComplianceSettings` model + CRUD routes + wire frontend PF/ESI/PT/TDS fields |
| 7 | **No file cleanup on document delete** | `controllers/documents.controller.ts` deleteDocument | Add `fs.unlink()` on `backend/uploads/` path after DB delete |
| 8 | **Employee bank details are hardcoded** | `pages/employee/EmployeeSettingsPage.tsx` bank tab | Read from `Employee` model (fields exist); add PATCH endpoint to update bankName/branchName/accountHolder |
| 9 | **Payment gateway** | subscriptions system | Stripe/Razorpay + webhooks; subscriptions are admin-only records today |

### P2 — Polish / non-blocking

| # | Item | Status |
|---|---|---|
| 10 | `CACompanySettingsPage.tsx` is orphaned | Delete — not routed; contains hardcoded "Vook Tech Btrewal" |
| 11 | Workflow auto-escalation | Escalation hours saved; no background job/timer to forward stuck requests |
| 12 | Global toast for API errors | Most pages silently swallow failures |
| 13 | Mobile responsive layouts | Fixed 210px sidebars, desktop-first |
| 14 | Module/permission route enforcement | ~~Stored in DB, not checked in middleware~~ — **FIXED Session 15** — Payroll + Expenses routes now guarded by `requireModule()` middleware |
| 15 | Notifications (email/SMS/push) | No delivery system; bell icons are decorative |

### P3 — Infrastructure / quality

| Item | Status |
|---|---|
| Automated tests | Zero test files in entire `vti/` tree |
| CI test/lint stages | Deploy-only workflow; no test gate |
| ~~Central `AppError` + `{ error: { code, message } }`~~ | ✅ DONE Session 14 — `core/AppError.ts` + `core/errorHandler.ts` |
| Request-ID + pino structured logging | ✅ Request ID done Session 14; Morgan text logging remains (pino is future) |
| OpenAPI/Swagger spec | No typed API contract |

**Resolved in Session 20 (TanStack Query migration + node-cache backend):**
- ✅ **TanStack Query installed** — `@tanstack/react-query` added to `vti/frontend/package.json`
- ✅ **`src/lib/queryClient.ts`** — singleton `QueryClient` with `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`, `retry: 1`
- ✅ **`src/lib/queryKeys.ts`** — structured key factory `qk` covering all 7 roles (hr, ca, emp, finance, sa, mgr, sup)
- ✅ **`<QueryClientProvider>` wrapping** — added to `App.tsx` around `<BrowserRouter>`
- ✅ **Query hook files created** — `hooks/queries/useHrQueries.ts`, `useCaQueries.ts`, `useEmployeeQueries.ts`, `useFinanceQueries.ts`, `useSaQueries.ts`, `useMgrQueries.ts`, `useSupQueries.ts`
- ✅ **Mutation hook files created** — `hooks/mutations/useHrMutations.ts`, `useCaMutations.ts`, `useEmployeeMutations.ts`, `useFinanceMutations.ts`, `useSaMutations.ts`
- ✅ **All 57 frontend pages migrated** — `useState[data] + useCallback[fetch] + useEffect[→fetch]` pattern replaced with `useQuery` hooks; `fetch()` + `setSaving` patterns replaced with `useMutation` hooks with `onSuccess/onError` callbacks
- ✅ **node-cache installed** — `node-cache` added to `vti/backend/package.json`
- ✅ **`backend/src/utils/cache.ts`** — singleton `NodeCache` with `getCached()`, `invalidate()`, `invalidatePrefix()` helpers
- ✅ **8 expensive read endpoints cached** — `getDashboard`, `getUsers`, `getDepartments` (company-admin); `getEmployees`, `getDepartments` (employees); `getAttendanceOverview`, `getAttendanceRecords` (attendance); `getSalaryStructures`, `getPayslips` (payroll)
- ✅ **Cache invalidation on writes** — createEmployee/updateEmployee invalidate `hr:employees`, `ca:departments`, `ca:dashboard`; createUser/updateUser/deleteUser invalidate `ca:users`, `ca:dashboard`; check-in/check-out invalidate `attendance:overview`, `attendance:records`; runPayroll invalidates `payroll:payslips`, `payroll:salaries`, `ca:dashboard`
- ✅ **runPayroll N+1 fix** — `Payslip.findOne` + `Payslip.countDocuments` inside per-employee loop replaced with two queries before the loop: `Payslip.find({ employeeId: { $in: empIds } })` + single `countDocuments`; existence check uses `Set`; count uses `baseCount++`
- ✅ **`useSaRevenueTrend` hook added** — `hooks/queries/useSaQueries.ts`; used in `DashboardPage.tsx` (SA)
- ✅ **`useDeleteCompany` mutation added** — `hooks/mutations/useSaMutations.ts`; used in `CompaniesPage.tsx` (SA)
- ✅ **Support ticket activity logging** — `support.controller.ts` now calls `logActivity` on `createTicket` (action: `"Created support ticket TKT-…: subject"`) and `updateTicket` (action: `"Updated ticket TKT-…: status → X"` / `priority → X"`). `ActivityPage.tsx` `MODULES` constant and `moduleColors` map extended with `'Support'` (orange `#f97316`).
- ⚠️ **`ModulesPage.tsx` sub-components partially migrated** — root component's plan fetch migrated to `useSaPlans()`; `ModuleAccessTab`, `ModuleCatalogueTab`, `RolePermissionsTab` still use `useCallback+useEffect` internally (complex interaction model; requires additional mutation hooks to fully migrate)

**Resolved in Session 17 (plan management — update + soft-delete with active-subscription guard):**
- ✅ **Edit Plan modal** — `SubscriptionsPage.tsx` has a new `EditPlanModal` (pencil icon on each plan card). Updates name, price, maxUsers, features via `PUT /api/subscriptions/plans/:id`. `type` field is read-only (immutable key; companies reference it as a string).
- ✅ **Soft-delete Plan with guard** — `DELETE /api/subscriptions/plans/:id` added. If the plan has active + non-expired subscriptions, returns HTTP 409 with `activeCount` and `latestExpiry`. Otherwise sets `isActive: false` (soft delete — document never hard-removed). `DeletePlanConfirmModal` on the trash icon shows the 409 detail inline so admin knows exactly when it becomes safe to deactivate.
- ✅ **Frontend API** — `subscriptionsApi.deletePlan(id)` added to `api/subscriptions.ts`.
- ✅ **Plan card action buttons** — each plan card in the "My Plans" tab now has a pencil (edit) and trash (deactivate) icon button in the top-right corner.

**Resolved in Session 16 (row-click navigation — Eye/View buttons removed across entire app):**
- ✅ **Row-click opens detail modal on all tables** — 12 files updated. Clicking anywhere on a table row now opens the detail view. All remaining action buttons (Approve, Reject, Edit, Delete, Download) have `e.stopPropagation()` so they don't trigger the row handler.
- ✅ **Eye/View buttons removed** — `super-admin/CompaniesPage.tsx`, `super-admin/ActivityPage.tsx`, `super-admin/SupportPage.tsx`, `hr/ApprovalsPage.tsx`, `hr/LeaveManagementPage.tsx`, `manager/ManagerApprovalsPage.tsx`, `supervisor/SupervisorApprovalsPage.tsx`, `finance/ExpensesPage.tsx`, `manager/WorkforcePage.tsx`, `company-admin/payroll/CAPayslipsPage.tsx`, `employee/MyPayslipsPage.tsx`, `hr/EmployeesPage.tsx`
- ✅ **ActivityPage Actions column removed** — no remaining action buttons; entire `<th>Actions</th>` and actions `<td>` removed
- ✅ **New detail modals built** — `finance/ExpensesPage.tsx` (expense detail with Approve/Reject footer for Pending), `manager/WorkforcePage.tsx` (employee detail read-only), `company-admin/payroll/CAPayslipsPage.tsx` (payslip detail read-only), `employee/MyPayslipsPage.tsx` (payslip detail read-only; `alert()` replaced)
- ✅ **HR EmployeesPage row click opens edit modal** — row click fires `setModal({ open: true, emp: e })`; dead Eye button removed; Edit button kept with `e.stopPropagation()`
- ✅ **Type interfaces extended** — `Payslip` (hr.ts) and `MyPayslip` (employee.ts) now include `grossSalary` and `totalDeductions`; `Expense` (finance.ts) now includes `receiptUrl`

**Resolved in Session 15 (production audit — URL validation + module enforcement):**
- ✅ **`validateId()` helper added** — `utils/validate.ts` exports `objectIdSchema` (24-hex regex) + `validateId(id)` which throws `AppError('VALIDATION_ERROR', 400)` on invalid input; eliminates Mongoose `CastError` from malformed IDs in URLs
- ✅ **`validateId` applied to all `:id` route handlers** — `employees.controller.ts` (`getEmployee`, `updateEmployee`), `leaves.controller.ts` (`updateLeaveStatus`), `approvals.controller.ts` (`updateApproval`), `shifts.controller.ts` (`updateShift`), `documents.controller.ts` (`deleteDocument`), `expenses.controller.ts` (`updateExpense`)
- ✅ **`requireModule` middleware created** — `middleware/requireModule.ts` checks `CompanyModule` collection; gracefully allows access if the module record doesn't exist in DB (avoids breaking existing tenants); throws `AppError('MODULE_DISABLED', 403)` when module is explicitly disabled
- ✅ **Payroll routes gated by `requireModule('Payroll')`** — `hr.routes.ts` and `finance.routes.ts` payroll/salary/payslip endpoints blocked for companies with Payroll module disabled
- ✅ **Expenses routes gated by `requireModule('Expenses')`** — `finance.routes.ts` expenses endpoints blocked for companies with Expenses module disabled
- ✅ **`expenses.controller.ts` refactored** — removed `AuthRequest` import; now uses `getCompanyId(req)` from `authContext` + `validateId`; companyId guard is now consistent with all other controllers (not an `if (companyId)` optional check)

**Resolved in Session 14 (production audit — security + typing):**
- ✅ **User.toJSON now deletes password hash** — `User.ts` toJSON transform adds `delete ret.password`; bcrypt hash no longer leaked via `res.json(user)` anywhere
- ✅ **RefreshToken.toJSON now deletes token** — `RefreshToken.ts` toJSON transform adds `delete ret.token`; raw token string no longer in JSON responses
- ✅ **seed-roles.ts production guard** — exits with error code 1 if `NODE_ENV === 'production'`; prevents demo accounts (`Test@123`) being accidentally created in production DB
- ✅ **All unsafe `req as unknown as {...}` casts eliminated** — new `utils/authContext.ts` exports `getAuth()`, `getCompanyId()`, `getUserId()`, `getRole()`; all 8 affected controllers updated; `getUploadedBy` (which always returned `'HR Admin'`) replaced with `getAuth(req).email`; `auth.controller.ts` inline `Request & { user? }` intersections removed
- ✅ **AppError class** — `core/AppError.ts` with typed `code`, `message`, `statusCode`; `isAppError()` type guard
- ✅ **Centralized error handler** — `core/errorHandler.ts` replaces per-controller ad-hoc 500s; AppErrors return `{ success: false, error: { code, message, requestId } }`; unknown errors log full detail, return generic message in prod
- ✅ **Request ID middleware** — every request gets `req.requestId = req_<timestamp>_<random>` attached before all routes; `X-Request-ID` response header set; included in all error responses
- ✅ **Split health endpoints** — `/api/health/live` (liveness) + `/api/health/ready` (readiness — 503 if MongoDB disconnected); legacy `/api/health` kept for backward compat
- ✅ **Activity log silent catch fixed** — `.catch(() => {})` replaced with `.catch((err) => console.error('[ActivityLog] Failed to write log:', ...))`

---

## 12. File Locations — Quick Reference

```
vti/
├── package.json                       # monorepo: dev, build, seed
├── .github/workflows/deploy.yml       # SSH deploy to VPS + PM2
├── backend/src/
│   ├── index.ts                       # Express app, static /uploads, health, shutdown
│   ├── controllers/
│   │   ├── attendance.controller.ts   # overview, records, manual, self check-in/out
│   │   ├── workflows.controller.ts    # workflow CRUD + 4 report aggregations
│   │   ├── employee.controller.ts     # self-service profile, leaves, expenses, etc.
│   │   ├── employees.controller.ts    # CRUD
│   │   ├── leaves.controller.ts
│   │   ├── approvals.controller.ts
│   │   ├── expenses.controller.ts
│   │   ├── documents.controller.ts    # ⚠ no disk cleanup on delete
│   │   ├── payroll.controller.ts      # salary, payslips, payroll run
│   │   ├── shifts.controller.ts       # shift management
│   │   ├── auth.controller.ts
│   │   ├── companies.controller.ts    # atomic Company + COMPANY_ADMIN creation
│   │   ├── company-admin.controller.ts
│   │   ├── subscriptions.controller.ts
│   │   ├── activity.controller.ts
│   │   ├── support.controller.ts
│   │   └── modules.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts         # authenticate + requireRole
│   │   ├── requireModule.ts           # requireModule(moduleName) — checks CompanyModule collection
│   │   └── upload.ts                  # multer: uploadDocument, uploadReceipt
│   ├── models/
│   │   ├── Attendance.ts, Shift.ts, Workflow.ts
│   │   ├── Employee.ts, User.ts, LeaveRequest.ts, Approval.ts
│   │   ├── Expense.ts, Document.ts, Payslip.ts, SalaryStructure.ts
│   │   ├── ActivityLog.ts, Company.ts, Subscription.ts
│   │   ├── RolePermission.ts, Module.ts, CompanyModule.ts
│   │   └── Plan.ts, RefreshToken.ts, SupportTicket.ts
│   ├── routes/
│   │   ├── hr.routes.ts               # employees, attendance, leaves, approvals, payroll, shifts, documents, reports
│   │   ├── employee.routes.ts         # includes expenses/upload
│   │   ├── finance.routes.ts          # finance-scoped endpoints
│   │   └── company-admin.routes.ts    # workflows + reports + user management
│   └── utils/
│       ├── activity.ts, query.ts, validate.ts, jwt.ts, db.ts
│       │   # validate.ts: validateBody(), validateId(), objectIdSchema + all Zod schemas
│       ├── authContext.ts             # getAuth(), getCompanyId(), getUserId(), getRole()
│       └── cache.ts                   # getCached(key, fn, ttl?), invalidate(...keys), invalidatePrefix(prefix) — node-cache singleton
│
└── frontend/src/
    ├── api/
    │   ├── hr.ts                      # uploadDocumentFile, runPayroll, shifts, reports
    │   ├── employee.ts                # uploadReceiptFile
    │   ├── finance.ts                 # runPayroll, reports
    │   ├── companyAdmin.ts            # workflows + reports
    │   └── companies.ts               # create returns CreateCompanyResponse (adminGeneratedPassword)
    ├── hooks/useDebouncedValue.ts
    ├── hooks/queries/
    │   ├── useHrQueries.ts            # useEmployees, useEmployee, useDepartments, useHrAttendance, useAttendanceRecords, useLeaves, useApprovals, useHrSalary, useHrPayslips, useShifts, useDocuments
    │   ├── useCaQueries.ts            # useCaDashboard, useCaUsers, useCaDepartments, useCaCompany, useCaModules, useCaActivity, useRolePermissions, useWorkflows, useCaReport, useCaPayrollReport
    │   ├── useEmployeeQueries.ts      # useMyProfile, useMyAttendance, useTodayAttendance, useMyLeaves, useMyPayslips, useMyExpenses, useMyDocuments
    │   ├── useFinanceQueries.ts       # useFinanceAttendance, useFinanceEmployees, useFinanceSalary, useFinancePayslips, useFinanceExpenses, useFinanceReport
    │   ├── useSaQueries.ts            # useSaCompanies, useSaPlans, useSaSubscriptions, useSaActivity, useSaSupport, useSaModules, useSaRevenueTrend
    │   ├── useMgrQueries.ts           # useMgrWorkforce, useMgrAttendance, useMgrApprovals, useMgrReport
    │   └── useSupQueries.ts           # useSupWorkforce, useSupAttendance, useSupShifts, useSupApprovals
    ├── hooks/mutations/
    │   ├── useHrMutations.ts          # useCreateEmployee, useUpdateEmployee, useCreateAttendance, useUpdateLeave, useUpdateApproval, useRunPayroll, useCreateDocument, useDeleteDocument, useCreateShift, useUpdateShift
    │   ├── useCaMutations.ts          # useCreateUser, useUpdateUser, useDeleteUser, useUpdateCompany, useToggleModule, useSaveWorkflow, useUpdateRolePermissions
    │   ├── useEmployeeMutations.ts    # useUpdateProfile, useCheckIn, useCheckOut, useApplyLeave, useSubmitExpense
    │   ├── useFinanceMutations.ts     # useFinanceRunPayroll, useUpdateExpense
    │   └── useSaMutations.ts          # useCreateCompany, useUpdateCompany, useCreatePlan, useUpdatePlan, useAssignPlan, useUpdateTicketStatus, useDeleteCompany
    ├── lib/
    │   ├── queryClient.ts             # singleton QueryClient: staleTime 5min, gcTime 30min, refetchOnWindowFocus false
    │   └── queryKeys.ts               # qk factory: hr | ca | emp | finance | sa | mgr | sup domains
    ├── store/authStore.ts             # hydrate() + setUser() — updates user in store after profile save
    ├── utils/errorUtils.ts            # extractError(err, fallback?) — single helper for API error messages
    ├── utils/planColors.ts            # getPlanBadge(planType, allPlans) — dynamic badge colours by price-sorted index
    ├── components/data/Pagination.tsx
    └── pages/
        ├── super-admin/
        │   ├── CompaniesPage.tsx      # admin credential creation + GeneratedPasswordModal
        │   └── SettingsPage.tsx       # ⚠ password change real; General/Notifications/System tabs fake (no PlatformSettings model)
        ├── company-admin/
        │   ├── CAReportsPage.tsx      # real API + CSV
        │   ├── CAWorkflowsPage.tsx    # real API
        │   ├── CAUsersPage.tsx        # real API
        │   ├── CASettingsPage.tsx     # real API (company profile + password)
        │   ├── CARunPayrollPage.tsx   # run API real; Step 3 hardcoded ₹ removed
        │   └── CACompliancePage.tsx   # ⚠ STUB — explicit warning banner, no backend
        ├── hr/
        │   ├── AttendancePage.tsx     # ⚠ Add Record modal uses raw MongoDB _id (not a dropdown)
        │   └── HRSettingsPage.tsx     # profile save → PATCH /auth/me (real)
        ├── manager/
        │   └── ManagerSettingsPage.tsx   # profile save → PATCH /auth/me (real)
        ├── finance/
        │   └── FinanceSettingsPage.tsx   # profile save + password change real; FIN-001/dept removed
        ├── supervisor/
        │   └── SupervisorSettingsPage.tsx # profile save → PATCH /auth/me (real)
        ├── employee/
        │   ├── EmployeeSettingsPage.tsx  # profile save + password change real; bank tab shows —
        │   ├── MyPayslipsPage.tsx        # Eye wired; Download disabled (no PDF); YTD hardcode removed
        │   └── DocumentsPage.tsx         # Eye+Download open fileUrl in new tab
        └── ... (see App.tsx for full route map)
```

---

## 13. Suggested Next Steps (in priority order)

1. **`ModulesPage.tsx` sub-component migration** — `ModuleAccessTab`, `ModuleCatalogueTab`, `RolePermissionsTab` still use `useCallback+useEffect`; add `useCreateModule`, `useUpdateModule`, `useDeleteModule`, `useToggleAccess` to `useSaMutations.ts` then migrate
2. **Tests + CI** — add Vitest to both packages + write 8 priority tests + add quality gates to deploy.yml
3. **File upload security** — MIME type validation in `upload.ts`; `fs.unlink()` on document delete; authenticated download route
4. **CACompliancePage backend** — `ComplianceSettings` model + routes + frontend wiring
5. **PlatformSettings model** — GET/PUT for super-admin General/Notifications/System settings
6. **Employee bank details PATCH** — add `PATCH /employee/bank` endpoint + wire EmployeeSettingsPage bank tab (fields already in Employee model)
7. **Payslip PDF generation** — enable Download button on Paid payslips (needs PDF lib or HTML template)
8. **Payment gateway** — Stripe/Razorpay + webhooks if SaaS billing required

---

## 14. Known Bugs & Gotchas

1. ~~**HR manual attendance uses MongoDB `_id`**~~ — **FIXED Session 7.** Employee dropdown now loads from API.

2. **Workflow auto-escalation not implemented** — Escalation hours are saved and step order is enforced, but there is no background job/timer to auto-forward stuck requests.

3. **Attendance overview shows 0 until check-ins** — `getAttendanceOverview` reads today's records. Before any check-in, present/absent/late counts are 0. Correct behaviour.

4. **No file cleanup on document delete** — Uploaded files remain on disk when document records are deleted.

5. **`useDebouncedValue` location** — `vti/frontend/src/hooks/useDebouncedValue.ts`. Path `components/data/useDebouncedValue` does NOT exist.

6. **`EmployeeSettingsPage` bank details show `—`** — Account number, IFSC show `—`. Employee model has `bankName`, `branchName`, `accountHolder` but no PATCH endpoint for the employee bank tab. Bank details are still read-only.

7. **Super-admin Settings brand hardcoded** — "WorkManage SaaS" and "https://app.workmanage.io" in `SettingsPage.tsx` General tab are static strings (no `PlatformSettings` model yet).

8. **Payslip download has no file URL** — `MyPayslip` model stores no `fileUrl`. Download button is disabled for non-Paid payslips; for Paid payslips it has a tooltip but no actual file to open (no PDF generation implemented). Row-click now opens a detail modal instead of `alert()`.

9. ~~**Settings name/email changes don't update Zustand auth store**~~ — **FIXED Session 7.** `setUser()` action added to authStore; all settings pages call it after successful PATCH.

10. **Mongoose populate field naming gotcha** — After `.populate('userId', ...)`, the populated object is still keyed `userId` (not `user`) in the response object. If a new controller sends populated documents directly to the frontend without remapping, the frontend will receive `log.userId` instead of `log.user` and all derived columns will be `undefined`. Pattern established in `activity.controller.ts`: always explicitly `map()` the output to rename populated fields before `res.json()`.

11. ~~**Login: invalid credentials caused page reload + field clear**~~ — **FIXED Session 18.** The axios response interceptor in `src/api/axios.ts` was attempting a token refresh on every 401, including failed login attempts. When the refresh also failed, it called `window.location.href = '/login'`, causing a full page reload. Fixed by adding `original.url === '/auth/login'` to the early-return guard so the login endpoint's 401 is passed straight through to the `catch` in `LoginPage.tsx`, which already shows the inline error banner correctly.

12. ~~**Generic "Something went wrong" shown instead of real API error message**~~ — **FIXED Session 18.** Four pages had bare `catch {}` blocks or `(err: any)` manual extraction instead of using `extractError()`. Fixed in: `CompaniesPage.tsx` (create/edit company), `SubscriptionsPage.tsx` (create plan, edit plan, assign plan), `SupportPage.tsx` (create ticket), `FinancePayrollPage.tsx` (generate payslips). All now import `extractError` and pass the real server message through to the inline error banner.

13. ~~**Workforce/Users tab — broken create flow and missing credential handoff**~~ — **FIXED Session 19.**
    - `CAWorkforcePage.tsx`: bare `catch {}` replaced with `extractError`; after employee creation, a **Credentials Modal** shows the auto-generated password with a Copy button (previously the `generatedPassword` field in the API response was silently ignored). Form field renamed from "Role / Designation" to "Designation" to match intent. API type for `hrApi.createEmployee` updated to include `generatedPassword: string`.
    - `CAUsersPage.tsx`: inline role-change dropdown in table replaced with a proper **Edit User Modal** (name + email read-only, role select, active/inactive toggle); after user creation with blank password, Credentials Modal shows auto-generated password; password hint copy fixed to "auto-generated if blank". API type for `caApi.createUser` updated to include `generatedPassword?: string`.

14. ~~**`createEmployee` returns 500 on duplicate email**~~ — **FIXED Session 19.** `employees.controller.ts` `createEmployee` had no pre-check for existing email before calling `User.create()`. MongoDB's unique index threw E11000 → global errorHandler returned it as 500 INTERNAL_ERROR. Added `User.findOne({ email })` guard (matching the pattern already used in `company-admin.controller.ts` `createUser`) → now returns 409 with `"A user with this email already exists"`, which `extractError` correctly surfaces in the inline error banner.

15. **`ModulesPage.tsx` sub-components still use direct API calls** — `ModuleAccessTab`, `ModuleCatalogueTab`, and `RolePermissionsTab` in `pages/super-admin/ModulesPage.tsx` still use `useCallback + useEffect` internally. Root `ModulesPage` component's plan fetch was migrated to `useSaPlans()`. Full migration of the sub-components would require adding `useCreateModule`, `useUpdateModule`, `useDeleteModule`, `useToggleAccess`, `useUpdateRolePermission` to `useSaMutations.ts`.

---

## 15. TanStack Query Architecture (Session 20)

### Pattern summary

**Data fetching (reads):**
```typescript
// In any page component:
const { data, isLoading } = useEmployees(params);
const employees = data?.employees ?? [];
// "data" type matches the raw API response shape; use optional chaining + nullish coalescing for defaults
```

**Mutations (writes):**
```typescript
const createEmployee = useCreateEmployee();
createEmployee.mutate(form, {
  onSuccess: (data) => { /* close modal, show credentials, toast.success */ },
  onError: (err) => setError(extractError(err, 'Failed to create employee')),
});
// Use createEmployee.isPending instead of local [saving] state
```

**Cache invalidation:**
- TanStack Query uses prefix matching: invalidating `['emp', 'attendance']` also invalidates `['emp', 'attendance', 'today']`
- All mutation hooks call `qc.invalidateQueries()` on success — pages do NOT need to manually refetch
- For sub-components that make their own API calls (e.g., `CompanyModal`), the parent invalidates cache in its `onSave` callback

**Legitimate `useEffect` (not data-fetching):**
- Form initialization from server data: `useEffect(() => { if (data && !formInit) { setField(data.value); setFormInit(true); } }, [data, formInit])`
- Filter dropdowns loaded independently of the main list (e.g., company list for filter selects in `ActivityPage`, `SupportPage`)

### Query key structure (`src/lib/queryKeys.ts`)
```
qk.hr.*    → ['hr', domain, params?]
qk.ca.*    → ['ca', domain, params?]
qk.emp.*   → ['emp', domain, params?]
qk.finance.* → ['finance', domain, params?]
qk.sa.*    → ['sa', domain, params?]
qk.mgr.*   → ['mgr', domain, params?]
qk.sup.*   → ['sup', domain, params?]
```

### Backend cache key patterns (`src/utils/cache.ts`)
```
ca:dashboard:${companyId}          TTL 5min
ca:users:${companyId}              TTL 3min
ca:departments:${companyId}        TTL 15min
hr:employees:${companyId}          TTL 5min
attendance:overview:${companyId}   TTL 5min
attendance:records:${companyId}    TTL 10min
payroll:salaries:${companyId}      TTL 10min
payroll:payslips:${companyId}      TTL 15min
```

---

## 16. DevOps & Deployment

### Local development
```bash
cd d:/Projects/vook/vti
npm run install:all   # first time
npm run seed          # bootstrap plans, modules, super admin
npm run dev           # backend :5001 + frontend :5173
```

### CI/CD — `.github/workflows/deploy.yml`
- **Trigger:** push to `main` or manual `workflow_dispatch`
- **Target:** VPS at `/var/www/vook` via SSH
- **Steps:** git pull → backend `npm install && npm run build` → PM2 restart `vook-backend` → frontend `npm install && npm run build` → `pm2 save`
- **GitHub secrets required:** `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`
- **Not in CI:** tests, lint, frontend PM2/static serve config (assumed configured on VPS separately)

### Production checklist
- Set `NODE_ENV=production`
- Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- Set `CLIENT_URL` to production frontend origin (CORS)
- Set `MONGODB_URI` to production MongoDB
- Ensure `backend/uploads/` directory exists and is writable
- Configure reverse proxy (nginx) for API, static uploads, and frontend build
- PM2 process: `vook-backend` running `dist/index.js`
