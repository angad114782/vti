import { useState } from 'react';
import { Search, Eye, Download } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS  = ['2024','2025','2026'];
const DEPTS  = ['All Departments','Engineering','Operations','HR','Finance','Sales','Support'];
const TYPES  = ['All Employees','Permanent Staff','Contract Workers'];

const PAYSLIPS = [
  { id: 'PS-FEB26-001', name: 'Ankita Yadav',  dept: 'Engineering', period: 'Feb 2026', gross: 95000,  deductions: 19600, net: 75400, status: 'Paid'       },
  { id: 'PS-FEB26-002', name: 'Rohan Verma',   dept: 'Engineering', period: 'Feb 2026', gross: 88000,  deductions: 18400, net: 69600, status: 'Processing'  },
  { id: 'PS-FEB26-003', name: 'Priya Singh',   dept: 'HR',          period: 'Feb 2026', gross: 80000,  deductions: 16400, net: 63600, status: 'Paid'        },
  { id: 'PS-FEB26-004', name: 'Amit Patel',    dept: 'Finance',     period: 'Feb 2026', gross: 75000,  deductions: 14800, net: 60200, status: 'Paid'        },
  { id: 'PS-FEB26-005', name: 'Sneha Mehta',   dept: 'Operations',  period: 'Feb 2026', gross: 65000,  deductions: 13000, net: 52000, status: 'Processing'  },
  { id: 'PS-FEB26-006', name: 'Karan Joshi',   dept: 'Sales',       period: 'Feb 2026', gross: 58000,  deductions: 11040, net: 46960, status: 'Paid'        },
  { id: 'PS-FEB26-007', name: 'Divya Sharma',  dept: 'Support',     period: 'Feb 2026', gross: 52000,  deductions: 9240,  net: 42760, status: 'Paid'        },
  { id: 'PS-FEB26-008', name: 'Ananya Rao',    dept: 'Sales',       period: 'Feb 2026', gross: 88000,  deductions: 17960, net: 70040, status: 'Paid'        },
  { id: 'PS-FEB26-009', name: 'Vikram Nair',   dept: 'Engineering', period: 'Feb 2026', gross: 48000,  deductions: 8160,  net: 39840, status: 'On Hold'     },
  { id: 'PS-FEB26-010', name: 'Alex Johnson',  dept: 'Operations',  period: 'Feb 2026', gross: 45000,  deductions: 7960,  net: 37040, status: 'Paid'        },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Paid:       { bg: '#dcfce7', color: '#15803d', border: 'none' },
  Processing: { bg: '#fed7aa', color: '#c2410c', border: 'none' },
  'On Hold':  { bg: '#fef9c3', color: '#a16207', border: 'none' },
};

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CAPayslipsPage() {
  const [search, setSearch] = useState('');
  const [month,  setMonth]  = useState('February');
  const [year,   setYear]   = useState('2026');
  const [dept,   setDept]   = useState('All Departments');
  const [type,   setType]   = useState('All Employees');

  const filtered = PAYSLIPS.filter((p) =>
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.id.toLowerCase().includes(search.toLowerCase())) &&
    (dept === 'All Departments' || p.dept === dept)
  );

  const selectStyle: React.CSSProperties = {
    padding: '8px 28px 8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151',
    backgroundColor: 'white', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Payslip History</h1>
            <span style={{ padding: '2px 10px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>{filtered.length} Records</span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>View and download payslips for all employees.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <Download size={13} /> Bulk Download
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
            style={{ paddingLeft: '30px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', width: '200px' }}
          />
        </div>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
          {MONTHS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)} style={selectStyle}>
          {DEPTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['PAYSLIP ID', 'EMPLOYEE', 'PERIOD', 'GROSS', 'DEDUCTIONS', 'NET PAY', 'STATUS', 'ACTIONS'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const sc = STATUS_STYLE[p.status] ?? STATUS_STYLE['Paid']!;
              return (
                <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '11px 14px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9' }}>{p.id}</td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#0d7470', flexShrink: 0 }}>
                        {p.name.split(' ').map((w) => w[0]).join('')}
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{p.name}</p>
                        <p style={{ fontSize: '10px', color: '#94a3b8' }}>{p.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{p.period}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#374151', fontWeight: 500, borderBottom: '1px solid #f1f5f9' }}>{fmt(p.gross)}</td>
                  <td style={{ padding: '11px 14px', fontSize: '12px', color: '#dc2626', borderBottom: '1px solid #f1f5f9' }}>-{fmt(p.deductions)}</td>
                  <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 700, color: '#0d7470', borderBottom: '1px solid #f1f5f9' }}>{fmt(p.net)}</td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, backgroundColor: sc.bg, color: sc.color }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d7470' }}><Eye size={15} /></button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Download size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>QUICK ACTIONS</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Download Payroll'].map((label) => (
            <button key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid #0d7470' }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
