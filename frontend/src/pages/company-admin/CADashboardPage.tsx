import { useNavigate } from 'react-router-dom';
import { Download, Shield, FileText, BarChart2 } from 'lucide-react';

const STATS = [
  { label: 'Late Arrivals',     value: 12,  color: '#0d7470', bg: '#f0fdfa', sub: '↑ 3 from yesterday' },
  { label: 'Present Today',     value: 974, color: '#2563eb', bg: '#eff6ff', sub: '76% of total' },
  { label: 'Absent Today',      value: 42,  color: '#ea580c', bg: '#fff7ed', sub: '3.4% absent' },
  { label: 'Pending Approvals', value: 6,   color: '#0d7470', bg: '#f0fdfa', sub: 'Requires action' },
];

const SHIFTS = [
  { name: 'Morning Shift', time: '06:00 - 14:00', present: 252, total: 300 },
  { name: 'Afternoon Shift', time: '14:00 - 22:00', present: 220, total: 280 },
  { name: 'Night Shift', time: '22:00 - 06:00', present: 180, total: 220 },
];

const WORKFORCE = [
  { label: 'Present (Perm)',     value: 689, color: '#0d7470' },
  { label: 'Present (Contract)', value: 270, color: '#60a5fa' },
  { label: 'Absent',            value: 23,  color: '#fca5a5' },
];
const TOTAL_HC = 982;

function DonutChart() {
  const total = WORKFORCE.reduce((s, w) => s + w.value, 0);
  const cx = 60; const cy = 60; const r = 48; const innerR = 28;
  let cumPct = 0;
  const slices = WORKFORCE.map((w) => {
    const startAngle = cumPct / total * 2 * Math.PI - Math.PI / 2;
    cumPct += w.value;
    const endAngle = cumPct / total * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);   const y2 = cy + r * Math.sin(endAngle);
    const x3 = cx + innerR * Math.cos(endAngle);   const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle); const y4 = cy + innerR * Math.sin(startAngle);
    const large = w.value / total > 0.5 ? 1 : 0;
    return { ...w, d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z` };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg viewBox="0 0 120 120" style={{ width: '110px', flexShrink: 0 }}>
        {slices.map((s) => <path key={s.label} d={s.d} fill={s.color} />)}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0f172a">{TOTAL_HC}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fill="#94a3b8">Total Headcount</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {WORKFORCE.map((w) => (
          <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: w.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#374151' }}>{w.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginLeft: 'auto', paddingLeft: '12px' }}>{w.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CADashboardPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Overview of today's attendance and workforce status.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {STATS.map(({ label, value, color, bg, sub }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: color, opacity: 0.7 }} />
            </div>
            <p style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</p>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Attendance by Shift */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Attendance by Shift</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[{ label: '● Present', color: '#0d7470' }, { label: '● Absent', color: '#fca5a5' }].map(({ label, color }) => (
                <span key={label} style={{ fontSize: '10px', color, fontWeight: 600 }}>{label}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SHIFTS.map((s) => {
              const pct = Math.round((s.present / s.total) * 100);
              return (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{s.present}/{s.total}</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#fca5a520', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#0d7470', borderRadius: '5px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workforce Composition */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Workforce Composition</h3>
            <button onClick={() => navigate('/company-admin/workforce')} style={{ fontSize: '11px', color: '#0d7470', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View Detail</button>
          </div>
          <DonutChart />
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>QUICK ACTIONS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { label: 'Download Payroll',   icon: Download,  path: '/company-admin/payroll' },
            { label: 'Manage Roles',       icon: Shield,    path: '/company-admin/settings/roles' },
            { label: 'Download Summary',   icon: FileText,  path: '/company-admin/reports' },
            { label: 'View Reports',       icon: BarChart2, path: '/company-admin/reports' },
          ].map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#0d7470'; el.style.backgroundColor = '#f0fdfa'; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e2e8f0'; el.style.backgroundColor = 'white'; }}>
              <Icon size={18} color="#0d7470" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
