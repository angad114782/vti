import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import HRSidebar from './HRSidebar';
import { Search, Bell, HelpCircle } from 'lucide-react';

function HRTopBar() {
  const { user } = useAuthStore();
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();

  return (
    <div style={{ height: '60px', backgroundColor: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input placeholder="Search" style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{month}, {year}</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><HelpCircle size={18} /></button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', position: 'relative' }}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', border: '1px solid white' }} />
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{user?.name ?? 'HR User'}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right' }}>Human Resource</p>
          </div>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0d4a47' }}>
            {user ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : 'HR'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HRLayout() {
  const { user } = useAuthStore();
  if (!user || user.role !== 'HR') return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <HRSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <HRTopBar />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
