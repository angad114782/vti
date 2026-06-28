import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Shield, FileText, BarChart2, Play } from 'lucide-react';

const MONTHS_LIST = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS       = ['2024','2025','2026'];
const TYPES       = ['All Employees','Permanent Staff','Contract Workers'];
const DEPTS_FILTER = ['All Departments','Engineering','Operations','HR','Finance','Sales','Support'];

/* ── Stat card data ──────────────────────────── */
const STATS = [
  {
    label: 'TOTAL PAYROLL COST',
    value: '₹4,85,250',
    sub: '+3.2% vs last month',
    subColor: '#16a34a',
    iconBg: '#eff6ff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    label: 'NET SALARY PAYABLE',
    value: '₹4,12,450',
    sub: 'Disbursement Pending',
    subColor: '#d97706',
    iconBg: '#f0fdfa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d7470" strokeWidth="2.5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'TOTAL DEDUCTIONS',
    value: '₹72,800',
    sub: 'PF, Tax, Insurance',
    subColor: '#64748b',
    iconBg: '#fef2f2',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    label: 'OVERTIME PAYOUT',
    value: '₹14,200',
    sub: '1,240 hrs logged',
    subColor: '#64748b',
    iconBg: '#fffbeb',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

/* ── Chart data ──────────────────────────────── */
const CHART_RANGE_OPTIONS = ['Last 3 months','Last 6 months','Last 12 months'];
const CHART_MONTHS   = ['Aug','Sep','Oct','Nov','Dec','Jan'];
const BASE_SALARY    = [455000,458000,460000,462000,470000,485000];
const OVERTIME_DATA  = [8000,9500,7200,11000,13000,14200];

function DualLineChart({ range }: { range: string }) {
  const n = range === 'Last 3 months' ? 3 : range === 'Last 12 months' ? 6 : 6;
  const months = CHART_MONTHS.slice(-n);
  const base   = BASE_SALARY.slice(-n);
  const ot     = OVERTIME_DATA.slice(-n);

  const W = 620; const H = 170; const PL = 52; const PR = 16; const PT = 14; const PB = 28;
  const cW = W - PL - PR; const cH = H - PT - PB;
  const yMin = 0; const yMax = 600000;
  const yTicks = [0,150000,300000,450000,600000];

  const tx = (i: number) => PL + (i / (months.length - 1)) * cW;
  const ty = (v: number) => PT + cH - ((v - yMin) / (yMax - yMin)) * cH;
  const fmtY = (v: number) => v === 0 ? '₹0k' : `₹${v/1000}k`;

  const bPts = base.map((v,i) => `${tx(i)},${ty(v)}`).join(' ');
  const oPts = ot.map((v,i) => `${tx(i)},${ty(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%' }}>
      {/* dashed gridlines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PL} y1={ty(t)} x2={W-PR} y2={ty(t)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3"/>
          <text x={PL-6} y={ty(t)+4} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtY(t)}</text>
        </g>
      ))}
      {/* Base Salary line + dots */}
      <polyline points={bPts} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round"/>
      {base.map((v,i) => <circle key={i} cx={tx(i)} cy={ty(v)} r="4.5" fill="white" stroke="#2563eb" strokeWidth="2.5"/>)}
      {/* Overtime line + dots */}
      <polyline points={oPts} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
      {ot.map((v,i) => <circle key={i} cx={tx(i)} cy={ty(v)} r="4.5" fill="white" stroke="#f59e0b" strokeWidth="2.5"/>)}
      {/* X labels */}
      {months.map((m,i) => (
        <text key={m} x={tx(i)} y={H-4} textAnchor="middle" fontSize="9" fill="#94a3b8">{m}</text>
      ))}
    </svg>
  );
}

/* ── Department payroll data ─────────────────── */
const DEPT_PAYROLL = [
  { dept: 'Engineering', amount: 180000, pct: 37 },
  { dept: 'Operations',  amount: 120000, pct: 25 },
  { dept: 'Sales',       amount: 85000,  pct: 18 },
  { dept: 'Support',     amount: 48000,  pct: 10 },
  { dept: 'Finance',     amount: 32000,  pct: 7  },
  { dept: 'HR',          amount: 20250,  pct: 4  },
];

/* ── Processing status ───────────────────────── */
const PROC_STATUS = [
  { label: 'Processed',  count: 847, color: '#0d7470', bg: '#f0fdfa' },
  { label: 'Pending',    count: 98,  color: '#d97706', bg: '#fffbeb' },
  { label: 'On Hold',    count: 12,  color: '#dc2626', bg: '#fef2f2' },
  { label: 'Failed',     count: 5,   color: '#64748b', bg: '#f1f5f9' },
];
const TOTAL_EMP = 962;

/* ── Quick Actions ───────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Run Payroll',      Icon: Play,      path: '/company-admin/payroll/run'      },
  { label: 'Download Payroll', Icon: Download,  path: '/company-admin/payroll/reports'  },
  { label: 'Manage Roles',     Icon: Shield,    path: '/company-admin/settings/roles'   },
  { label: 'Download Summary', Icon: FileText,  path: '/company-admin/payroll/reports'  },
  { label: 'View Reports',     Icon: BarChart2, path: '/company-admin/payroll/reports'  },
];

export default function CAPayrollOverviewPage() {
  const navigate = useNavigate();
  const [period,  setPeriod]  = useState('February');
  const [year,    setYear]    = useState('2026');
  const [type,    setType]    = useState('All Employees');
  const [dept,    setDept]    = useState('All Departments');
  const [range,   setRange]   = useState('Last 6 months');

  const sel: React.CSSProperties = {
    padding: '7px 26px 7px 10px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151',
    backgroundColor: 'white', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center', cursor: 'pointer',
  };

  const processed = PROC_STATUS.find((s) => s.label === 'Processed')!.count;
  const procPct   = Math.round((processed / TOTAL_EMP) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Payroll Management</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Manage salaries, payslips, and compliance</p>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Period:</span>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={sel}>
          {MONTHS_LIST.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={sel}>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </select>
        <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }} />
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Type:</span>
        <select value={type} onChange={(e) => setType(e.target.value)} style={sel}>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Dept:</span>
        <select value={dept} onChange={(e) => setDept(e.target.value)} style={sel}>
          {DEPTS_FILTER.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {STATS.map(({ label, value, sub, subColor, iconBg, icon }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', lineHeight: 1.4 }}>{label}</p>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
              </div>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '10px', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', color: subColor, marginTop: '7px', fontWeight: 500 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Payroll Cost Trend ── */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Payroll Cost Trend</h3>
          <select value={range} onChange={(e) => setRange(e.target.value)} style={{ ...sel, fontSize: '11px', padding: '5px 22px 5px 8px' }}>
            {CHART_RANGE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <DualLineChart range={range} />
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
          {[
            { label: 'Base Salary', color: '#2563eb' },
            { label: 'Overtime',    color: '#f59e0b' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="10" viewBox="0 0 18 10">
                <line x1="0" y1="5" x2="18" y2="5" stroke={color} strokeWidth="2"/>
                <circle cx="9" cy="5" r="3.5" fill="white" stroke={color} strokeWidth="2"/>
              </svg>
              <span style={{ fontSize: '11px', color, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dept Payroll + Processing Status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Department-wise Payroll */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Department-wise Payroll</h3>
            <span style={{ fontSize: '11px', color: '#0d7470', fontWeight: 600 }}>{period} {year}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEPT_PAYROLL.map(({ dept: d, amount, pct }) => (
              <div key={d}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{d}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>₹{amount.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#0d7470', minWidth: '28px', textAlign: 'right' }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: '7px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#0d7470', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Total Payroll</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>₹4,85,250</span>
          </div>
        </div>

        {/* Payroll Processing Status */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Processing Status</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{TOTAL_EMP} employees</span>
          </div>

          {/* Circular progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '14px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
              <svg viewBox="0 0 80 80" style={{ width: '80px', height: '80px', transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="#0d7470" strokeWidth="10"
                  strokeDasharray={`${(procPct / 100) * 201} 201`} strokeLinecap="round"/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{procPct}%</span>
                <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 600 }}>Done</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>
                <strong style={{ color: '#0d7470' }}>{processed}</strong> of {TOTAL_EMP} employee payslips processed for {period} {year}.
              </p>
              <p style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 500 }}>
                {PROC_STATUS.find((s) => s.label === 'Pending')!.count} still pending action
              </p>
            </div>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {PROC_STATUS.map(({ label, count, color }) => {
              const pct = Math.round((count / TOTAL_EMP) * 100);
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '76px', fontSize: '11px', color: '#374151', fontWeight: 500 }}>{label}</span>
                  <div style={{ flex: 1, height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '3px' }} />
                  </div>
                  <span style={{ width: '32px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>QUICK ACTIONS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px' }}>
          {QUICK_ACTIONS.map(({ label, Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#0d7470'; (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdfa'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '13px 8px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color="#0d7470" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
