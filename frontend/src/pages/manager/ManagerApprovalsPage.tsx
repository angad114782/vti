import { useState, useEffect, useCallback } from 'react';
import { hrApi, type Approval } from '../../api/hr';
import { Search, Eye, CheckCircle2, X, Loader2, ChevronDown } from 'lucide-react';

type Tab = 'All Request' | 'Leave Request' | 'Attendance Corrections';
const TABS: Tab[] = ['All Request', 'Leave Request', 'Attendance Corrections'];

const STATS = [
  { label: 'Total Requests',   value: '50', color: '#7c3aed', iconBg: '#f5f3ff' },
  { label: 'Pending Requests', value: '24', color: '#ea580c', iconBg: '#fff7ed' },
  { label: 'Approved Today',   value: '12', color: '#16a34a', iconBg: '#f0fdf4' },
  { label: 'Rejected Requests',value: '3',  color: '#dc2626', iconBg: '#fef2f2' },
];

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function ViewModal({ approval, onClose, onAction }: { approval: Approval; onClose: () => void; onAction: (id: string, status: 'APPROVED' | 'REJECTED') => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Approval Request</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            ['Employee', approval.employee.user.name],
            ['Employee ID', approval.employee.employeeId],
            ['Request Type', approval.type],
            ['Details', approval.details],
            ['Date', fmtDate(approval.createdAt)],
            ['Status', approval.status],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
        {approval.status === 'PENDING' && (
          <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={() => { onAction(approval.id, 'REJECTED'); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}><X size={13} /> Reject</button>
            <button onClick={() => { onAction(approval.id, 'APPROVED'); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}><CheckCircle2 size={13} /> Approve</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManagerApprovalsPage() {
  const [tab, setTab] = useState<Tab>('All Request');
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Approval | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, string> = {};
      if (search) p.search = search;
      if (tab === 'Leave Request') p.type = 'Leave';
      if (tab === 'Attendance Corrections') p.type = 'Attendance Corrections';
      const { data } = await hrApi.getApprovals(p);
      setApprovals(data.approvals ?? data as unknown as Approval[]);
    } finally { setLoading(false); }
  }, [search, tab]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await hrApi.updateApproval(id, status);
    setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Approvals</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage and monitor all approval requests</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {STATS.map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: '26px', fontWeight: 800, color, marginTop: '4px' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ padding: '4px', display: 'flex', gap: '2px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? '#0d7470' : 'transparent', color: tab === t ? 'white' : '#64748b', transition: 'all 0.15s' }}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '250px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
          </div>
          {[['All Status', ['All Status', 'Pending', 'Approved', 'Rejected']], ['All Departments', ['All Departments', 'Engineering', 'HR', 'Finance']], ['All Types', ['All Types', 'Leave', 'Expense', 'Overtime']]].map(([ph, opts]) => (
            <div key={ph as string} style={{ position: 'relative' }}>
              <select style={{ padding: '6px 24px 6px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#374151', backgroundColor: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none' }}>
                {(opts as string[]).map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: '14px' }}>Loading...</span></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Employee', 'Request Type', 'Details', 'Date', 'Action'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvals.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: i < approvals.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{a.employee.user.name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{a.employee.employeeId}</p>
                    </td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{a.type}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{a.details}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(a.createdAt)}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => setSelected(a)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Eye size={13} /></button>
                        {a.status === 'PENDING' && (
                          <>
                            <button onClick={() => void handleAction(a.id, 'APPROVED')} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CheckCircle2 size={13} color="white" /></button>
                            <button onClick={() => void handleAction(a.id, 'REJECTED')} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={13} color="white" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <ViewModal approval={selected} onClose={() => setSelected(null)} onAction={handleAction} />}
    </div>
  );
}
