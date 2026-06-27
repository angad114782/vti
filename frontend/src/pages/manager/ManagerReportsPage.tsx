import { useState } from 'react';
import { Download, Filter } from 'lucide-react';

type ReportTab = 'Attendance Report' | 'Workforce Report' | 'Productivity Report';
const REPORT_TABS: ReportTab[] = ['Attendance Report', 'Workforce Report', 'Productivity Report'];
const DATE_BTNS = ['Today', 'Last 7 Days', 'This Month'];

// Simple SVG line chart
function LineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 560; const h = 120;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 10)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '120px' }}>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" points={pts} />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - (v / max) * (h - 10)} r="4" fill={color} />
      ))}
    </svg>
  );
}

// Simple bar chart
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '100px' }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '100%', height: `${(d.value / max) * 80}px`, borderRadius: '4px 4px 0 0', backgroundColor: d.color }} />
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Simple donut chart
function DonutChart() {
  const segments = [
    { label: 'Permanent', value: 65, color: '#0d7470' },
    { label: 'Contract',  value: 25, color: '#3b82f6' },
    { label: 'Others',    value: 10, color: '#f59e0b' },
  ];
  const r = 50; const cx = 70; const cy = 70;
  let start = -Math.PI / 2;
  const arcs = segments.map((s) => {
    const angle = (s.value / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(start); const y1 = cy + r * Math.sin(start);
    start += angle;
    const x2 = cx + r * Math.cos(start); const y2 = cy + r * Math.sin(start);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: s.color, label: s.label, value: s.value };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg viewBox="0 0 140 140" style={{ width: '120px', height: '120px', flexShrink: 0 }}>
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
        <circle cx={cx} cy={cy} r={32} fill="white" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {arcs.map((a) => (
          <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: a.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#374151' }}>{a.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{a.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ATTENDANCE_TREND = [85, 92, 78, 88, 95, 82, 90];
const HOURS_TREND = [8.2, 8.5, 7.9, 9.1, 8.8, 8.3, 8.7];
const DEPT_DATA = [
  { label: 'Assembly',    value: 85, color: '#0d7470' },
  { label: 'Quality',     value: 70, color: '#3b82f6' },
  { label: 'Maintenance', value: 60, color: '#f59e0b' },
  { label: 'Marketing',   value: 90, color: '#10b981' },
  { label: 'R&D',         value: 75, color: '#6366f1' },
  { label: 'Finance',     value: 80, color: '#ec4899' },
];

export default function ManagerReportsPage() {
  const [tab, setTab] = useState<ReportTab>('Attendance Report');
  const [datePeriod, setDatePeriod] = useState('Last 7 Days');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Reports</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Analyze attendance trends and workforce insights</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Report tabs */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px', gap: '2px', width: 'fit-content' }}>
        {REPORT_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? '#0d7470' : 'transparent', color: tab === t ? 'white' : '#64748b', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      {/* Date range + filters */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Date Range:</span>
        <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          {DATE_BTNS.map((b) => (
            <button key={b} onClick={() => setDatePeriod(b)} style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: datePeriod === b ? '#0d7470' : 'white', color: datePeriod === b ? 'white' : '#374151', transition: 'all 0.15s' }}>{b}</button>
          ))}
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', color: '#374151', fontFamily: 'Inter, sans-serif' }}>
          <Filter size={12} /> More Filters
        </button>
      </div>

      {tab === 'Attendance Report' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {[
              { label: 'Total Attendance', value: '1,280', sub: '894 hrs • 424 Emp' },
              { label: 'Present',          value: '974',   sub: '76% of total', trend: '+2.4%', up: true },
              { label: 'On Leave',         value: '42',    sub: '3.3% impact',  trend: '+0.8%', up: true },
              { label: 'Late Arrivals',    value: '35',    sub: 'Avg delay: 12m' },
            ].map(({ label, value, sub, trend, up }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
                <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>{value}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sub}</span>
                  {trend && <span style={{ fontSize: '11px', fontWeight: 700, color: up ? '#16a34a' : '#dc2626' }}>{trend}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Attendance Trend (Last 7 Days)</h3>
            <LineChart data={ATTENDANCE_TREND} color="#0d7470" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d} style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{d}</span>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Workforce Report' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            {[
              { label: 'Total Employees', value: '1,280' },
              { label: 'Permanent',       value: '850' },
              { label: 'Contract',        value: '430' },
              { label: 'Supervisors',     value: '25' },
              { label: 'Avg Tenure',      value: '5 yrs' },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Headcount by Department</h3>
              <BarChart data={DEPT_DATA} />
            </div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Workforce Composition</h3>
              <DonutChart />
            </div>
          </div>
        </>
      )}

      {tab === 'Productivity Report' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {[
              { label: 'Total Overtime Hours', value: '1,280' },
              { label: 'Avg Work Hours/Day',   value: '8.4 hrs' },
              { label: 'OT Employees',         value: '42' },
              { label: 'OT % of Workforce',    value: '3.3%' },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '6px 0' }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Work Hours Trend (Last 7 Days)</h3>
            <LineChart data={HOURS_TREND} color="#6366f1" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span key={d} style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{d}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
