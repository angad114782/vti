import { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { Loader2, Search, Download } from 'lucide-react';

interface AttendanceData {
  stats: { totalWorkforce: number; presentToday: number; absent: number; lateArrivals: number; onLeave?: number };
  departments: { department: string; present: number; total: number }[];
}

const EMPLOYEE_RECORDS = [
  { name: 'Ankita Yadav', id: 'EMP001', shift: 'Morning', checkIn: '08:55 AM', checkOut: '06:02 PM', hours: '9h 07m', status: 'Present',  overtime: '1h 07m' },
  { name: 'Raj Patel',    id: 'EMP002', shift: 'Morning', checkIn: '09:12 AM', checkOut: '06:15 PM', hours: '9h 03m', status: 'Late',     overtime: '1h 03m' },
  { name: 'Lisa Wang',    id: 'EMP003', shift: 'Morning', checkIn: '—',        checkOut: '—',        hours: '—',      status: 'Absent',   overtime: '—'      },
  { name: 'Alex Turner',  id: 'EMP004', shift: 'Evening', checkIn: '02:00 PM', checkOut: '10:05 PM', hours: '8h 05m', status: 'Present',  overtime: '0h 05m' },
  { name: 'Emma Wilson',  id: 'EMP005', shift: 'Night',   checkIn: '10:00 PM', checkOut: '06:10 AM', hours: '8h 10m', status: 'Present',  overtime: '0h 10m' },
];

const STATUS_META: Record<string, { bg: string; color: string }> = {
  Present: { bg: '#f0fdf4', color: '#16a34a' },
  Late:    { bg: '#fff7ed', color: '#ea580c' },
  Absent:  { bg: '#fef2f2', color: '#dc2626' },
  Leave:   { bg: '#eff6ff', color: '#2563eb' },
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', backgroundColor: color }} />
    </div>
  );
}

export default function SupervisorAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'overview' | 'records'>('overview');

  useEffect(() => {
    hrApi.getAttendance().then(({ data }) => setData(data as AttendanceData)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const s = data?.stats ?? { totalWorkforce: 0, presentToday: 0, absent: 0, lateArrivals: 0, onLeave: 0 };
  const deps = data?.departments ?? [];

  const filtered = EMPLOYEE_RECORDS.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Attendance</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Track and manage team attendance</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px', gap: '2px', width: 'fit-content' }}>
        {[['overview', 'Overview'], ['records', 'Daily Records']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as 'overview' | 'records')} style={{ padding: '8px 18px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === key ? '#0d7470' : 'transparent', color: tab === key ? 'white' : '#64748b', transition: 'all 0.15s' }}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                  { label: 'Present Today', value: s.presentToday,  color: '#16a34a' },
                  { label: 'Absent Today',  value: s.absent,        color: '#dc2626' },
                  { label: 'Late Arrivals', value: s.lateArrivals,  color: '#ea580c' },
                  { label: 'On Leave',      value: s.onLeave ?? 0,  color: '#7c3aed' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{label}</p>
                    <p style={{ fontSize: '28px', fontWeight: 800, color, marginTop: '6px', lineHeight: 1 }}>{value}</p>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Department-wise Attendance</h3>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {deps.map((d) => {
                    const pct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
                    const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#ea580c' : '#dc2626';
                    return (
                      <div key={d.department}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{d.department}</span>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{d.present}/{d.total}</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</span>
                          </div>
                        </div>
                        <ProgressBar value={d.present} max={d.total} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'records' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Employee', 'Shift', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Overtime'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec, i) => {
                  const sm = STATUS_META[rec.status] ?? STATUS_META['Present']!;
                  return (
                    <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{rec.name}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{rec.id}</p>
                      </td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: '#64748b' }}>{rec.shift}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{rec.checkIn}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{rec.checkOut}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{rec.hours}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: sm.bg, color: sm.color }}>{rec.status}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>{rec.overtime}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
