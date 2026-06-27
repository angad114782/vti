import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, UserX, CheckSquare, ArrowRight, Download, UserCog, FileText, BarChart3 } from 'lucide-react';
import { hrApi } from '../../api/hr';

const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
  { bg: '#f0f9ff', color: '#0ea5e9' },
];
const getAv = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]!;
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const ACTIVITIES = [
  { name: 'Michael Chen',  action: 'Leave Request Submitted', ago: '10 minutes ago', type: 'leave'    },
  { name: 'Sarah Johnson', action: 'Late Check-in',           ago: '25 minutes ago', type: 'late'     },
  { name: 'Emma Wilson',   action: 'New Employee Onboarded',  ago: '2 hours ago',    type: 'onboard'  },
  { name: 'David Kim',     action: 'Leave Request Approved',  ago: '3 hours ago',    type: 'approved' },
];

const PENDING_ACTIONS = [
  { label: 'Approve Leave Requests',      badge: 'High',   count: 7,  badgeColor: '#b91c1c',  badgeBg: '#fef2f2'  },
  { label: 'Review Pending Timesheets',   badge: 'Medium', count: 12, badgeColor: '#d97706',  badgeBg: '#fef9c3'  },
  { label: 'Complete Performance Reviews',badge: 'High',   count: 3,  badgeColor: '#b91c1c',  badgeBg: '#fef2f2'  },
  { label: 'Update Employee Documents',   badge: 'Low',    count: 3,  badgeColor: '#15803d',  badgeBg: '#dcfce7'  },
];

const QUICK_ACTIONS = [
  { icon: Download, label: 'Download Payroll', path: '/hr/payroll' },
  { icon: UserCog,  label: 'Manage Roles',     path: '/hr/employees' },
  { icon: FileText, label: 'Download Summary', path: '/hr/documents' },
  { icon: BarChart3,label: 'View Reports',     path: '/hr/attendance' },
];

export default function HRDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ lateArrivals: 12, presentToday: 8, absentToday: 4, pendingApprovals: 6 });

  useEffect(() => {
    hrApi.getAttendance().then(({ data }) => {
      setStats({ lateArrivals: data.stats.lateArrivals, presentToday: data.stats.presentToday, absentToday: data.stats.absent, pendingApprovals: 6 });
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Late Arrivals',    value: stats.lateArrivals,    icon: Clock,       color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Present Today',    value: stats.presentToday,    icon: Users,       color: '#10b981', bg: '#f0fdf4' },
    { label: 'Absent Today',     value: stats.absentToday,     icon: UserX,       color: '#ef4444', bg: '#fef2f2' },
    { label: 'Pending Approvals',value: stats.pendingApprovals,icon: CheckSquare, color: '#3b82f6', bg: '#eff6ff' },
  ];

  const actIcon = (type: string) => {
    if (type === 'leave')   return <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />;
    if (type === 'late')    return <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />;
    if (type === 'onboard') return <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />;
    return <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Overview of today's attendance and workforce status.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#64748b' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent Activities */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Recent Activities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {ACTIVITIES.map((a) => {
              const av = getAv(a.name);
              return (
                <div key={a.name + a.ago} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {actIcon(a.type)}
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av.color, fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>
                      {initials(a.name)}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{a.action}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{a.name}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{a.ago}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate('/hr/attendance')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '16px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0d7470', fontFamily: 'Inter, sans-serif' }}>
            View All Activities <ArrowRight size={13} />
          </button>
        </div>

        {/* Pending Actions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Pending Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PENDING_ACTIONS.map((a) => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{a.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: a.badgeBg, color: a.badgeColor }}>{a.badge}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{a.count} items</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>QUICK ACTIONS</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {QUICK_ACTIONS.map((q) => (
            <button key={q.label} onClick={() => navigate(q.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '18px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = '#f8fafc'; el.style.borderColor = '#0d7470'; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'white'; el.style.borderColor = '#e2e8f0'; }}
            >
              <q.icon size={22} color="#0d7470" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
