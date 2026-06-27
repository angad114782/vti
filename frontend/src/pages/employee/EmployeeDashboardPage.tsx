import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { employeeApi } from '../../api/employee';
import { CalendarCheck, Plane, FileText, Receipt, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
];
const getAv = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]!;
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

interface Profile {
  employeeId: string; department: string | null; designation: string | null;
  shiftTiming: string | null; joiningDate: string | null;
  user: { name: string; email: string };
}

export default function EmployeeDashboardPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [attStats, setAttStats] = useState({ present: 0, late: 0, absent: 0, totalHours: 0, workingDays: 0 });
  const [leaveBalance, setLeaveBalance] = useState<{ type: string; remaining: number; total: number }[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<{ period: string; netPay: number; status: string } | null>(null);
  const [pendingExpenses, setPendingExpenses] = useState(0);

  useEffect(() => {
    employeeApi.getProfile().then(({ data }) => setProfile(data as Profile)).catch(() => {});
    employeeApi.getAttendance().then(({ data }) => setAttStats(data.stats)).catch(() => {});
    employeeApi.getLeaves().then(({ data }) => setLeaveBalance(data.balance)).catch(() => {});
    employeeApi.getPayslips().then(({ data }) => { if (data.length > 0) setLatestPayslip(data[0]!); }).catch(() => {});
    employeeApi.getExpenses().then(({ data }) => setPendingExpenses(data.stats.pending)).catch(() => {});
  }, []);

  const name = user?.name ?? 'Employee';
  const av   = getAv(name);
  const attendancePct = attStats.workingDays > 0 ? Math.round((attStats.present + attStats.late) / attStats.workingDays * 100) : 0;

  const fmtPay = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero card */}
      <div style={{ backgroundColor: '#0d4a47', borderRadius: '14px', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av.color, fontWeight: 800, fontSize: '18px', flexShrink: 0 }}>{initials(name)}</div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '2px' }}>Welcome back</p>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>{name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '2px' }}>
              {profile?.designation ?? 'Employee'} · {profile?.department ?? '—'} · {profile?.employeeId ?? '—'}
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Shift Timing</p>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>{profile?.shiftTiming ?? '09:00 AM - 06:00 PM'}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '6px' }}>Joining Date</p>
          <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>{fmtDate(profile?.joiningDate ?? null)}</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { label: 'Days Present',   value: String(attStats.present + attStats.late), sub: `${attendancePct}% this month`, icon: CalendarCheck, iconBg: '#f0fdf4', iconColor: '#16a34a' },
          { label: 'Leave Balance',  value: String(leaveBalance.reduce((s, b) => s + b.remaining, 0)), sub: 'Days remaining', icon: Plane, iconBg: '#eff6ff', iconColor: '#2563eb' },
          { label: 'Hours Logged',   value: String(attStats.totalHours) + 'h', sub: 'This month',   icon: Clock,         iconBg: '#fff7ed', iconColor: '#ea580c' },
          { label: 'Pending Claims', value: String(pendingExpenses), sub: 'Awaiting approval', icon: Receipt,       iconBg: '#fef9c3', iconColor: '#854d0e' },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={iconColor} />
              </div>
            </div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>{sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Attendance this month */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Attendance This Month</h3>
            <button onClick={() => navigate('/employee/attendance')} style={{ fontSize: '11px', color: '#0d7470', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Present',     value: attStats.present,     color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Late Arrivals',value: attStats.late,       color: '#ea580c', bg: '#fff7ed' },
              { label: 'Absent',      value: attStats.absent,      color: '#dc2626', bg: '#fef2f2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: bg, borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{label}</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color }}>{value} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>days</span></span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Attendance rate</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0d7470' }}>{attendancePct}%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${attendancePct}%`, height: '100%', backgroundColor: '#0d7470', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {/* Leave balance */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Leave Balance</h3>
            <button onClick={() => navigate('/employee/leaves')} style={{ fontSize: '11px', color: '#0d7470', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Apply Leave →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leaveBalance.map((b) => (
              <div key={b.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>{b.type}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{b.remaining}/{b.total}</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(b.remaining / b.total) * 100}%`, height: '100%', backgroundColor: '#0d7470', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest payslip + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Latest Payslip</h3>
          {latestPayslip ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{latestPayslip.period}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>Net Pay</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: '#0d7470', marginTop: '2px' }}>{fmtPay(latestPayslip.netPay)}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: latestPayslip.status === 'Paid' ? '#dcfce7' : '#fef9c3', color: latestPayslip.status === 'Paid' ? '#15803d' : '#854d0e' }}>{latestPayslip.status}</span>
                  <button onClick={() => navigate('/employee/payslips')} style={{ padding: '7px 14px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View All</button>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>No payslips yet</p>
          )}
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Apply Leave',      icon: Plane,         path: '/employee/leaves',     color: '#2563eb', bg: '#eff6ff' },
              { label: 'Submit Expense',   icon: Receipt,       path: '/employee/expenses',   color: '#ea580c', bg: '#fff7ed' },
              { label: 'View Payslips',    icon: FileText,      path: '/employee/payslips',   color: '#0d7470', bg: '#f0fdfa' },
              { label: 'My Attendance',    icon: CalendarCheck, path: '/employee/attendance', color: '#16a34a', bg: '#f0fdf4' },
            ].map(({ label, icon: Icon, path, color, bg }) => (
              <button key={label} onClick={() => navigate(path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = bg; el.style.borderColor = color; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = 'white'; el.style.borderColor = '#e2e8f0'; }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={color} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming leaves / alerts */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Alerts & Reminders</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: TrendingUp,   color: '#16a34a', bg: '#f0fdf4', msg: 'Your attendance rate is above 90% this month — great work!' },
            { icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff', msg: 'Payslip for May 2026 is available. Download from Payslips section.' },
            { icon: AlertCircle,  color: '#ea580c', bg: '#fff7ed', msg: 'You have 1 pending expense claim awaiting finance approval.' },
          ].map(({ icon: Icon, color, bg, msg }) => (
            <div key={msg} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: bg, borderRadius: '8px' }}>
              <Icon size={16} color={color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#374151' }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
