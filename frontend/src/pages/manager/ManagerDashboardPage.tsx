import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, UserCheck, UserX, ClipboardList, Eye, Download, BarChart2, Settings } from 'lucide-react';

const STATS = [
  { label: 'Late Arrivals',      value: '12', icon: Clock,          iconBg: '#fff7ed', iconColor: '#ea580c', sub: 'Today' },
  { label: 'Present Today',      value: '8',  icon: UserCheck,      iconBg: '#f0fdf4', iconColor: '#16a34a', sub: 'Active now' },
  { label: 'Absent Today',       value: '4',  icon: UserX,          iconBg: '#fef2f2', iconColor: '#dc2626', sub: 'Not checked in' },
  { label: 'Pending Approvals',  value: '6',  icon: ClipboardList,  iconBg: '#eff6ff', iconColor: '#2563eb', sub: 'Awaiting action' },
];

const ALERTS = [
  { type: 'Late Arrival',   name: 'Alex Turner',   dept: 'Engineering', time: '10:25 AM', color: '#ea580c', bg: '#fff7ed' },
  { type: 'Late Arrival',   name: 'Sarah Johnson', dept: 'Design',      time: '10:40 AM', color: '#ea580c', bg: '#fff7ed' },
  { type: 'Absent',         name: 'Michael Chen',  dept: 'Engineering', time: 'Not checked in', color: '#dc2626', bg: '#fef2f2' },
  { type: 'Absent',         name: 'Emma Wilson',   dept: 'HR',          time: 'Not checked in', color: '#dc2626', bg: '#fef2f2' },
  { type: 'Overtime Alert', name: 'David Kim',     dept: 'Sales',       time: '9.5 hrs logged', color: '#7c3aed', bg: '#f5f3ff' },
  { type: 'Late Arrival',   name: 'Priya Sharma',  dept: 'Finance',     time: '10:15 AM', color: '#ea580c', bg: '#fff7ed' },
];

const PENDING = [
  { label: 'Approve Leave Requests', count: 3, priority: 'High',   priorityColor: '#dc2626', priorityBg: '#fef2f2' },
  { label: 'Review Attendance Logs', count: 5, priority: 'Medium', priorityColor: '#d97706', priorityBg: '#fffbeb' },
  { label: 'Shift Change Requests',  count: 2, priority: 'Low',    priorityColor: '#16a34a', priorityBg: '#f0fdf4' },
];

const QUICK = [
  { label: 'View Attendance', Icon: Eye,       path: '/manager/attendance' },
  { label: 'Settings',        Icon: Settings,  path: '/manager/settings' },
  { label: 'Download Report', Icon: Download,  path: '/manager/reports' },
  { label: 'View Reports',    Icon: BarChart2, path: '/manager/reports' },
];

export default function ManagerDashboardPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Monitor your team's attendance and workforce status</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {STATS.map(({ label, value, icon: Icon, iconBg, iconColor, sub }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={iconColor} />
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Alerts & Exceptions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#ea580c" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Alerts & Exceptions</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ea580c', backgroundColor: '#fff7ed', padding: '2px 8px', borderRadius: '20px' }}>{ALERTS.length} alerts</span>
          </div>
          <div style={{ padding: '8px 0', maxHeight: '300px', overflowY: 'auto' }}>
            {ALERTS.map((a, i) => (
              <div key={i} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: i < ALERTS.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: a.bg, color: a.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{a.type}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>{a.dept}</p>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Pending Actions</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Items requiring your attention</p>
          </div>
          <div style={{ padding: '12px 0' }}>
            {PENDING.map((p, i) => (
              <div key={i} style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', borderBottom: i < PENDING.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{p.label}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{p.count} items pending</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: p.priorityBg, color: p.priorityColor }}>{p.priority}</span>
                  <button onClick={() => navigate('/manager/approvals')} style={{ padding: '6px 14px', backgroundColor: '#0d7470', border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Review</button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>QUICK ACTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {QUICK.map(({ label, Icon, path }) => (
                <button key={label} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 6px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = '#f8fafc'; el.style.borderColor = '#0d7470'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'white'; el.style.borderColor = '#e2e8f0'; }}>
                  <Icon size={16} color="#0d7470" />
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
