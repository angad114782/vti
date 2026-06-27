import { useState } from 'react';
import { Check, X } from 'lucide-react';

type ApprovalTab = 'pending' | 'approved' | 'rejected';
type SubTab = 'leave' | 'expense' | 'correction';

const STATS = [
  { label: 'Total Requests',    value: 28, color: '#0d7470' },
  { label: 'Pending Review',    value: 6,  color: '#d97706' },
  { label: 'Approved This Week', value: 15, color: '#16a34a' },
  { label: 'Rejected',          value: 7,  color: '#dc2626' },
];

const LEAVE_REQUESTS = [
  { id: 'LV-001', emp: 'Rohan Verma',  dept: 'Engineering', type: 'Sick Leave',  from: '2026-06-28', to: '2026-06-29', days: 2, status: 'pending',  applied: '2026-06-25', reason: 'Fever and cold' },
  { id: 'LV-002', emp: 'Karan Joshi',  dept: 'Sales',       type: 'Casual Leave', from: '2026-07-01', to: '2026-07-01', days: 1, status: 'pending',  applied: '2026-06-24', reason: 'Personal work' },
  { id: 'LV-003', emp: 'Divya Sharma', dept: 'Support',     type: 'Earned Leave', from: '2026-06-15', to: '2026-06-20', days: 4, status: 'approved', applied: '2026-06-10', reason: 'Family vacation' },
  { id: 'LV-004', emp: 'Amit Patel',   dept: 'Finance',     type: 'Sick Leave',  from: '2026-06-12', to: '2026-06-12', days: 1, status: 'rejected', applied: '2026-06-11', reason: 'Doctor appointment' },
];

const EXPENSE_REQUESTS = [
  { id: 'EX-001', emp: 'Ananya Rao',   dept: 'Sales',       category: 'Travel',      amount: 4200, status: 'pending',  applied: '2026-06-24', desc: 'Client visit Mumbai' },
  { id: 'EX-002', emp: 'Priya Singh',  dept: 'HR',          category: 'Training',    amount: 8500, status: 'pending',  applied: '2026-06-23', desc: 'HR Certification course' },
  { id: 'EX-003', emp: 'Vikram Nair',  dept: 'Engineering', category: 'Equipment',   amount: 12000, status: 'approved', applied: '2026-06-18', desc: 'Keyboard and peripherals' },
  { id: 'EX-004', emp: 'Sneha Mehta',  dept: 'Operations',  category: 'Meals',       amount: 1800, status: 'rejected', applied: '2026-06-15', desc: 'Team lunch — exceeded limit' },
];

const CORRECTION_REQUESTS = [
  { id: 'AT-001', emp: 'Rohan Verma',  dept: 'Engineering', date: '2026-06-20', punchIn: '09:42', punchOut: '18:30', reason: 'Forgot to punch in at 9:00', status: 'pending'  },
  { id: 'AT-002', emp: 'Karan Joshi',  dept: 'Sales',       date: '2026-06-19', punchIn: '10:05', punchOut: '19:00', reason: 'System error — biometric not registered', status: 'approved' },
  { id: 'AT-003', emp: 'Divya Sharma', dept: 'Support',     date: '2026-06-18', punchIn: '08:55', punchOut: '18:10', reason: 'WFH — forgot to mark attendance', status: 'rejected' },
];

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fff7ed', color: '#d97706', label: 'Pending' },
  approved: { bg: '#f0fdf4', color: '#16a34a', label: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Rejected' },
};

function ActionButtons({ status }: { status: string }) {
  if (status !== 'pending') return null;
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#0d7470', color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
        <Check size={11} /> Approve
      </button>
      <button style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
        <X size={11} /> Reject
      </button>
    </div>
  );
}

export default function CAApprovalsPage() {
  const [tab, setTab] = useState<ApprovalTab>('pending');
  const [sub, setSub] = useState<SubTab>('leave');

  const filterStatus = (arr: { status: string }[]) =>
    arr.filter((r) => tab === 'pending' ? r.status === 'pending' : tab === 'approved' ? r.status === 'approved' : r.status === 'rejected');

  const leaves      = filterStatus(LEAVE_REQUESTS);
  const expenses    = filterStatus(EXPENSE_REQUESTS);
  const corrections = filterStatus(CORRECTION_REQUESTS);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Approvals</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Review and manage leave, expense, and attendance correction requests.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {STATS.map(({ label, value, color }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#0d4a47' : '#64748b', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', textTransform: 'capitalize' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '0' }}>
        {([
          { key: 'leave', label: `Leave Requests (${filterStatus(LEAVE_REQUESTS).length})` },
          { key: 'expense', label: `Expense Claims (${filterStatus(EXPENSE_REQUESTS).length})` },
          { key: 'correction', label: `Attendance Corrections (${filterStatus(CORRECTION_REQUESTS).length})` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setSub(key)} style={{ padding: '8px 12px', border: 'none', borderBottom: sub === key ? '2px solid #0d7470' : '2px solid transparent', backgroundColor: 'transparent', color: sub === key ? '#0d4a47' : '#64748b', fontSize: '12px', fontWeight: sub === key ? 700 : 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sub === 'leave' && leaves.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No {tab} leave requests.</p>}
        {sub === 'leave' && leaves.map((r: typeof LEAVE_REQUESTS[0]) => {
          const sc = STATUS_PILL[r.status]!;
          return (
            <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0d7470', flexShrink: 0 }}>{r.emp.split(' ').map((w) => w[0]).join('')}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{r.emp}</p>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{r.dept}</span>
                    <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#374151', marginTop: '3px' }}>{r.type} · {r.from} – {r.to} <span style={{ color: '#0d7470', fontWeight: 600 }}>({r.days}d)</span></p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>"{r.reason}"</p>
                </div>
              </div>
              <ActionButtons status={r.status} />
            </div>
          );
        })}

        {sub === 'expense' && expenses.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No {tab} expense requests.</p>}
        {sub === 'expense' && expenses.map((r: typeof EXPENSE_REQUESTS[0]) => {
          const sc = STATUS_PILL[r.status]!;
          return (
            <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0d7470', flexShrink: 0 }}>{r.emp.split(' ').map((w) => w[0]).join('')}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{r.emp}</p>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{r.dept}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: '#eff6ff', color: '#2563eb' }}>{r.category}</span>
                    <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#0d7470', fontWeight: 700, marginTop: '3px' }}>₹{r.amount.toLocaleString('en-IN')}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '1px', fontStyle: 'italic' }}>"{r.desc}"</p>
                </div>
              </div>
              <ActionButtons status={r.status} />
            </div>
          );
        })}

        {sub === 'correction' && corrections.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No {tab} correction requests.</p>}
        {sub === 'correction' && corrections.map((r: typeof CORRECTION_REQUESTS[0]) => {
          const sc = STATUS_PILL[r.status]!;
          return (
            <div key={r.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0d7470', flexShrink: 0 }}>{r.emp.split(' ').map((w) => w[0]).join('')}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{r.emp}</p>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{r.dept}</span>
                    <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#374151', marginTop: '3px' }}>{r.date} · Punch In: {r.punchIn} — Punch Out: {r.punchOut}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>"{r.reason}"</p>
                </div>
              </div>
              <ActionButtons status={r.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
