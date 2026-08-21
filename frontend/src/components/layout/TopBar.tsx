import { Bell, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import GlobalSearch from '../search/GlobalSearch';

export default function TopBar() {
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header style={{
      height: '60px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      {/* Search */}
      <GlobalSearch />

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8', marginRight: '8px' }}>{today}</span>

        <button style={{
          width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '8px',
          backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#64748b',
        }}>
          <RefreshCw size={15} />
        </button>

        <button style={{
          width: '36px', height: '36px', border: '1px solid #e2e8f0', borderRadius: '8px',
          backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#64748b', position: 'relative',
        }}>
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: '7px', right: '7px',
            width: '7px', height: '7px', backgroundColor: '#ef4444',
            borderRadius: '50%', border: '1.5px solid white',
          }} />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          paddingLeft: '12px', borderLeft: '1px solid #e2e8f0', marginLeft: '4px',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#15803d', fontWeight: 700, fontSize: '13px',
          }}>
            {user?.name?.charAt(0) ?? 'A'}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{user?.name}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
