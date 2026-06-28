import { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { Loader2 } from 'lucide-react';

interface AttendanceData {
  stats: { totalWorkforce: number; presentToday: number; absent: number; lateArrivals: number; onLeave?: number };
  departments: { department: string; present: number; total: number }[];
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', backgroundColor: color, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function ManagerAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrApi.getAttendance().then(({ data }) => setData(data as AttendanceData)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px', color: '#64748b' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '14px' }}>Loading attendance data...</span>
    </div>
  );

  const s = data?.stats ?? { totalWorkforce: 0, presentToday: 0, absent: 0, lateArrivals: 0, onLeave: 0 };
  const deps = data?.departments ?? [];
  const total = s.totalWorkforce || 1;

  const STAT_CARDS = [
    { label: 'Present Today',   value: s.presentToday,  sub: `${Math.round((s.presentToday / total) * 100)}% attendance rate`, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Absent Today',    value: s.absent,        sub: `${Math.round((s.absent / total) * 100)}% absence rate`,           color: '#dc2626', bg: '#fef2f2' },
    { label: 'Late Arrivals',   value: s.lateArrivals,  sub: 'Checked in after 9:30 AM',                                        color: '#ea580c', bg: '#fff7ed' },
    { label: 'On Leave',        value: s.onLeave ?? 0,  sub: 'Approved leaves today',                                            color: '#7c3aed', bg: '#f5f3ff' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Attendance</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Monitor team attendance and punctuality</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {STAT_CARDS.map(({ label, value, sub, color }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{label}</p>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Department breakdown */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Department-wise Attendance</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Present vs total by department</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {deps.map((d) => {
            const pct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
            const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#ea580c' : '#dc2626';
            return (
              <div key={d.department}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{d.department}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{d.present}/{d.total}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</span>
                  </div>
                </div>
                <ProgressBar value={d.present} max={d.total} color={color} />
              </div>
            );
          })}
          {deps.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No department data available</p>}
        </div>
      </div>
    </div>
  );
}
