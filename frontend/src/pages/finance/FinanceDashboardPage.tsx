import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, Receipt, DollarSign } from 'lucide-react';

const STATS = [
  { label: 'Present Today',  value: '1,280', sub: 'Last month', trend: '+12.4%', up: true,  icon: UserCheck, iconBg: '#f0fdf4', iconColor: '#16a34a' },
  { label: 'Absent Today',   value: '9',     sub: 'Last month', trend: '-6.4%',  up: false, icon: UserX,     iconBg: '#fef2f2', iconColor: '#dc2626' },
  { label: 'Total Expenses', value: '42',    sub: 'Last month', trend: '+0.8%',  up: false, icon: Receipt,   iconBg: '#fff7ed', iconColor: '#ea580c' },
  { label: 'Payroll Cost',   value: '35',    sub: 'Last month', trend: '+5.4%',  up: true,  icon: DollarSign,iconBg: '#eff6ff', iconColor: '#2563eb' },
];

const RECENT_TXN = [
  { label: 'Employee Payroll – June 2026', amount: '₹3,24,500', type: 'Payroll',     status: 'Processed', color: '#16a34a', bg: '#f0fdf4' },
  { label: 'Travel Expense – Alex Turner', amount: '₹4,000',    type: 'Expense',     status: 'Approved',  color: '#16a34a', bg: '#f0fdf4' },
  { label: 'Materials – Assembly Line',   amount: '₹18,500',   type: 'Expense',     status: 'Pending',   color: '#ea580c', bg: '#fff7ed' },
  { label: 'Contractor Payroll – June',   amount: '₹58,000',   type: 'Payroll',     status: 'Processed', color: '#16a34a', bg: '#f0fdf4' },
  { label: 'Utilities – Plant Q2',        amount: '₹9,200',    type: 'Expense',     status: 'Rejected',  color: '#dc2626', bg: '#fef2f2' },
];

// Simple horizontal bar chart
const EXPENSE_BARS = [
  { label: 'Payroll',      value: 1400000, color: '#0d7470' },
  { label: 'Materials',    value: 680000,  color: '#0d7470' },
  { label: 'Utilities',    value: 120000,  color: '#0d7470' },
  { label: 'Maintenance',  value: 80000,   color: '#0d7470' },
  { label: 'Others',       value: 40000,   color: '#0d7470' },
];

// Simple payroll trend line
const PAYROLL_TREND = [130000, 128000, 135000, 132000, 138000, 136000, 140000];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

function HBarChart() {
  const max = Math.max(...EXPENSE_BARS.map((b) => b.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {EXPENSE_BARS.map((b) => {
        const pct = (b.value / max) * 100;
        return (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', width: '72px', flexShrink: 0, textAlign: 'right' }}>{b.label}</span>
            <div style={{ flex: 1, height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: b.color, borderRadius: '4px' }} />
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', width: '60px' }}>{(b.value / 1000).toFixed(0)}k</span>
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingLeft: '82px' }}>
        {['0', '35000', '70000', '140000'].map((v) => (
          <span key={v} style={{ fontSize: '9px', color: '#94a3b8' }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

function TrendLine() {
  const max = Math.max(...PAYROLL_TREND);
  const min = Math.min(...PAYROLL_TREND);
  const w = 240; const h = 100;
  const pts = PAYROLL_TREND.map((v, i) => `${(i / (PAYROLL_TREND.length - 1)) * w},${h - ((v - min) / (max - min)) * (h - 10) - 5}`).join(' ');
  const yticks = [70000, 105000, 140000];
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: '0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '16px', paddingRight: '6px', alignItems: 'flex-end' }}>
          {yticks.reverse().map((v) => <span key={v} style={{ fontSize: '9px', color: '#94a3b8' }}>{(v / 1000).toFixed(0)}k</span>)}
        </div>
        <div style={{ flex: 1 }}>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '90px' }}>
            <polyline fill="none" stroke="#0d7470" strokeWidth="2" strokeLinejoin="round" points={pts} />
            {PAYROLL_TREND.map((v, i) => (
              <circle key={i} cx={(i / (PAYROLL_TREND.length - 1)) * w} cy={h - ((v - min) / (max - min)) * (h - 10) - 5} r="3.5" fill="#0d7470" />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {MONTHS.map((m) => <span key={m} style={{ fontSize: '10px', color: '#94a3b8' }}>{m}</span>)}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: '#0d7470', fontWeight: 600 }}>← payroll</span>
      </div>
    </div>
  );
}

export default function FinanceDashboardPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Overview of today's attendance and workforce status</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {STATS.map(({ label, value, sub, trend, up, icon: Icon, iconBg, iconColor }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={iconColor} />
              </div>
            </div>
            <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sub}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: up ? '#16a34a' : '#dc2626' }}>{up ? '↑' : '↓'} {trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Expense Breakdown</h3>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>Current month distribution</p>
          <HBarChart />
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Payroll Trend</h3>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>Monthly payroll expenses</p>
          <TrendLine />
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Recent Transactions</h3>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Latest financial activities</p>
          </div>
          <button onClick={() => navigate('/finance/expenses')} style={{ fontSize: '12px', color: '#0d7470', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
        </div>
        <div>
          {RECENT_TXN.map((t, i) => (
            <div key={i} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < RECENT_TXN.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {t.type === 'Payroll' ? <DollarSign size={14} color={t.color} /> : <Receipt size={14} color={t.color} />}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{t.label}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{t.type}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{t.amount}</p>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: t.bg, color: t.color }}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
