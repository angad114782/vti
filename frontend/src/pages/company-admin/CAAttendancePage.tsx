import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BAR_DATA = [
  { day: 'Mon', present: 920, absent: 62 },
  { day: 'Tue', present: 940, absent: 42 },
  { day: 'Wed', present: 910, absent: 72 },
  { day: 'Thu', present: 930, absent: 52 },
  { day: 'Fri', present: 900, absent: 82 },
  { day: 'Sat', present: 450, absent: 30 },
  { day: 'Sun', present: 120, absent: 20 },
];

const LINE_DATA = [842, 900, 870, 920, 880, 910, 945];
const MAX_BAR = 982;

const SHIFTS = [
  { name: 'Morning Shift', time: '06:00 – 14:00', present: 252, total: 300, late: 18 },
  { name: 'Afternoon Shift', time: '14:00 – 22:00', present: 220, total: 280, late: 12 },
  { name: 'Night Shift', time: '22:00 – 06:00', present: 180, total: 220, late: 8 },
];

const DEPT_DATA = [
  { dept: 'Engineering',  total: 310, present: 295, absent: 15, late: 12, onLeave: 8 },
  { dept: 'Operations',   total: 280, present: 260, absent: 20, late: 9,  onLeave: 5 },
  { dept: 'HR',           total: 42,  present: 40,  absent: 2,  late: 3,  onLeave: 1 },
  { dept: 'Finance',      total: 55,  present: 51,  absent: 4,  late: 2,  onLeave: 2 },
  { dept: 'Sales',        total: 185, present: 172, absent: 13, late: 8,  onLeave: 6 },
  { dept: 'Support',      total: 110, present: 100, absent: 10, late: 5,  onLeave: 3 },
];

const STATS = [
  { label: 'Present Today', value: '974', sub: '99.2% on-time', color: '#0d7470' },
  { label: 'Absent Today',  value: '42',  sub: '4.3% of total', color: '#ea580c' },
  { label: 'Late Arrivals', value: '12',  sub: '1.2% of total', color: '#d97706' },
  { label: 'On Leave',      value: '25',  sub: '2.6% of total', color: '#6366f1' },
];

function BarChart() {
  const H = 90;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${H + 20}px` }}>
      {BAR_DATA.map((d) => {
        const pPct = (d.present / MAX_BAR) * H;
        const aPct = (d.absent / MAX_BAR) * H;
        return (
          <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: `${H}px` }}>
              <div style={{ width: '8px', height: `${pPct}px`, backgroundColor: '#0d7470', borderRadius: '2px 2px 0 0' }} />
              <div style={{ width: '8px', height: `${aPct}px`, backgroundColor: '#fca5a5', borderRadius: '2px 2px 0 0' }} />
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function LineChart() {
  const W = 280; const H = 70; const pad = 10;
  const min = Math.min(...LINE_DATA) - 20;
  const max = Math.max(...LINE_DATA) + 10;
  const pts = LINE_DATA.map((v, i) => {
    const x = pad + (i / (LINE_DATA.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <polyline points={pts} fill="none" stroke="#0d7470" strokeWidth="2" strokeLinejoin="round" />
      {LINE_DATA.map((v, i) => {
        const x = pad + (i / (LINE_DATA.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill="#0d7470" />;
      })}
      {DAYS.map((d, i) => {
        const x = pad + (i / (DAYS.length - 1)) * (W - pad * 2);
        return <text key={d} x={x} y={H - 1} textAnchor="middle" fontSize="8" fill="#94a3b8">{d}</text>;
      })}
    </svg>
  );
}

export default function CAAttendancePage() {
  const [tab, setTab] = useState<'overview' | 'departments'>('overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Attendance</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Monitor daily attendance across shifts and departments.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {(['overview', 'departments'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#0d4a47' : '#64748b', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', textTransform: 'capitalize' }}>
            {t === 'overview' ? 'Overview' : 'By Department'}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {STATS.map(({ label, value, sub, color }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</p>
                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Daily Attendance (This Week)</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[{ label: '■ Present', color: '#0d7470' }, { label: '■ Absent', color: '#fca5a5' }].map(({ label, color }) => (
                    <span key={label} style={{ fontSize: '10px', color, fontWeight: 600 }}>{label}</span>
                  ))}
                </div>
              </div>
              <BarChart />
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Attendance Trend</h3>
              <LineChart />
            </div>
          </div>

          {/* Shift cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {SHIFTS.map((s) => {
              const pct = Math.round((s.present / s.total) * 100);
              return (
                <div key={s.name} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{s.name}</p>
                      <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{s.time}</p>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0d7470' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#0d7470', borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Present: <strong style={{ color: '#0d7470' }}>{s.present}</strong></span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Late: <strong style={{ color: '#d97706' }}>{s.late}</strong></span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Total: {s.total}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alert */}
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>Attendance Alert</p>
              <p style={{ fontSize: '11px', color: '#78350f', marginTop: '2px' }}>Night shift has 8 late arrivals today — 2 more than yesterday. Consider reviewing scheduling for that shift.</p>
            </div>
          </div>
        </>
      ) : (
        /* Departments table */
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Attendance by Department — Today</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['Department', 'Total', 'Present', 'Absent', 'Late', 'On Leave', 'Rate'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPT_DATA.map((d, idx) => {
                const rate = Math.round((d.present / d.total) * 100);
                return (
                  <tr key={d.dept} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '11px 16px', fontSize: '12px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{d.dept}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{d.total}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#0d7470', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{d.present}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#ea580c', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{d.absent}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#d97706', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{d.late}</td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: '#6366f1', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{d.onLeave}</td>
                    <td style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px' }}>
                          <div style={{ width: `${rate}%`, height: '100%', backgroundColor: rate >= 95 ? '#0d7470' : rate >= 85 ? '#d97706' : '#ea580c', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', minWidth: '30px' }}>{rate}%</span>
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
  );
}
