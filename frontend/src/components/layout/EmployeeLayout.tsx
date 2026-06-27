import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import EmployeeSidebar from './EmployeeSidebar';
import { Bell, Search } from 'lucide-react';

const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
];
const getAv = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]!;
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function EmployeeLayout() {
  const { user } = useAuthStore();
  if (!user || !['EMPLOYEE', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/login" replace />;

  const av = getAv(user.name ?? 'E');

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
      <EmployeeSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* TopBar */}
        <div style={{ height: '56px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Search..." style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
          </div>
          <div style={{ flex: 1 }} />
          <button style={{ position: 'relative', width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={15} color="#64748b" />
            <span style={{ position: 'absolute', top: '6px', right: '7px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{user.name}</p>
              <p style={{ fontSize: '10px', color: '#94a3b8' }}>Employee</p>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av.color, fontWeight: 700, fontSize: '12px' }}>{initials(user.name ?? 'E')}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
