import { useState, useEffect, useCallback } from 'react';
import { subscriptionsApi, type Subscription, type PlanData } from '../../api/subscriptions';
import { companiesApi, type Company } from '../../api/companies';
import {
  IndianRupee, Users, Clock, AlertTriangle,
  Search, Check, X, Loader2, ChevronLeft, ChevronRight,
  Plus, Pencil,
  BarChart3,
  FileText,
  Shield,
  Download,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

const planMeta: Record<string, { label: string; bg: string; color: string; border: string }> = {
  ENTERPRISE: { label: 'Enterprise', bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
  PRO:        { label: 'Pro',        bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  BASIC:      { label: 'Basic',      bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
};
const quickActions = [
  { icon: Download, label: 'Download Payroll' },
  { icon: Shield, label: 'Manage Roles' },
  { icon: FileText, label: 'Download Summary' },
  { icon: BarChart3, label: 'View Reports' },
]; 
const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f5f3ff', color: '#8b5cf6' },
  { bg: '#f0f9ff', color: '#0ea5e9' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
];
const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const isExpiringSoon = (d: string) => { const dt = new Date(d); return dt > new Date() && dt < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); };

// ── Assign Plan Modal ─────────────────────────────────────────────────────────

function AssignModal({ plans, companies, onClose, onSave }: {
  plans: PlanData[]; companies: Company[]; onClose: () => void; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [plan, setPlan] = useState('PRO');
  const [billing, setBilling] = useState('Monthly');
  const [months, setMonths] = useState(12);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { setError('Please select a company'); return; }
    setSaving(true); setError('');
    try {
      await subscriptionsApi.assign({ companyId, plan, billingCycle: billing, months });
      onSave();
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
    borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif',
    color: '#0f172a', backgroundColor: 'white', cursor: 'pointer',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Assign Plan</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Assign a subscription plan to a company</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Company *</label>
            <select style={inputStyle} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Select a company...</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Plan</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {plans.map((p) => (
                <button key={p.type} type="button" onClick={() => setPlan(p.type)} style={{
                  padding: '12px 10px', border: `2px solid ${plan === p.type ? '#0d7470' : '#e2e8f0'}`,
                  borderRadius: '10px', backgroundColor: plan === p.type ? '#f0fafa' : 'white',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: plan === p.type ? '#0d7470' : '#374151' }}>{p.name}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>₹{p.price.toLocaleString('en-IN')}/mo</p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Billing Cycle</label>
              <select style={inputStyle} value={billing} onChange={(e) => setBilling(e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Duration (months)</label>
              <select style={inputStyle} value={months} onChange={(e) => setMonths(parseInt(e.target.value))}>
                {[1, 3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} {m === 1 ? 'month' : 'months'}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 24px', backgroundColor: saving ? '#7ab8b6' : '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif' }}>
              {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Assign Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ sub, onClose, onSave }: { sub: Subscription; onClose: () => void; onSave: () => void }) {
  const [saving, setSaving] = useState(false);
  const [billing, setBilling] = useState(sub.billingCycle);
  const [endDate, setEndDate] = useState(sub.endDate.slice(0, 10));
  const [active, setActive] = useState(sub.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await subscriptionsApi.update(sub.id, { billingCycle: billing, isActive: active, endDate });
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0f172a', backgroundColor: 'white', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Edit Subscription</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Company</label>
            <input disabled value={sub.company.name} style={{ ...inputStyle, backgroundColor: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Billing Cycle</label>
              <select style={inputStyle} value={billing} onChange={(e) => setBilling(e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Expiry Date</label>
              <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Status</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setActive(v)} style={{
                  flex: 1, padding: '8px', border: `2px solid ${active === v ? '#0d7470' : '#e2e8f0'}`,
                  borderRadius: '8px', backgroundColor: active === v ? '#f0fafa' : 'white',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  color: active === v ? '#0d7470' : '#64748b', fontFamily: 'Inter, sans-serif',
                }}>
                  {v ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#374151', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 24px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {saving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<'overview' | 'plans'>('overview');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ monthlyRevenue: 0, active: 0, trial: 0, expiringSoon: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showAssign, setShowAssign] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '8' };
      if (search) params.search = search;
      if (planFilter !== 'ALL') params.plan = planFilter;
      if (billingFilter !== 'ALL') params.billing = billingFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [subRes, planRes, compRes] = await Promise.all([
        subscriptionsApi.getAll(params),
        subscriptionsApi.getPlans(),
        companiesApi.getAll({ limit: '100' }),
      ]);
      setSubscriptions(subRes.data.subscriptions);
      setStats(subRes.data.stats);
      setPagination(subRes.data.pagination);
      setPlans(planRes.data);
      setAllCompanies(compRes.data.companies);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [search, planFilter, billingFilter, statusFilter, page]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const statsRow = [
    { label: 'Monthly Revenue',      value: fmtINR(stats.monthlyRevenue), icon: IndianRupee,   iconBg: '#f0fdf4', iconColor: '#22c55e' },
    { label: 'Active Subscriptions', value: String(stats.active),          icon: Users,         iconBg: '#eff6ff', iconColor: '#3b82f6' },
    { label: 'On Trial',             value: String(stats.trial),           icon: Clock,         iconBg: '#fffbeb', iconColor: '#d97706' },
    { label: 'Expiring Soon',        value: String(stats.expiringSoon),    icon: AlertTriangle, iconBg: '#fef2f2', iconColor: '#dc2626' },
  ];

  const selectStyle: React.CSSProperties = { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#374151', backgroundColor: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Subscriptions</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage your platform and monitor client companies</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ padding: '9px 18px', border: '1.5px solid #0d7470', borderRadius: '8px', backgroundColor: 'white', color: '#0d7470', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            + Create Plan
          </button>
          <button onClick={() => setShowAssign(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Plus size={15} /> Assign Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {statsRow.map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: s.label === 'Monthly Revenue' ? '18px' : '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{s.value}</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={19} color={s.iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
          {(['overview', 'plans'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '14px 24px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              backgroundColor: tab === t ? '#0d7470' : 'transparent',
              color: tab === t ? 'white' : '#64748b',
              borderBottom: tab === t ? '2px solid #0d7470' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {t === 'overview' ? 'Company Overview' : 'My Plans'}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Company Overview ── */}
        {tab === 'overview' && (
          <>
            {/* Filters */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by company name..." style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
              </div>
              <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} style={selectStyle}>
                <option value="ALL">All Plans</option>
                <option value="BASIC">Basic</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <select value={billingFilter} onChange={(e) => { setBillingFilter(e.target.value); setPage(1); }} style={selectStyle}>
                <option value="ALL">All Billing</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle}>
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '14px' }}>Loading subscriptions...</span>
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <IndianRupee size={40} color="#e2e8f0" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>No subscriptions found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['Company', 'Plan', 'Billing Cycle', 'Start Date', 'Expiry', 'Status', 'Actions'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s, i) => {
                      const av = getAvatarColor(s.company.name);
                      const pm = planMeta[s.plan];
                      const expWarn = isExpiringSoon(s.endDate);
                      return (
                        <tr key={s.id} style={{ borderBottom: i < subscriptions.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                          <td style={{ padding: '13px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: av.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av.color, fontWeight: 700, fontSize: '11px' }}>
                                {initials(s.company.name)}
                              </div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{s.company.name}</p>
                                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{s.company.industry ?? '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: pm?.bg, color: pm?.color, border: `1px solid ${pm?.border}` }}>{pm?.label}</span>
                          </td>
                          <td style={{ padding: '13px 20px', fontSize: '13px', color: '#374151' }}>{s.billingCycle}</td>
                          <td style={{ padding: '13px 20px', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>{fmtDate(s.startDate)}</td>
                          <td style={{ padding: '13px 20px' }}>
                            <p style={{ fontSize: '13px', color: expWarn ? '#dc2626' : '#374151', fontWeight: expWarn ? 600 : 400, whiteSpace: 'nowrap' }}>{fmtDate(s.endDate)}</p>
                            {expWarn && <p style={{ fontSize: '11px', color: '#dc2626' }}>Expiring soon</p>}
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: s.isActive ? '#dcfce7' : '#fee2e2', color: s.isActive ? '#15803d' : '#b91c1c' }}>
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '13px 20px' }}>
                            <button onClick={() => setEditSub(s)} style={{ width: '30px', height: '30px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                              <Pencil size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {(page - 1) * 8 + 1}–{Math.min(page * 8, pagination.total)} of {pagination.total}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? '#cbd5e1' : '#374151' }}><ChevronLeft size={15} /></button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: p === page ? '#0d7470' : 'white', color: p === page ? 'white' : '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: p === page ? 700 : 400 }}>{p}</button>
                  ))}
                  <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: page === pagination.totalPages ? '#f8fafc' : 'white', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === pagination.totalPages ? '#cbd5e1' : '#374151' }}><ChevronRight size={15} /></button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab 2: My Plans ── */}
        {tab === 'plans' && (
          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Available Plans</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Choose a plan that fits your company's needs</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {plans.map((p) => {
                const highlight = p.type === 'PRO';
                return (
                  <div key={p.type} style={{
                    border: `2px solid ${highlight ? '#0d7470' : '#e2e8f0'}`,
                    borderRadius: '14px', padding: '24px', position: 'relative',
                    backgroundColor: highlight ? '#f0fafa' : 'white',
                  }}>
                    {highlight && (
                      <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0d7470', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px' }}>
                        POPULAR
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>₹{p.price.toLocaleString('en-IN')}</span>
                      <span style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>/mo</span>
                    </div>
                    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '12px', backgroundColor: planMeta[p.type]?.bg, color: planMeta[p.type]?.color, border: `1px solid ${planMeta[p.type]?.border}` }}>
                      {p.name}
                    </span>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                      User Limit: <strong>{p.maxUsers >= 999999 ? 'Unlimited' : p.maxUsers}</strong>
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      {p.features.map((f) => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Check size={10} color="#15803d" />
                          </div>
                          <span style={{ fontSize: '12px', color: '#374151' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAssign(true)}
                      style={{
                        width: '100%', padding: '10px', border: `2px solid ${highlight ? '#0d7470' : '#e2e8f0'}`,
                        borderRadius: '9px', backgroundColor: highlight ? '#0d7470' : 'white',
                        color: highlight ? 'white' : '#374151',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Assign to Company
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssign && (
        <AssignModal plans={plans} companies={allCompanies} onClose={() => setShowAssign(false)} onSave={() => { setShowAssign(false); void fetchAll(); }} />
      )}
      {editSub && (
        <EditModal sub={editSub} onClose={() => setEditSub(null)} onSave={() => { setEditSub(null); void fetchAll(); }} />
      )}


       {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', padding: '18px 22px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
          QUICK ACTIONS
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {quickActions.map((q) => (
            <button key={q.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              padding: '18px 12px', borderRadius: '10px',
              border: '1px solid #e2e8f0', backgroundColor: 'white',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#0d7470'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
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
