import { useState } from 'react';

const ROLES = ['COMPANY_ADMIN', 'HR', 'MANAGER', 'SUPERVISOR', 'FINANCE', 'EMPLOYEE'];

const ROLE_LABELS: Record<string, string> = {
  COMPANY_ADMIN: 'Company Admin',
  HR:            'HR',
  MANAGER:       'Manager',
  SUPERVISOR:    'Supervisor',
  FINANCE:       'Finance',
  EMPLOYEE:      'Employee',
};

const MODULES = [
  'Dashboard',
  'Attendance — View',
  'Attendance — Edit',
  'Workforce — View',
  'Workforce — Add/Edit',
  'Payroll — View',
  'Payroll — Process',
  'Approvals — View',
  'Approvals — Action',
  'Reports — View',
  'Reports — Download',
  'Settings — Company',
  'Settings — Roles',
  'Settings — Workflows',
];

type Matrix = Record<string, Record<string, boolean>>;

const INITIAL: Matrix = {
  COMPANY_ADMIN: Object.fromEntries(MODULES.map((m) => [m, true])),
  HR:            Object.fromEntries(MODULES.map((m) => [m, ['Dashboard', 'Attendance — View', 'Attendance — Edit', 'Workforce — View', 'Workforce — Add/Edit', 'Approvals — View', 'Approvals — Action', 'Reports — View'].includes(m)])),
  MANAGER:       Object.fromEntries(MODULES.map((m) => [m, ['Dashboard', 'Attendance — View', 'Workforce — View', 'Approvals — View', 'Reports — View'].includes(m)])),
  SUPERVISOR:    Object.fromEntries(MODULES.map((m) => [m, ['Dashboard', 'Attendance — View', 'Workforce — View', 'Approvals — View'].includes(m)])),
  FINANCE:       Object.fromEntries(MODULES.map((m) => [m, ['Dashboard', 'Payroll — View', 'Payroll — Process', 'Reports — View', 'Reports — Download'].includes(m)])),
  EMPLOYEE:      Object.fromEntries(MODULES.map((m) => [m, ['Dashboard'].includes(m)])),
};

const ROLE_COLORS: Record<string, string> = {
  COMPANY_ADMIN: '#0d7470', HR: '#2563eb', MANAGER: '#6366f1', SUPERVISOR: '#d97706', FINANCE: '#16a34a', EMPLOYEE: '#64748b',
};

export default function CARolesPage() {
  const [matrix, setMatrix] = useState<Matrix>(INITIAL);
  const [selectedRole, setSelectedRole] = useState('COMPANY_ADMIN');

  const toggle = (perm: string) => {
    if (selectedRole === 'COMPANY_ADMIN') return; // lock admin
    setMatrix((p) => ({ ...p, [selectedRole]: { ...p[selectedRole]!, [perm]: !p[selectedRole]![perm] } }));
  };

  const currentPerms = matrix[selectedRole] ?? {};
  const grantedCount = Object.values(currentPerms).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Roles & Permissions</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Configure what each role can access within the system.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'flex-start' }}>
        {/* Role list */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Role</p>
          </div>
          {ROLES.map((r) => {
            const perms = matrix[r] ?? {};
            const count = Object.values(perms).filter(Boolean).length;
            return (
              <button key={r} onClick={() => setSelectedRole(r)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', border: 'none', backgroundColor: selectedRole === r ? '#f0fdfa' : 'white', borderLeft: `3px solid ${selectedRole === r ? ROLE_COLORS[r] : 'transparent'}`, cursor: 'pointer', fontFamily: 'Inter, sans-serif', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', fontWeight: selectedRole === r ? 700 : 500, color: selectedRole === r ? ROLE_COLORS[r] : '#374151' }}>{ROLE_LABELS[r]}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{count}/{MODULES.length} perms</p>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ROLE_COLORS[r], opacity: 0.6 }} />
              </button>
            );
          })}
        </div>

        {/* Permission matrix */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{ROLE_LABELS[selectedRole]}</h3>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{grantedCount} of {MODULES.length} permissions granted</p>
            </div>
            {selectedRole === 'COMPANY_ADMIN' && (
              <span style={{ fontSize: '10px', color: '#0d7470', fontWeight: 600, backgroundColor: '#f0fdfa', padding: '3px 8px', borderRadius: '4px' }}>Full Access (locked)</span>
            )}
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {MODULES.map((mod) => {
                const enabled = currentPerms[mod] ?? false;
                const locked = selectedRole === 'COMPANY_ADMIN';
                return (
                  <button key={mod} onClick={() => toggle(mod)} disabled={locked} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${enabled ? '#0d7470' : '#e2e8f0'}`, backgroundColor: enabled ? '#f0fdfa' : 'white', cursor: locked ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', opacity: locked ? 0.8 : 1 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${enabled ? '#0d7470' : '#d1d5db'}`, backgroundColor: enabled ? '#0d7470' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {enabled && <span style={{ color: 'white', fontSize: '10px', lineHeight: 1, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: enabled ? 600 : 400, color: enabled ? '#0d4a47' : '#64748b' }}>{mod}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setMatrix((p) => ({ ...p, [selectedRole]: Object.fromEntries(MODULES.map((m) => [m, false])) }))} disabled={selectedRole === 'COMPANY_ADMIN'} style={{ padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: 'white', color: '#374151', fontSize: '11px', fontWeight: 600, cursor: selectedRole === 'COMPANY_ADMIN' ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: selectedRole === 'COMPANY_ADMIN' ? 0.4 : 1 }}>Revoke All</button>
            <button onClick={() => setMatrix((p) => ({ ...p, [selectedRole]: Object.fromEntries(MODULES.map((m) => [m, true])) }))} disabled={selectedRole === 'COMPANY_ADMIN'} style={{ padding: '7px 14px', border: 'none', borderRadius: '7px', backgroundColor: '#0d7470', color: 'white', fontSize: '11px', fontWeight: 600, cursor: selectedRole === 'COMPANY_ADMIN' ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: selectedRole === 'COMPANY_ADMIN' ? 0.4 : 1 }}>Grant All</button>
            <button style={{ padding: '7px 16px', border: 'none', borderRadius: '7px', backgroundColor: '#0d4a47', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save Permissions</button>
          </div>
        </div>
      </div>
    </div>
  );
}
