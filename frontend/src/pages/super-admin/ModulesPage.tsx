import { useState, useEffect, useCallback } from 'react';
import { modulesApi, type AppModule, type PermissionItem } from '../../api/modules';
import {
  Layers, Shield, Users, Clock, DollarSign,
  BarChart3, FileText, Briefcase, Settings2,
  ChevronDown, Loader2, Download, UserCog,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const MODULE_GROUPS: Record<string, string[]> = {
  'Core Modules': ['Employee Management', 'Attendance Tracking', 'Shift Management'],
  'Finance Modules': ['Payroll Management', 'Leave Management', 'Expense Tracking'],
  'Analytics': ['Reports'],
};

const MODULE_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'Employee Management': Users,
  'Attendance Tracking': Clock,
  'Shift Management': Settings2,
  'Payroll Management': DollarSign,
  'Leave Management': FileText,
  'Expense Tracking': Briefcase,
  'Reports': BarChart3,
};

const MODULE_COLOR: Record<string, string> = {
  'Employee Management': '#3b82f6',
  'Attendance Tracking': '#f59e0b',
  'Shift Management': '#8b5cf6',
  'Payroll Management': '#10b981',
  'Leave Management': '#ec4899',
  'Expense Tracking': '#0ea5e9',
  'Reports': '#6366f1',
};

const PLAN_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  BASIC:      { bg: '#f1f5f9', color: '#475569', label: 'Basic' },
  PRO:        { bg: '#dbeafe', color: '#1d4ed8', label: 'Pro' },
  ENTERPRISE: { bg: '#d1fae5', color: '#065f46', label: 'Enterprise' },
};

const ROLES = ['Administrator', 'Accountant', 'Manager', 'Supervisor', 'Contract Workforce'];

const PERM_MODULE_ORDER = ['ATTENDANCE', 'WORKFORCE', 'REPORTS', 'PAYROLL'];
const PERM_MODULE_LABEL: Record<string, string> = {
  ATTENDANCE: 'Attendance Module',
  WORKFORCE:  'Workforce Module',
  REPORTS:    'Reports Module',
  PAYROLL:    'Payroll Module',
};

const quickActions = [
  { icon: Download, label: 'Export Config' },
  { icon: UserCog,  label: 'Manage Roles' },
  { icon: Shield,   label: 'Audit Access' },
  { icon: Layers,   label: 'Module Report' },
];

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div onClick={() => !disabled && onChange(!on)}
      style={{ width: '40px', height: '22px', borderRadius: '11px', backgroundColor: on ? '#0d7470' : '#e2e8f0', position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: '3px', left: on ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s' }} />
    </div>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${checked ? '#0d7470' : '#cbd5e1'}`, backgroundColor: checked ? '#0d7470' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ── Module Access Tab ─────────────────────────────────────────────────────────

function ModuleAccessTab() {
  const [companies, setCompanies] = useState<{ id: string; name: string; plan: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    modulesApi.getCompanies().then(({ data }) => {
      setCompanies(data);
      if (data.length > 0) setSelectedCompany(data[0]!.id);
    });
  }, []);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await modulesApi.getModules(selectedCompany || undefined);
      setModules(data.modules);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => { void fetchModules(); }, [fetchModules]);

  const handleToggle = async (mod: AppModule, val: boolean) => {
    if (!selectedCompany) return;
    setSaving(mod.id);
    await modulesApi.toggleModule(selectedCompany, mod.id, val);
    setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, isEnabled: val } : m));
    setSaving(null);
  };

  const moduleMap = Object.fromEntries(modules.map((m) => [m.name, m]));

  const selectStyle: React.CSSProperties = {
    padding: '7px 32px 7px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#374151', backgroundColor: 'white', cursor: 'pointer',
    outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Company selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ position: 'relative' }}>
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} style={selectStyle}>
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '14px' }}>Loading modules...</span>
        </div>
      ) : (
        Object.entries(MODULE_GROUPS).map(([groupName, modNames]) => {
          const groupMods = modNames.map((n) => moduleMap[n]).filter(Boolean) as AppModule[];
          if (!groupMods.length) return null;
          return (
            <div key={groupName} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{groupName}</h3>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: '#d1fae5', color: '#065f46' }}>
                  {groupMods.length} modules
                </span>
              </div>

              {groupMods.map((mod, i) => {
                const Icon = MODULE_ICON[mod.name] ?? Layers;
                const color = MODULE_COLOR[mod.name] ?? '#64748b';
                const isOn = mod.isEnabled ?? false;
                const isSaving = saving === mod.id;

                return (
                  <div key={mod.id} style={{ padding: '18px 22px', borderBottom: i < groupMods.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    {/* Icon */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={19} color={color} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{mod.name}</p>
                      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{mod.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Available for:</span>
                        {mod.availableFor.map((plan) => {
                          const pb = PLAN_BADGE[plan];
                          if (!pb) return null;
                          return (
                            <span key={plan} style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: pb.bg, color: pb.color }}>{pb.label}</span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSaving && <Loader2 size={14} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />}
                      <Toggle on={isOn} onChange={(v) => void handleToggle(mod, v)} disabled={!selectedCompany || isSaving} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Role Permissions Tab ──────────────────────────────────────────────────────

function RolePermissionsTab() {
  const [selectedRole, setSelectedRole] = useState('Administrator');
  const [permissions, setPermissions] = useState<Record<string, PermissionItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPerms = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await modulesApi.getPermissions(selectedRole);
      setPermissions(data.permissions);
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => { void fetchPerms(); }, [fetchPerms]);

  const handlePermission = async (permission: string, isGranted: boolean) => {
    setSaving(permission);
    await modulesApi.updatePermission(selectedRole, permission, isGranted);
    setPermissions((prev) => {
      const next = { ...prev };
      for (const mod of Object.keys(next)) {
        next[mod] = next[mod]!.map((p) => p.permission === permission ? { ...p, isGranted } : p);
      }
      return next;
    });
    setSaving(null);
  };

  const roleAvatarColor = (role: string) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
    return colors[ROLES.indexOf(role) % colors.length]!;
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      {/* Role list */}
      <div style={{ width: '200px', flexShrink: 0, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Roles</p>
        </div>
        {ROLES.map((role) => {
          const isActive = role === selectedRole;
          const color = roleAvatarColor(role);
          return (
            <button key={role} onClick={() => setSelectedRole(role)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent', backgroundColor: isActive ? `${color}08` : 'white', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color, flexShrink: 0 }}>
                {role.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? color : '#374151', lineHeight: '1.3' }}>{role}</span>
            </button>
          );
        })}
      </div>

      {/* Permissions panel */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{selectedRole}</p>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Manage permissions for this role</p>
          </div>
          {loading && <Loader2 size={16} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />}
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {PERM_MODULE_ORDER.map((modKey) => {
            const perms = permissions[modKey];
            if (!perms || perms.length === 0) return null;
            return (
              <div key={modKey}>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
                  {PERM_MODULE_LABEL[modKey]}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {perms.map((p) => {
                    const isSavingThis = saving === p.permission;
                    return (
                      <div key={p.permission} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{p.permission}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isSavingThis && <Loader2 size={13} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />}
                          <Checkbox checked={p.isGranted} onChange={(v) => void handlePermission(p.permission, v)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const [tab, setTab] = useState<'module' | 'role'>('module');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Modules & Access</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Control what each company can use and who can access what</p>
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: '9px', overflow: 'hidden', backgroundColor: 'white' }}>
          {([
            { key: 'module', label: 'Module Access',    Icon: Layers },
            { key: 'role',   label: 'Role Permissions', Icon: Shield },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif',
              backgroundColor: tab === key ? '#0d7470' : 'white',
              color: tab === key ? 'white' : '#64748b',
              transition: 'all 0.15s',
            }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'module' ? <ModuleAccessTab /> : <RolePermissionsTab />}

      {/* Quick Actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>QUICK ACTIONS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {quickActions.map((q) => (
            <button key={q.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '18px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = '#f8fafc'; el.style.borderColor = '#0d7470'; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'white'; el.style.borderColor = '#e2e8f0'; }}
            >
              <q.icon size={22} color="#0d7470" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
