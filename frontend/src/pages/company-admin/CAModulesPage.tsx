import { useState, useEffect } from 'react';
import { caApi, type CAModule } from '../../api/companyAdmin';
import { Loader2, Layers, CheckCircle2, XCircle } from 'lucide-react';

const MODULE_ICONS: Record<string, string> = {
  Attendance: '📅', Payroll: '💰', 'Leave Management': '✈️',
  'Performance': '📈', 'Recruitment': '🧑‍💼', 'Training': '📚',
  'Expense Management': '🧾', Documents: '📂', Reports: '📊',
};

export default function CAModulesPage() {
  const [modules,  setModules]  = useState<CAModule[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    caApi.getModules().then(({ data }) => setModules(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (m: CAModule) => {
    setToggling(m.module.id);
    try {
      await caApi.toggleModule(m.module.id, !m.isEnabled);
      setModules((prev) => prev.map((x) => x.module.id === m.module.id ? { ...x, isEnabled: !m.isEnabled } : x));
    } finally { setToggling(null); }
  };

  const enabled  = modules.filter((m) => m.isEnabled).length;
  const disabled = modules.length - enabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Modules</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Enable or disable feature modules for your company</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{enabled}</p>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>Active</p>
          </div>
          <div style={{ backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{disabled}</p>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>Inactive</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" /></div>
      ) : modules.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center' }}>
          <Layers size={32} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>No modules configured</p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Contact your Super Admin to set up modules for this company.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {modules.map((m) => (
            <div key={m.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: `1px solid ${m.isEnabled ? '#bbf7d0' : '#e2e8f0'}`, padding: '20px', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: m.isEnabled ? '#f0fdf4' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {MODULE_ICONS[m.module.name] ?? '🔧'}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{m.module.name}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                      {m.isEnabled ? <CheckCircle2 size={11} color="#16a34a" /> : <XCircle size={11} color="#94a3b8" />}
                      <span style={{ fontSize: '11px', color: m.isEnabled ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>{m.isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => void handleToggle(m)}
                  disabled={toggling === m.module.id}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: toggling === m.module.id ? 'not-allowed' : 'pointer', backgroundColor: m.isEnabled ? '#16a34a' : '#e2e8f0', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '3px', left: m.isEnabled ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
              {m.module.description && <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{m.module.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
