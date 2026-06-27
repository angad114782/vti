import { useState } from 'react';
import { Download, Search } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_MONTH = 5; // June (0-indexed)
const CURRENT_YEAR = 2026;

const SUMMARY_CARDS = [
  { label: 'Total Payroll',    value: '₹42,80,500', sub: 'This month',   color: '#0d7470' },
  { label: 'Net Disbursed',   value: '₹38,94,200', sub: 'After deductions', color: '#2563eb' },
  { label: 'PF Contribution', value: '₹3,86,300',  sub: 'Employee + Employer', color: '#6366f1' },
  { label: 'TDS Deducted',    value: '₹1,92,100',  sub: 'Tax at source',  color: '#ea580c' },
];

const PAYROLL_ROWS = [
  { id: 'EMP-001', name: 'Rohan Verma',  dept: 'Engineering', gross: 95000, pf: 11400, tds: 8200, net: 75400, status: 'Processed' },
  { id: 'EMP-002', name: 'Priya Singh',  dept: 'HR',          gross: 80000, pf: 9600,  tds: 6800, net: 63600, status: 'Processed' },
  { id: 'EMP-003', name: 'Amit Patel',   dept: 'Finance',     gross: 75000, pf: 9000,  tds: 5800, net: 60200, status: 'Processed' },
  { id: 'EMP-004', name: 'Sneha Mehta',  dept: 'Operations',  gross: 65000, pf: 7800,  tds: 4200, net: 53000, status: 'Pending' },
  { id: 'EMP-005', name: 'Karan Joshi',  dept: 'Sales',       gross: 58000, pf: 6960,  tds: 3600, net: 47440, status: 'Pending' },
  { id: 'EMP-006', name: 'Divya Sharma', dept: 'Support',     gross: 52000, pf: 6240,  tds: 3000, net: 42760, status: 'Processed' },
  { id: 'EMP-007', name: 'Vikram Nair',  dept: 'Engineering', gross: 48000, pf: 5760,  tds: 2400, net: 39840, status: 'Held' },
  { id: 'EMP-008', name: 'Ananya Rao',   dept: 'Sales',       gross: 88000, pf: 10560, tds: 7400, net: 70040, status: 'Processed' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Processed: { bg: '#f0fdf4', color: '#16a34a' },
  Pending:   { bg: '#fff7ed', color: '#d97706' },
  Held:      { bg: '#fef2f2', color: '#dc2626' },
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CAPayrollPage() {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = PAYROLL_ROWS.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.dept.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const processed = PAYROLL_ROWS.filter((r) => r.status === 'Processed').length;
  const pending   = PAYROLL_ROWS.filter((r) => r.status === 'Pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Payroll</h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Process and manage monthly payroll for all employees.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: 'white' }}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m} {CURRENT_YEAR}</option>)}
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Download size={13} /> Export Payroll
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {SUMMARY_CARDS.map(({ label, value, sub, color }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</p>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Payroll Progress — {MONTHS[month]} {CURRENT_YEAR}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>✓ Processed: {processed}</span>
            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>◷ Pending: {pending}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Total: {PAYROLL_ROWS.length}</span>
          </div>
        </div>
        <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${(processed / PAYROLL_ROWS.length) * 100}%`, height: '100%', backgroundColor: '#0d7470', borderRadius: '5px' }} />
        </div>
        <p style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>{Math.round((processed / PAYROLL_ROWS.length) * 100)}% payroll processed for this cycle</p>
      </div>

      {/* Table controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Processed', 'Pending', 'Held'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: '20px', border: `1px solid ${statusFilter === s ? '#0d7470' : '#e2e8f0'}`, backgroundColor: statusFilter === s ? '#0d7470' : 'white', color: statusFilter === s ? 'white' : '#374151', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" style={{ paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', width: '180px' }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['Employee', 'Department', 'Gross Salary', 'PF', 'TDS', 'Net Pay', 'Status', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const sc = STATUS_COLORS[r.status]!;
              return (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{r.name}</p>
                    <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{r.id}</p>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{r.dept}</td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{fmt(r.gross)}</td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#6366f1', borderBottom: '1px solid #f1f5f9' }}>{fmt(r.pf)}</td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#ea580c', borderBottom: '1px solid #f1f5f9' }}>{fmt(r.tds)}</td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: '#0d7470', borderBottom: '1px solid #f1f5f9' }}>{fmt(r.net)}</td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: sc.bg, color: sc.color }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d7470', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Download size={12} /><span style={{ fontSize: '11px', fontWeight: 600 }}>Slip</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
