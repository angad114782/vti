import { useState, useEffect, useCallback } from 'react';
import { caApi, type CAUser } from '../../api/companyAdmin';
import { Search, Plus, X, Edit2, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const ROLES = ['HR', 'MANAGER', 'SUPERVISOR', 'FINANCE', 'EMPLOYEE', 'COMPANY_ADMIN'];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  HR:            { bg: '#f0fdfa', color: '#0d7470' },
  MANAGER:       { bg: '#eff6ff', color: '#2563eb' },
  SUPERVISOR:    { bg: '#ede9fe', color: '#7c3aed' },
  FINANCE:       { bg: '#fff7ed', color: '#ea580c' },
  EMPLOYEE:      { bg: '#f0fdf4', color: '#16a34a' },
  COMPANY_ADMIN: { bg: '#eef2ff', color: '#6366f1' },
};

const avatarColors = ['#6366f1', '#0d7470', '#7c3aed', '#ea580c', '#2563eb', '#16a34a'];
const getColor = (n: string) => avatarColors[n.charCodeAt(0) % avatarColors.length]!;
const ini = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CAUsersPage() {
  const [users,      setUsers]      = useState<CAUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showAdd,    setShowAdd]    = useState(false);
  const [editUser,   setEditUser]   = useState<CAUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form,       setForm]       = useState({ name: '', email: '', role: 'EMPLOYEE', password: '' });
  const [formError,  setFormError]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (roleFilter !== 'ALL') p.role = roleFilter;
    try {
      const { data } = await caApi.getUsers(p);
      setUsers(data);
    } finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.email) { setFormError('Name and email are required'); return; }
    setSubmitting(true); setFormError('');
    try {
      await caApi.createUser(form);
      setShowAdd(false); setForm({ name: '', email: '', role: 'EMPLOYEE', password: '' });
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    await caApi.updateUser(id, { role });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    setEditUser(null);
  };

  const handleToggleActive = async (u: CAUser) => {
    await caApi.updateUser(u.id, { isActive: !u.isActive });
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isActive: !u.isActive } : x));
  };

  const InputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#374151', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Users</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage all users in your company — assign roles, activate or deactivate accounts</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <Plus size={14} /> Add User
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '260px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['ALL', ...ROLES].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: '5px 11px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: roleFilter === r ? '#6366f1' : '#f1f5f9', color: roleFilter === r ? 'white' : '#64748b', whiteSpace: 'nowrap' }}>
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['User', 'Role', 'Department', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS['EMPLOYEE']!;
                const color = getColor(u.name);
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f8fafc' : 'none', opacity: u.isActive ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>{ini(u.name)}</div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{u.name}</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {editUser?.id === u.id ? (
                        <select defaultValue={u.role} onChange={(e) => void handleRoleChange(u.id, e.target.value)} style={{ padding: '5px 8px', border: '1.5px solid #6366f1', borderRadius: '6px', fontSize: '12px', color: '#374151', backgroundColor: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          {ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: rc.bg, color: rc.color, whiteSpace: 'nowrap' }}>{u.role.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: '#64748b' }}>{u.employee?.department ?? '—'}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: u.isActive ? '#f0fdf4' : '#fef2f2', color: u.isActive ? '#15803d' : '#b91c1c' }}>
                        {u.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />} {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setEditUser(editUser?.id === u.id ? null : u)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: editUser?.id === u.id ? '#eef2ff' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6366f1' }}><Edit2 size={12} /></button>
                        <button onClick={() => void handleToggleActive(u)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: u.isActive ? '#fef2f2' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          {u.isActive ? <XCircle size={12} color="#dc2626" /> : <CheckCircle2 size={12} color="#16a34a" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', width: '440px', maxWidth: '94vw', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Add New User</h3>
              <button onClick={() => { setShowAdd(false); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            {formError && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '12px', marginBottom: '14px' }}>{formError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Full Name</label><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Rohit Sharma" style={InputStyle} /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Email Address</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="rohit@company.com" style={InputStyle} /></div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Role</label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} style={{ ...InputStyle, cursor: 'pointer', backgroundColor: 'white' }}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Password <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional — defaults to name@123)</span></label><input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Leave blank for default" style={InputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setShowAdd(false); setFormError(''); }} style={{ flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => void handleAdd()} disabled={submitting} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: submitting ? '#a5b4fc' : '#6366f1', color: 'white', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {submitting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
