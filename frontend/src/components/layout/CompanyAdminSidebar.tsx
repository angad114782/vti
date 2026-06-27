import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, Users, CreditCard,
  CheckSquare, BarChart2, Settings, LogOut, ChevronDown,
  Building2, Shield, GitBranch,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

const NAV_TOP = [
  { to: '/company-admin/dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/company-admin/attendance', label: 'Attendance', Icon: CalendarCheck },
  { to: '/company-admin/workforce',  label: 'Workforce',  Icon: Users },
];

const PAYROLL_ITEMS = [
  { to: '/company-admin/payroll/overview',          label: 'Overview'         },
  { to: '/company-admin/payroll/run',               label: 'Run Payroll'      },
  { to: '/company-admin/payroll/salary-structure',  label: 'Salary Structure' },
  { to: '/company-admin/payroll/payslips',          label: 'Payslips'         },
  { to: '/company-admin/payroll/reports',           label: 'Reports'          },
  { to: '/company-admin/payroll/compliance',        label: 'Compliance'       },
];

const NAV_BOT = [
  { to: '/company-admin/approvals', label: 'Approvals', Icon: CheckSquare },
  { to: '/company-admin/reports',   label: 'Reports',   Icon: BarChart2   },
];

const SETTINGS_ITEMS = [
  { to: '/company-admin/settings/company',   label: 'Company Settings',    Icon: Building2 },
  { to: '/company-admin/settings/roles',     label: 'Roles & Permissions', Icon: Shield    },
  { to: '/company-admin/settings/workflows', label: 'Approval Workflows',  Icon: GitBranch },
];

export default function CompanyAdminSidebar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { logout } = useAuthStore();

  const isPayroll  = location.pathname.startsWith('/company-admin/payroll');
  const isSettings = location.pathname.startsWith('/company-admin/settings');

  const [payrollOpen,  setPayrollOpen]  = useState(isPayroll);
  const [settingsOpen, setSettingsOpen] = useState(isSettings);

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
    textDecoration: 'none', fontSize: '12.5px', fontWeight: 500, position: 'relative',
    backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.15s',
  });

  const expandBtn = (label: string, Icon: React.FC<{ size: number }>, isOpen: boolean, isSection: boolean, onToggle: () => void) => (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
        borderRadius: '8px', border: 'none', cursor: 'pointer',
        backgroundColor: isSection ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: isSection ? 'white' : 'rgba(255,255,255,0.6)',
        fontSize: '12.5px', fontWeight: 500, fontFamily: 'Inter, sans-serif',
        width: '100%', justifyContent: 'space-between', position: 'relative',
      }}
    >
      {isSection && <div style={{ position: 'absolute', left: 0, width: '3px', height: '28px', backgroundColor: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icon size={15} /><span>{label}</span>
      </div>
      <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
    </button>
  );

  return (
    <div style={{ width: '210px', minWidth: '210px', backgroundColor: '#0d4a47', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: '36px', height: '36px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '13px' }}>LOGO</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {/* Dashboard, Attendance, Workforce */}
        {NAV_TOP.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>
            {({ isActive }) => (
              <>
                {isActive && <div style={{ position: 'absolute', left: 0, width: '3px', height: '28px', backgroundColor: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                <Icon size={15} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Payroll expandable */}
        {expandBtn('Payroll', CreditCard, payrollOpen, isPayroll, () => setPayrollOpen((p) => !p))}
        {payrollOpen && (
          <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {PAYROLL_ITEMS.map(({ to, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({ ...linkStyle(isActive), fontSize: '12px', padding: '7px 10px' })}>
                {({ isActive }) => (
                  <>
                    {isActive && <div style={{ position: 'absolute', left: 0, width: '3px', height: '22px', backgroundColor: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}

        {/* Approvals, Reports */}
        {NAV_BOT.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>
            {({ isActive }) => (
              <>
                {isActive && <div style={{ position: 'absolute', left: 0, width: '3px', height: '28px', backgroundColor: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                <Icon size={15} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Settings expandable */}
        {expandBtn('Settings', Settings, settingsOpen, isSettings, () => setSettingsOpen((p) => !p))}
        {settingsOpen && (
          <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {SETTINGS_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({ ...linkStyle(isActive), fontSize: '12px', padding: '7px 10px' })}>
                {({ isActive }) => (
                  <>
                    {isActive && <div style={{ position: 'absolute', left: 0, width: '3px', height: '22px', backgroundColor: '#4ade80', borderRadius: '0 3px 3px 0' }} />}
                    <Icon size={13} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', width: '100%', border: 'none', borderRadius: '8px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
