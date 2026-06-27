import { useState } from 'react';

type Tab = 'Payroll Report' | 'Expense Report' | 'Cost Analysis';
const TABS: Tab[] = ['Payroll Report', 'Expense Report', 'Cost Analysis'];

// ── data ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const SALARY_BARS = [
  { dept: 'Engineering', value: 580000, color: '#0d7470' },
  { dept: 'Sales',       value: 420000, color: '#3b82f6' },
  { dept: 'Production',  value: 680000, color: '#8b5cf6' },
  { dept: 'Finance',     value: 220000, color: '#f59e0b' },
  { dept: 'HR',          value: 180000, color: '#ec4899' },
  { dept: 'Logistics',   value: 320000, color: '#10b981' },
];

const EXPENSE_PIE = [
  { label: 'Travel',      pct: 35, color: '#0d7470' },
  { label: 'Materials',   pct: 28, color: '#3b82f6' },
  { label: 'Utilities',   pct: 18, color: '#f59e0b' },
  { label: 'Maintenance', pct: 12, color: '#8b5cf6' },
  { label: 'Others',      pct: 7,  color: '#94a3b8' },
];

const TREND_LINES = {
  Payroll:  [980000, 1020000, 990000, 1040000, 1080000, 1050000],
  Expenses: [120000, 140000,  130000, 160000,  145000,  155000],
  Overhead: [80000,  85000,   82000,  88000,   90000,   87000],
};

// ── charts ──
function PayrollBarChart() {
  const max = Math.max(...SALARY_BARS.map((b) => b.value));
  const W = 360; const H = 160; const pad = 40;
  const bW = 28; const gap = (W - pad - SALARY_BARS.length * bW) / (SALARY_BARS.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: '100%', maxHeight: '220px' }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={pad} y1={H - f * H} x2={W} y2={H - f * H} stroke="#f1f5f9" strokeWidth="1" />
          <text x={pad - 4} y={H - f * H + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{(f * max / 1000).toFixed(0)}k</text>
        </g>
      ))}
      {SALARY_BARS.map((b, i) => {
        const x = pad + i * (bW + gap);
        const bH = (b.value / max) * H;
        return (
          <g key={b.dept}>
            <rect x={x} y={H - bH} width={bW} height={bH} rx="3" fill={b.color} opacity={0.85} />
            <text x={x + bW / 2} y={H + 12} textAnchor="middle" fontSize="7.5" fill="#64748b">{b.dept}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ExpensePieChart() {
  let cumPct = 0;
  const slices: { d: string; color: string; label: string; pct: number }[] = [];
  const cx = 80; const cy = 80; const r = 64; const innerR = 38;
  EXPENSE_PIE.forEach((seg) => {
    const start = cumPct / 100 * 2 * Math.PI - Math.PI / 2;
    cumPct += seg.pct;
    const end = cumPct / 100 * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start); const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);   const y2 = cy + r * Math.sin(end);
    const x3 = cx + innerR * Math.cos(end);   const y3 = cy + innerR * Math.sin(end);
    const x4 = cx + innerR * Math.cos(start); const y4 = cy + innerR * Math.sin(start);
    const large = seg.pct > 50 ? 1 : 0;
    slices.push({ color: seg.color, label: seg.label, pct: seg.pct, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z` });
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
      <svg viewBox="0 0 160 160" style={{ width: '160px', flexShrink: 0 }}>
        {slices.map((s) => <path key={s.label} d={s.d} fill={s.color} />)}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="bold">Expenses</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#94a3b8">by category</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {EXPENSE_PIE.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#374151' }}>{s.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginLeft: 'auto' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiLineChart() {
  const W = 320; const H = 120;
  const allVals = Object.values(TREND_LINES).flat();
  const max = Math.max(...allVals); const min = Math.min(...allVals);
  const colors: Record<string, string> = { Payroll: '#0d7470', Expenses: '#3b82f6', Overhead: '#f59e0b' };
  const pt = (val: number, i: number) => `${(i / (MONTHS.length - 1)) * W},${H - ((val - min) / (max - min)) * (H - 14) - 7}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', maxHeight: '160px' }}>
        {Object.entries(TREND_LINES).map(([key, vals]) => (
          <polyline key={key} fill="none" stroke={colors[key]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={vals.map((v, i) => pt(v, i)).join(' ')} />
        ))}
        {MONTHS.map((m, i) => (
          <text key={m} x={(i / (MONTHS.length - 1)) * W} y={H + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">{m}</text>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        {Object.entries(colors).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '18px', height: '2px', backgroundColor: color, borderRadius: '1px' }} />
            <span style={{ fontSize: '11px', color: '#64748b' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DateRangeBar() {
  const [active, setActive] = useState('6M');
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {['1M', '3M', '6M', '1Y', 'All'].map((r) => (
        <button key={r} onClick={() => setActive(r)} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: active === r ? '#0d7470' : '#f1f5f9', color: active === r ? 'white' : '#64748b', transition: 'all 0.15s' }}>{r}</button>
      ))}
    </div>
  );
}

function SummaryRow({ items }: { items: { label: string; value: string; trend?: string; up?: boolean }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '12px', marginBottom: '20px' }}>
      {items.map(({ label, value, trend, up }) => (
        <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px 14px' }}>
          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{label}</p>
          <p style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{value}</p>
          {trend && <p style={{ fontSize: '10px', fontWeight: 700, color: up ? '#16a34a' : '#dc2626', marginTop: '2px' }}>{up ? '↑' : '↓'} {trend}</p>}
        </div>
      ))}
    </div>
  );
}

export default function FinanceReportsPage() {
  const [tab, setTab] = useState<Tab>('Payroll Report');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Reports</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Financial summaries and analytics across payroll, expenses, and costs</p>
        </div>
        <button style={{ padding: '8px 16px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Export Report</button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ padding: '4px', display: 'flex', gap: '2px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? '#0d7470' : 'transparent', color: tab === t ? 'white' : '#64748b', transition: 'all 0.15s' }}>{t}</button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {tab === 'Payroll Report' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Salary Distribution by Department</h3>
                <DateRangeBar />
              </div>
              <SummaryRow items={[
                { label: 'Total Payroll', value: '₹24.2L', trend: '4.2%', up: true },
                { label: 'Avg Salary',    value: '₹58,400', trend: '1.8%', up: true },
                { label: 'Employees',     value: '414', trend: '2 new', up: true },
                { label: 'Pending',       value: '12', trend: '3 less', up: false },
              ]} />
              <PayrollBarChart />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {SALARY_BARS.map((b) => (
                  <div key={b.dept} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: b.color }} />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{b.dept}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'Expense Report' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Expense Breakdown by Category</h3>
                <DateRangeBar />
              </div>
              <SummaryRow items={[
                { label: 'Total Expenses', value: '₹6.82L', trend: '8.5%', up: false },
                { label: 'Approved',        value: '₹5.40L', trend: '6.2%', up: false },
                { label: 'Pending',         value: '₹1.22L', trend: '2.1%', up: true },
                { label: 'Rejected',        value: '₹0.20L', trend: '0.4%', up: true },
              ]} />
              <ExpensePieChart />
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {EXPENSE_PIE.map((s) => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', width: '80px' }}>{s.label}</span>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${s.pct}%`, height: '100%', backgroundColor: s.color, borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', width: '30px', textAlign: 'right' }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'Cost Analysis' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Cost Trend Analysis</h3>
                <DateRangeBar />
              </div>
              <SummaryRow items={[
                { label: 'Total Cost',     value: '₹32.6L', trend: '3.9%', up: false },
                { label: 'Payroll Share',  value: '81.2%',  trend: '1.1%', up: false },
                { label: 'Expense Share',  value: '13.4%',  trend: '0.6%', up: true },
                { label: 'Overhead Share', value: '5.4%',   trend: '0.3%', up: true },
              ]} />
              <MultiLineChart />
              <div style={{ marginTop: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '14px 16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Month-over-Month Comparison (Jun vs May 2026)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Payroll',   may: '₹10.8L', jun: '₹10.5L', change: '-2.8%', up: false },
                    { label: 'Expenses',  may: '₹1.45L',  jun: '₹1.55L',  change: '+6.9%',  up: false },
                    { label: 'Overhead',  may: '₹0.90L',  jun: '₹0.87L',  change: '-3.3%', up: true },
                  ].map((r) => (
                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#374151' }}>
                      <span style={{ width: '80px' }}>{r.label}</span>
                      <span style={{ width: '70px', color: '#64748b' }}>May: {r.may}</span>
                      <span style={{ width: '70px', color: '#64748b' }}>Jun: {r.jun}</span>
                      <span style={{ fontWeight: 700, color: r.up ? '#16a34a' : '#dc2626' }}>{r.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
