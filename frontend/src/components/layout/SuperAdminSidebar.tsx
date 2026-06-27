import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CreditCard,
  Activity, Shield, Headphones, Settings, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { label: 'Dashboard',       icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Companies',       icon: Building2,        to: '/companies' },
  { label: 'Subscriptions',   icon: CreditCard,       to: '/subscriptions' },
  { label: 'Activity',        icon: Activity,         to: '/activity' },
  { label: 'Modules Control', icon: Shield,           to: '/modules' },
  { label: 'Support',         icon: Headphones,       to: '/support' },
  { label: 'Settings',        icon: Settings,         to: '/settings' },
];

export default function SuperAdminSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: '220px',
      minWidth: '220px',
      height: '100vh',
      backgroundColor: '#0d4a47',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '15px' }}>W</span>
          </div>
          <div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', display: 'block', lineHeight: 1.2 }}>WorkMgmt</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Super Admin</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              marginBottom: '2px',
              fontSize: '13.5px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.15s',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: '#4ade80',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0d4a47', fontWeight: 700, fontSize: '12px', flexShrink: 0,
          }}>
            {user?.name?.charAt(0) ?? 'A'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', width: '100%', borderRadius: '8px',
            backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: '13.5px', fontWeight: 500,
            transition: 'background 0.15s', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
