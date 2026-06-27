import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Super Admin
import LoginPage from './pages/auth/LoginPage';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import DashboardPage from './pages/super-admin/DashboardPage';
import CompaniesPage from './pages/super-admin/CompaniesPage';
import SubscriptionsPage from './pages/super-admin/SubscriptionsPage';
import ActivityPage from './pages/super-admin/ActivityPage';
import ModulesPage from './pages/super-admin/ModulesPage';
import SupportPage from './pages/super-admin/SupportPage';
import SettingsPage from './pages/super-admin/SettingsPage';

// HR
import HRLayout from './components/layout/HRLayout';
import HRDashboardPage from './pages/hr/HRDashboardPage';
import EmployeesPage from './pages/hr/EmployeesPage';
import AttendancePage from './pages/hr/AttendancePage';
import LeaveManagementPage from './pages/hr/LeaveManagementPage';
import ApprovalsPage from './pages/hr/ApprovalsPage';
import PayrollPage from './pages/hr/PayrollPage';
import DocumentPoliciesPage from './pages/hr/DocumentPoliciesPage';
import HRSettingsPage from './pages/hr/HRSettingsPage';

// Manager
import ManagerLayout from './components/layout/ManagerLayout';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import WorkforcePage from './pages/manager/WorkforcePage';
import ManagerApprovalsPage from './pages/manager/ManagerApprovalsPage';
import ManagerAttendancePage from './pages/manager/ManagerAttendancePage';
import ManagerReportsPage from './pages/manager/ManagerReportsPage';
import ManagerSettingsPage from './pages/manager/ManagerSettingsPage';

// Company Admin
import CompanyAdminLayout from './components/layout/CompanyAdminLayout';
import CADashboardPage from './pages/company-admin/CADashboardPage';
import CAAttendancePage from './pages/company-admin/CAAttendancePage';
import CAWorkforcePage from './pages/company-admin/CAWorkforcePage';
import CAPayrollOverviewPage    from './pages/company-admin/payroll/CAPayrollOverviewPage';
import CARunPayrollPage         from './pages/company-admin/payroll/CARunPayrollPage';
import CASalaryStructurePage    from './pages/company-admin/payroll/CASalaryStructurePage';
import CAPayslipsPage           from './pages/company-admin/payroll/CAPayslipsPage';
import CAPayrollReportsPage     from './pages/company-admin/payroll/CAPayrollReportsPage';
import CACompliancePage         from './pages/company-admin/payroll/CACompliancePage';
import CAApprovalsPage from './pages/company-admin/CAApprovalsPage';
import CAReportsPage from './pages/company-admin/CAReportsPage';
import CACompanySettingsPage from './pages/company-admin/CACompanySettingsPage';
import CARolesPage from './pages/company-admin/CARolesPage';
import CAWorkflowsPage from './pages/company-admin/CAWorkflowsPage';

// Employee
import EmployeeLayout from './components/layout/EmployeeLayout';
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage';
import MyAttendancePage from './pages/employee/MyAttendancePage';
import MyLeavePage from './pages/employee/MyLeavePage';
import MyPayslipsPage from './pages/employee/MyPayslipsPage';
import MyExpensesPage from './pages/employee/MyExpensesPage';
import DocumentsPage from './pages/employee/DocumentsPage';
import EmployeeSettingsPage from './pages/employee/EmployeeSettingsPage';

// Finance
import FinanceLayout from './components/layout/FinanceLayout';
import FinanceDashboardPage from './pages/finance/FinanceDashboardPage';
import FinancePayrollPage from './pages/finance/FinancePayrollPage';
import SalaryStructurePage from './pages/finance/SalaryStructurePage';
import PayslipsPage from './pages/finance/PayslipsPage';
import ExpensesPage from './pages/finance/ExpensesPage';
import FinanceReportsPage from './pages/finance/FinanceReportsPage';
import FinanceSettingsPage from './pages/finance/FinanceSettingsPage';

// Supervisor
import SupervisorLayout from './components/layout/SupervisorLayout';
import SupervisorDashboardPage from './pages/supervisor/SupervisorDashboardPage';
import SupervisorWorkforcePage from './pages/supervisor/SupervisorWorkforcePage';
import SupervisorAttendancePage from './pages/supervisor/SupervisorAttendancePage';
import ShiftManagementPage from './pages/supervisor/ShiftManagementPage';
import SupervisorApprovalsPage from './pages/supervisor/SupervisorApprovalsPage';
import SupervisorSettingsPage from './pages/supervisor/SupervisorSettingsPage';

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
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Super Admin routes */}
        <Route path="/" element={<SuperAdminLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="companies"     element={<CompaniesPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
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
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves"     element={<LeaveManagementPage />} />
          <Route path="approvals"  element={<ApprovalsPage />} />
          <Route path="payroll"    element={<PayrollPage />} />
          <Route path="documents"  element={<DocumentPoliciesPage />} />
          <Route path="settings"   element={<HRSettingsPage />} />
        </Route>

        {/* Company Admin routes */}
        <Route path="/company-admin" element={<CompanyAdminLayout />}>
          <Route index element={<Navigate to="/company-admin/dashboard" replace />} />
          <Route path="dashboard"  element={<CADashboardPage />} />
          <Route path="attendance" element={<CAAttendancePage />} />
          <Route path="workforce"  element={<CAWorkforcePage />} />
          {/* Payroll sub-routes */}
          <Route path="payroll" element={<Navigate to="/company-admin/payroll/overview" replace />} />
          <Route path="payroll/overview"         element={<CAPayrollOverviewPage />} />
          <Route path="payroll/run"              element={<CARunPayrollPage />} />
          <Route path="payroll/salary-structure" element={<CASalaryStructurePage />} />
          <Route path="payroll/payslips"         element={<CAPayslipsPage />} />
          <Route path="payroll/reports"          element={<CAPayrollReportsPage />} />
          <Route path="payroll/compliance"       element={<CACompliancePage />} />
          <Route path="approvals"  element={<CAApprovalsPage />} />
          <Route path="reports"    element={<CAReportsPage />} />
          <Route path="settings/company"   element={<CACompanySettingsPage />} />
          <Route path="settings/roles"     element={<CARolesPage />} />
          <Route path="settings/workflows" element={<CAWorkflowsPage />} />
        </Route>

        {/* Employee routes */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard"  element={<EmployeeDashboardPage />} />
          <Route path="attendance" element={<MyAttendancePage />} />
          <Route path="leaves"     element={<MyLeavePage />} />
          <Route path="payslips"   element={<MyPayslipsPage />} />
          <Route path="expenses"   element={<MyExpensesPage />} />
          <Route path="documents"  element={<DocumentsPage />} />
          <Route path="settings"   element={<EmployeeSettingsPage />} />
        </Route>

        {/* Finance routes */}
        <Route path="/finance" element={<FinanceLayout />}>
          <Route index element={<Navigate to="/finance/dashboard" replace />} />
          <Route path="dashboard"       element={<FinanceDashboardPage />} />
          <Route path="payroll"         element={<FinancePayrollPage />} />
          <Route path="salary-structure" element={<SalaryStructurePage />} />
          <Route path="payslips"        element={<PayslipsPage />} />
          <Route path="expenses"        element={<ExpensesPage />} />
          <Route path="reports"         element={<FinanceReportsPage />} />
          <Route path="settings"        element={<FinanceSettingsPage />} />
        </Route>

        {/* Manager routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard"  element={<ManagerDashboardPage />} />
          <Route path="workforce"  element={<WorkforcePage />} />
          <Route path="approvals"  element={<ManagerApprovalsPage />} />
          <Route path="attendance" element={<ManagerAttendancePage />} />
          <Route path="reports"    element={<ManagerReportsPage />} />
          <Route path="settings"   element={<ManagerSettingsPage />} />
        </Route>

        {/* Supervisor routes */}
        <Route path="/supervisor" element={<SupervisorLayout />}>
          <Route index element={<Navigate to="/supervisor/dashboard" replace />} />
          <Route path="dashboard"  element={<SupervisorDashboardPage />} />
          <Route path="workforce"  element={<SupervisorWorkforcePage />} />
          <Route path="attendance" element={<SupervisorAttendancePage />} />
          <Route path="shifts"     element={<ShiftManagementPage />} />
          <Route path="approvals"  element={<SupervisorApprovalsPage />} />
          <Route path="settings"   element={<SupervisorSettingsPage />} />
        </Route>

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
