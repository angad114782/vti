import { useState, useEffect, useCallback } from 'react';
import { hrApi, type Approval } from '../../api/hr';
import { Search, CheckCircle2, XCircle, AlertTriangle, Clock, Loader2, Eye, X } from 'lucide-react';

const TYPES = ['Leave', 'Expense', 'Attendance Corrections', 'Overtime', 'Shift Change Request'];
const PRIORITY_COLOR: Record<string, { bg: string; color: string }> = {
  P1: { bg: '#fef2f2', color: '#b91c1c' },
  P2: { bg: '#fff7ed', color: '#c2410c' },
  P3: { bg: '#fef9c3', color: '#854d0e' },
  P4: { bg: '#f0fdf4', color: '#15803d' },
};

const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
  { bg: '#f0f9ff', color: '#0ea5e9' },
];
const getAv = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]!;
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [stats, setStats] = useState({ pending: 24, approvedToday: 12, rejected: 3, escalated: 5 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewItem, setViewItem] = useState<Approval | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, string> = {};
      if (search) p.search = search;
      if (statusFilter !== 'ALL') p.status = statusFilter;
      if (typeFilter !== 'ALL') p.type = typeFilter;
      const { data } = await hrApi.getApprovals(p);
      setApprovals(data.approvals); setStats(data.stats);
    } finally { setLoading(false); }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { void fetch(); }, [fetch]);

  const handleAction = async (id: string, status: string) => {
    await hrApi.updateApproval(id, status);
    setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setViewItem(null);
  };

  const statCards = [
    { label: 'Pending Requests', value: stats.pending,       icon: Clock,         color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Approved Today',   value: stats.approvedToday, icon: CheckCircle2,  color: '#10b981', bg: '#f0fdf4' },
    { label: 'Rejected Requests',value: stats.rejected,      icon: XCircle,       color: '#ef4444', bg: '#fef2f2' },
    { label: 'Escalated Requests',value: stats.escalated,    icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb' },
  ];

  const selectStyle: React.CSSProperties = { padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#374151', backgroundColor: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Approvals</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage and monitor all approval requests</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div><p style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{s.label}</p><p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{s.value}</p></div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><s.icon size={19} color={s.color} /></div>
          </div>
        ))}
      </div>

      {/* Type tabs */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '2px', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          {['ALL', ...TYPES].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: typeFilter === t ? '#0d7470' : 'transparent', color: typeFilter === t ? 'white' : '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              {t === 'ALL' ? 'All Request' : t}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." style={{ width: '100%', paddingLeft: '34px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="ALL">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: '14px' }}>Loading...</span></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Employee', 'Request Type', 'Details', 'Date', 'Priority', 'Action'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 18px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map((a, i) => {
                  const av = getAv(a.employee.user.name);
                  const pc = PRIORITY_COLOR[a.priority] ?? PRIORITY_COLOR['P1']!;
                  return (
                    <tr key={a.id} style={{ borderBottom: i < approvals.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av.color, fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>{initials(a.employee.user.name)}</div>
                          <div><p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{a.employee.user.name}</p><p style={{ fontSize: '11px', color: '#94a3b8' }}>{a.employee.employeeId}</p></div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{a.type}</span></td>
                      <td style={{ padding: '12px 18px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{a.details}</span></td>
                      <td style={{ padding: '12px 18px' }}><span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(a.date)}</span></td>
                      <td style={{ padding: '12px 18px' }}><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, backgroundColor: pc.bg, color: pc.color }}>{a.priority}</span></td>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setViewItem(a)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Eye size={13} /></button>
                          {a.status === 'Pending' && <>
                            <button onClick={() => void handleAction(a.id, 'Approved')} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#15803d' }}><CheckCircle2 size={13} /></button>
                            <button onClick={() => void handleAction(a.id, 'Rejected')} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#b91c1c' }}><XCircle size={13} /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(135deg, #0d4a47, #0d7470)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Approval Request</h3>
              <button onClick={() => setViewItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['Employee', viewItem.employee.user.name], ['Type', viewItem.type], ['Details', viewItem.details], ['Date', fmtDate(viewItem.date)], ['Priority', viewItem.priority], ['Status', viewItem.status]].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{k as string}</span>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{v as string}</span>
                </div>
              ))}
            </div>
            {viewItem.status === 'Pending' && (
              <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => void handleAction(viewItem.id, 'Rejected')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', border: '1.5px solid #fecaca', borderRadius: '8px', backgroundColor: 'white', color: '#b91c1c', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}><XCircle size={13} /> Reject</button>
                <button onClick={() => void handleAction(viewItem.id, 'Approved')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}><CheckCircle2 size={13} /> Approve</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
