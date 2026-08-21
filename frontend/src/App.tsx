import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';
import { queryClient } from './lib/queryClient';

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const RegistrationCompletePage = lazy(() => import('./pages/auth/RegistrationCompletePage'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'));

// Layouts (small, load eagerly via normal import for shell stability)
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import HRLayout from './components/layout/HRLayout';
import ManagerLayout from './components/layout/ManagerLayout';
import CompanyAdminLayout from './components/layout/CompanyAdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';
import FinanceLayout from './components/layout/FinanceLayout';
import SupervisorLayout from './components/layout/SupervisorLayout';
import AccessGuard from './components/auth/AccessGuard';

// Super Admin pages
const DashboardPage       = lazy(() => import('./pages/super-admin/DashboardPage'));
const CompaniesPage       = lazy(() => import('./pages/super-admin/CompaniesPage'));
const SubscriptionsPage   = lazy(() => import('./pages/super-admin/SubscriptionsPage'));
const ActivityPage        = lazy(() => import('./pages/super-admin/ActivityPage'));
const ModulesPage         = lazy(() => import('./pages/super-admin/ModulesPage'));
const SupportPage         = lazy(() => import('./pages/super-admin/SupportPage'));
const SettingsPage        = lazy(() => import('./pages/super-admin/SettingsPage'));
const PaymentsPage        = lazy(() => import('./pages/super-admin/PaymentsPage'));

// HR pages
const HRDashboardPage       = lazy(() => import('./pages/hr/HRDashboardPage'));
const EmployeesPage         = lazy(() => import('./pages/hr/EmployeesPage'));
const AttendancePage        = lazy(() => import('./pages/hr/AttendancePage'));
const LeaveManagementPage   = lazy(() => import('./pages/hr/LeaveManagementPage'));
const ApprovalsPage         = lazy(() => import('./pages/hr/ApprovalsPage'));
const PayrollPage           = lazy(() => import('./pages/hr/PayrollPage'));
const DocumentPoliciesPage  = lazy(() => import('./pages/hr/DocumentPoliciesPage'));
const HRSettingsPage        = lazy(() => import('./pages/hr/HRSettingsPage'));

// Manager pages
const ManagerDashboardPage  = lazy(() => import('./pages/manager/ManagerDashboardPage'));
const WorkforcePage         = lazy(() => import('./pages/manager/WorkforcePage'));
const ManagerApprovalsPage  = lazy(() => import('./pages/manager/ManagerApprovalsPage'));
const ManagerAttendancePage = lazy(() => import('./pages/manager/ManagerAttendancePage'));
const ManagerReportsPage    = lazy(() => import('./pages/manager/ManagerReportsPage'));
const ManagerSettingsPage   = lazy(() => import('./pages/manager/ManagerSettingsPage'));

// Company Admin pages
const CADashboardPage        = lazy(() => import('./pages/company-admin/CADashboardPage'));
const CAAttendancePage       = lazy(() => import('./pages/company-admin/CAAttendancePage'));
const CAWorkforcePage        = lazy(() => import('./pages/company-admin/CAWorkforcePage'));
const CAPayrollOverviewPage  = lazy(() => import('./pages/company-admin/payroll/CAPayrollOverviewPage'));
const CARunPayrollPage       = lazy(() => import('./pages/company-admin/payroll/CARunPayrollPage'));
const CASalaryStructurePage  = lazy(() => import('./pages/company-admin/payroll/CASalaryStructurePage'));
const CAPayslipsPage         = lazy(() => import('./pages/company-admin/payroll/CAPayslipsPage'));
const CAPayrollReportsPage   = lazy(() => import('./pages/company-admin/payroll/CAPayrollReportsPage'));
const CACompliancePage       = lazy(() => import('./pages/company-admin/payroll/CACompliancePage'));
const CAApprovalsPage        = lazy(() => import('./pages/company-admin/CAApprovalsPage'));
const CAReportsPage          = lazy(() => import('./pages/company-admin/CAReportsPage'));
const CAUsersPage            = lazy(() => import('./pages/company-admin/CAUsersPage'));
const CADepartmentsPage      = lazy(() => import('./pages/company-admin/CADepartmentsPage'));
const CAActivityPage         = lazy(() => import('./pages/company-admin/CAActivityPage'));
const CAModulesPage          = lazy(() => import('./pages/company-admin/CAModulesPage'));
const CASettingsPage         = lazy(() => import('./pages/company-admin/CASettingsPage'));
const CARolesPage            = lazy(() => import('./pages/company-admin/CARolesPage'));
const CAWorkflowsPage        = lazy(() => import('./pages/company-admin/CAWorkflowsPage'));
const CASupportPage          = lazy(() => import('./pages/company-admin/CASupportPage'));

// Employee pages
const EmployeeDashboardPage = lazy(() => import('./pages/employee/EmployeeDashboardPage'));
const MyAttendancePage      = lazy(() => import('./pages/employee/MyAttendancePage'));
const MyLeavePage           = lazy(() => import('./pages/employee/MyLeavePage'));
const MyPayslipsPage        = lazy(() => import('./pages/employee/MyPayslipsPage'));
const MyExpensesPage        = lazy(() => import('./pages/employee/MyExpensesPage'));
const DocumentsPage         = lazy(() => import('./pages/employee/DocumentsPage'));
const EmployeeSettingsPage  = lazy(() => import('./pages/employee/EmployeeSettingsPage'));

// Finance pages
const FinanceDashboardPage = lazy(() => import('./pages/finance/FinanceDashboardPage'));
const FinancePayrollPage   = lazy(() => import('./pages/finance/FinancePayrollPage'));
const SalaryStructurePage  = lazy(() => import('./pages/finance/SalaryStructurePage'));
const PayslipsPage         = lazy(() => import('./pages/finance/PayslipsPage'));
const ExpensesPage         = lazy(() => import('./pages/finance/ExpensesPage'));
const FinanceReportsPage   = lazy(() => import('./pages/finance/FinanceReportsPage'));
const FinanceSettingsPage  = lazy(() => import('./pages/finance/FinanceSettingsPage'));

// Supervisor pages
const SupervisorDashboardPage  = lazy(() => import('./pages/supervisor/SupervisorDashboardPage'));
const SupervisorWorkforcePage  = lazy(() => import('./pages/supervisor/SupervisorWorkforcePage'));
const SupervisorAttendancePage = lazy(() => import('./pages/supervisor/SupervisorAttendancePage'));
const ShiftManagementPage      = lazy(() => import('./pages/supervisor/ShiftManagementPage'));
const SupervisorApprovalsPage  = lazy(() => import('./pages/supervisor/SupervisorApprovalsPage'));
const SupervisorSettingsPage   = lazy(() => import('./pages/supervisor/SupervisorSettingsPage'));

function PageSpinner() {
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#0d7470', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

const guarded = (element: React.ReactElement, permission?: string, module?: string) =>
  <AccessGuard permission={permission} module={module}>{element}</AccessGuard>;

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
  if (user.role === 'SUPERVISOR') return <Navigate to="/supervisor/dashboard" replace />;
  if (user.role === 'FINANCE') return <Navigate to="/finance/dashboard" replace />;
  if (user.role === 'COMPANY_ADMIN') return <Navigate to="/company-admin/dashboard" replace />;
  if (user.role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/complete" element={<RegistrationCompletePage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Super Admin routes */}
          <Route path="/" element={<SuperAdminLayout />}>
            <Route index element={<RoleRedirect />} />
            <Route path="dashboard"     element={<DashboardPage />} />
            <Route path="companies"     element={<CompaniesPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="payments"      element={<PaymentsPage />} />
            <Route path="activity"      element={<ActivityPage />} />
            <Route path="modules"       element={<ModulesPage />} />
            <Route path="support"       element={<SupportPage />} />
            <Route path="settings"      element={<SettingsPage />} />
          </Route>

          {/* HR routes */}
          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="dashboard"  element={<HRDashboardPage />} />
            <Route path="employees"  element={<EmployeesPage />} />
            <Route path="attendance" element={guarded(<AttendancePage />, 'Attendance — View', 'Attendance')} />
            <Route path="leaves"     element={guarded(<LeaveManagementPage />, 'Approvals — View', 'Leave Management')} />
            <Route path="approvals"  element={guarded(<ApprovalsPage />, 'Approvals — View', 'Leave Management')} />
            <Route path="payroll"    element={guarded(<PayrollPage />, 'Payroll — View', 'Payroll')} />
            <Route path="documents"  element={<DocumentPoliciesPage />} />
            <Route path="settings"   element={<HRSettingsPage />} />
          </Route>

          {/* Company Admin routes */}
          <Route path="/company-admin" element={<CompanyAdminLayout />}>
            <Route index element={<Navigate to="/company-admin/dashboard" replace />} />
            <Route path="dashboard"  element={guarded(<CADashboardPage />, 'Dashboard')} />
            <Route path="attendance" element={guarded(<CAAttendancePage />, 'Attendance — View', 'Attendance')} />
            <Route path="workforce"  element={guarded(<CAWorkforcePage />, 'Workforce — View', 'Employee Management')} />
            <Route path="payroll" element={<Navigate to="/company-admin/payroll/overview" replace />} />
            <Route path="payroll/overview"         element={guarded(<CAPayrollOverviewPage />, 'Payroll — View', 'Payroll')} />
            <Route path="payroll/run"              element={guarded(<CARunPayrollPage />, 'Payroll — Process', 'Payroll')} />
            <Route path="payroll/salary-structure" element={guarded(<CASalaryStructurePage />, 'Payroll — View', 'Payroll')} />
            <Route path="payroll/payslips"         element={guarded(<CAPayslipsPage />, 'Payroll — View', 'Payroll')} />
            <Route path="payroll/reports"          element={guarded(<CAPayrollReportsPage />, 'Reports — View', 'Reports & Analytics')} />
            <Route path="payroll/compliance"       element={guarded(<CACompliancePage />, 'Payroll — View', 'Payroll')} />
            <Route path="approvals"  element={guarded(<CAApprovalsPage />, 'Approvals — View', 'Leave Management')} />
            <Route path="reports"    element={guarded(<CAReportsPage />, 'Reports — View', 'Reports & Analytics')} />
            <Route path="users"      element={guarded(<CAUsersPage />, 'Workforce — View', 'Employee Management')} />
            <Route path="departments" element={guarded(<CADepartmentsPage />, 'Workforce — View', 'Employee Management')} />
            <Route path="activity"   element={<CAActivityPage />} />
            <Route path="modules"    element={<CAModulesPage />} />
            <Route path="settings/company"   element={<CASettingsPage />} />
            <Route path="settings/roles"     element={<CARolesPage />} />
            <Route path="settings/workflows" element={<CAWorkflowsPage />} />
            <Route path="support" element={<CASupportPage />} />
          </Route>

          {/* Employee routes */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard"  element={<EmployeeDashboardPage />} />
            <Route path="attendance" element={guarded(<MyAttendancePage />, undefined, 'Attendance')} />
            <Route path="leaves"     element={guarded(<MyLeavePage />, undefined, 'Leave Management')} />
            <Route path="payslips"   element={guarded(<MyPayslipsPage />, undefined, 'Payroll')} />
            <Route path="expenses"   element={guarded(<MyExpensesPage />, undefined, 'Expense Management')} />
            <Route path="documents"  element={guarded(<DocumentsPage />, undefined, 'Document Management')} />
            <Route path="settings"   element={<EmployeeSettingsPage />} />
          </Route>

          {/* Finance routes */}
          <Route path="/finance" element={<FinanceLayout />}>
            <Route index element={<Navigate to="/finance/dashboard" replace />} />
            <Route path="dashboard"        element={<FinanceDashboardPage />} />
            <Route path="payroll"          element={guarded(<FinancePayrollPage />, 'Payroll — View', 'Payroll')} />
            <Route path="salary-structure" element={guarded(<SalaryStructurePage />, 'Payroll — View', 'Payroll')} />
            <Route path="payslips"         element={guarded(<PayslipsPage />, 'Payroll — View', 'Payroll')} />
            <Route path="expenses"         element={<ExpensesPage />} />
            <Route path="reports"          element={<FinanceReportsPage />} />
            <Route path="settings"         element={<FinanceSettingsPage />} />
          </Route>

          {/* Manager routes */}
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard"  element={<ManagerDashboardPage />} />
            <Route path="workforce"  element={guarded(<WorkforcePage />, 'Workforce — View', 'Employee Management')} />
            <Route path="approvals"  element={guarded(<ManagerApprovalsPage />, 'Approvals — View', 'Leave Management')} />
            <Route path="attendance" element={guarded(<ManagerAttendancePage />, 'Attendance — View', 'Attendance')} />
            <Route path="reports"    element={guarded(<ManagerReportsPage />, 'Reports — View', 'Reports & Analytics')} />
            <Route path="settings"   element={<ManagerSettingsPage />} />
          </Route>

          {/* Supervisor routes */}
          <Route path="/supervisor" element={<SupervisorLayout />}>
            <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
            <Route path="dashboard"  element={<SupervisorDashboardPage />} />
            <Route path="workforce"  element={guarded(<SupervisorWorkforcePage />, 'Workforce — View', 'Employee Management')} />
            <Route path="attendance" element={guarded(<SupervisorAttendancePage />, 'Attendance — View', 'Attendance')} />
            <Route path="shifts"     element={guarded(<ShiftManagementPage />, undefined, 'Shift Management')} />
            <Route path="approvals"  element={guarded(<SupervisorApprovalsPage />, 'Approvals — View', 'Leave Management')} />
            <Route path="settings"   element={<SupervisorSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </QueryClientProvider>
  );
}
