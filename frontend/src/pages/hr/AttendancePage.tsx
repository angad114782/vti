import { useState, useEffect } from 'react';
import { hrApi } from '../../api/hr';
import { Users, UserCheck, UserX, Clock, Loader2 } from 'lucide-react';

export default function AttendancePage() {
  const [data, setData] = useState<{
    stats: { totalWorkforce: number; perm: number; cont: number; presentToday: number; presentPct: number; absent: number; absentPct: number; lateArrivals: number; avgDelay: number };
    departments: { department: string; total: number; present: number; percentage: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrApi.getAttendance().then(({ data }) => { setData(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px', gap: '10px', color: '#64748b' }}>
      <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: '14px' }}>Loading...</span>
    </div>
  );

  const s = data?.stats;

  const statCards = [
    {
      label: 'Total Workforce', value: s?.totalWorkforce ?? 0, sub: `${s?.perm ?? 0} Perm | ${s?.cont ?? 0} Cont`,
      icon: Users, color: '#3b82f6', bg: '#eff6ff',
    },
    {
      label: 'Present Today', value: s?.presentToday ?? 0, sub: `${s?.presentPct ?? 0}% of total`,
      badge: '+2.4%', badgeUp: true, icon: UserCheck, color: '#10b981', bg: '#f0fdf4',
    },
    {
      label: 'Absent', value: s?.absent ?? 0, sub: `${s?.absentPct ?? 0}% impact`,
      badge: '-0.8%', badgeUp: false, icon: UserX, color: '#ef4444', bg: '#fef2f2',
    },
    {
      label: 'Late Arrivals', value: s?.lateArrivals ?? 0, sub: `Avg delay: ${s?.avgDelay ?? 0}m`,
      icon: Clock, color: '#f59e0b', bg: '#fffbeb',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Attendance Overview</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Company-wide attendance performance across shifts & workforce types</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{s.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{s.value.toLocaleString()}</p>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.sub}</p>
              </div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            {'badge' in s && s.badge && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: s.badgeUp ? '#15803d' : '#b91c1c' }}>{s.badge}</span>
            )}
          </div>
        ))}
      </div>

      {/* Department-wise */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 22px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Department-wise Attendance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(data?.departments ?? []).map((dept) => (
            <div key={dept.department}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{dept.department}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{dept.present}/{dept.total} present</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0d7470' }}>{dept.percentage}%</span>
                </div>
              </div>
              <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${dept.percentage}%`, backgroundColor: '#0d7470', borderRadius: '3px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
