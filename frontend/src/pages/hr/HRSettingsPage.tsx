import { useState } from 'react';
import { Save, Shield, Bell, User, Loader2, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

type Tab = 'profile' | 'notifications' | 'security';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: '44px', height: '24px', borderRadius: '12px', backgroundColor: on ? '#0d7470' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: on ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 1100, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '10px', backgroundColor: '#0d7470', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontSize: '13px', fontWeight: 600 }}>
      <CheckCircle2 size={16} /> {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', marginLeft: '4px' }}><X size={14} /></button>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0f172a', backgroundColor: 'white' };
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px', display: 'block' };

export default function HRSettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: '', department: 'Human Resources' });
  const [notifs, setNotifs] = useState({ leaveAlerts: true, attendanceAlerts: true, payrollAlerts: false, approvalReminders: true });
  const [security, setSecurity] = useState({ twoFA: false, sessionTimeout: true });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setToast('Settings saved successfully');
    setTimeout(() => setToast(''), 3000);
  };

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage your account preferences and security</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px', gap: '2px', width: 'fit-content' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 20px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === key ? '#0d7470' : 'transparent', color: tab === key ? 'white' : '#64748b', transition: 'all 0.15s' }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Profile Settings</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Update your personal information</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={labelStyle}>Full Name</label><input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Email Address</label><input value={profile.email} type="email" onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Phone Number</label><input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" style={inputStyle} /></div>
            <div><label style={labelStyle}>Department</label><input value={profile.department} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => void handleSave()} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 22px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.8 : 1 }}>
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Notification Preferences</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Choose which alerts you want to receive</p>
          {[
            { key: 'leaveAlerts' as const, label: 'Leave Request Alerts', desc: 'Get notified when employees submit leave requests' },
            { key: 'attendanceAlerts' as const, label: 'Attendance Alerts', desc: 'Alerts for late arrivals and absences' },
            { key: 'payrollAlerts' as const, label: 'Payroll Alerts', desc: 'Notifications for payroll processing and salary revisions' },
            { key: 'approvalReminders' as const, label: 'Approval Reminders', desc: 'Reminders for pending approval requests' },
          ].map((n) => (
            <div key={n.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '14px 0', borderBottom: '1px solid #f8fafc' }}>
              <div><p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{n.label}</p><p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{n.desc}</p></div>
              <Toggle on={notifs[n.key]} onChange={(v) => setNotifs((p) => ({ ...p, [n.key]: v }))} />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => void handleSave()} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 22px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.8 : 1 }}>
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Security Settings</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Manage your account security preferences</p>
          {[
            { key: 'twoFA' as const, label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
            { key: 'sessionTimeout' as const, label: 'Auto Session Timeout', desc: 'Automatically log out after inactivity' },
          ].map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '14px 0', borderBottom: '1px solid #f8fafc' }}>
              <div><p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{s.label}</p><p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.desc}</p></div>
              <Toggle on={security[s.key]} onChange={(v) => setSecurity((p) => ({ ...p, [s.key]: v }))} />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => void handleSave()} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 22px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.8 : 1 }}>
              {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
