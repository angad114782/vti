import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Building2, IndianRupee, Users, AlertTriangle,
  ArrowUpRight, TrendingUp, AlertCircle,
  UserPlus, DollarSign, Activity,
  Download, Shield, FileText, BarChart3,
} from 'lucide-react';

const revenueData = [
  { month: 'Oct', revenue: 110000 },
  { month: 'Nov', revenue: 128000 },
  { month: 'Dec', revenue: 145000 },
  { month: 'Jan', revenue: 158000 },
  { month: 'Feb', revenue: 171000 },
  { month: 'Mar', revenue: 218000 },
];

const stats = [
  {
    label: 'Total Companies',
    value: '30',
    sub: 'This month',
    change: '+12.4%',
    up: true,
    icon: Building2,
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
  },
  {
    label: 'Monthly Revenue',
    value: '₹1,21,974',
    sub: 'From 30 subscriptions',
    change: '+6.4%',
    up: true,
    icon: IndianRupee,
    iconBg: '#f0fdf4',
    iconColor: '#22c55e',
  },
  {
    label: 'Active Users',
    value: '42',
    sub: 'Across all companies',
    change: '-0.8%',
    up: false,
    icon: Users,
    iconBg: '#faf5ff',
    iconColor: '#a855f7',
  },
  {
    label: 'Expiring Soon',
    value: '3',
    sub: 'Subscriptions (30 day)',
    change: '+5.4%',
    up: false,
    icon: AlertTriangle,
    iconBg: '#fff7ed',
    iconColor: '#f97316',
  },
];

const alerts = [
  { type: 'critical', label: 'Issue', text: 'API access issue reported by TechManufacture', color: '#ef4444', bg: '#fef2f2' },
  { type: 'warning', label: '1 companies', text: 'Subscriptions expiring in next 30 days', color: '#f59e0b', bg: '#fffbeb' },
  { type: 'warning', label: '1 company', text: 'Inactive companies detected', color: '#f59e0b', bg: '#fffbeb' },
  { type: 'info', label: '3 tickets', text: 'Open support tickets need review', color: '#3b82f6', bg: '#eff6ff' },
];

const activities = [
  { icon: UserPlus, color: '#22c55e', bg: '#f0fdf4', text: 'NanoTech Industries onboarded', time: '3 hours ago' },
  { icon: TrendingUp, color: '#3b82f6', bg: '#eff6ff', text: 'PrecisionParts Ltd upgraded to Pro', time: '5 hours ago' },
  { icon: DollarSign, color: '#a855f7', bg: '#faf5ff', text: 'Payment received from TechManufacture Inc.', time: '1 day ago' },
  { icon: Activity, color: '#f97316', bg: '#fff7ed', text: 'High usage spike in Global Steel Works', time: '1 day ago' },
  { icon: Users, color: '#64748b', bg: '#f8fafc', text: '500+ total users milestone reached', time: '2 days ago' },
];

const companies = [
  { initials: 'TE', color: '#6366f1', bg: '#eef2ff', name: 'TechManufacture Inc.', industry: 'Automotive',         plan: 'Enterprise', users: 85, status: 'active',   expiry: 'Dec 31, 2026', expiryWarn: false },
  { initials: 'PR', color: '#8b5cf6', bg: '#f5f3ff', name: 'PrecisionParts Ltd.', industry: 'Electronics',        plan: 'Pro',        users: 42, status: 'active',   expiry: 'Jun 20, 2026', expiryWarn: false },
  { initials: 'GL', color: '#0ea5e9', bg: '#f0f9ff', name: 'Global Steel Works',  industry: 'Steel Manufacturing', plan: 'Enterprise', users: 156, status: 'active',  expiry: 'Nov 10, 2026', expiryWarn: false },
  { initials: 'SM', color: '#10b981', bg: '#f0fdf4', name: 'SmartFactory Co.',    industry: 'IoT Manufacturing',   plan: 'Basic',      users: 12, status: 'active',   expiry: 'Apr 15, 2026', expiryWarn: true },
  { initials: 'LE', color: '#f59e0b', bg: '#fffbeb', name: 'Legacy Manufacturing',industry: 'Heavy Equipment',     plan: 'Pro',        users: 0,  status: 'inactive', expiry: 'Expired',      expiryWarn: true },
  { initials: 'NA', color: '#ec4899', bg: '#fdf4ff', name: 'NanoTech Industries', industry: 'Nanotechnology',      plan: 'Pro',        users: 38, status: 'active',   expiry: 'Aug 15, 2027', expiryWarn: false },
];

const quickActions = [
  { icon: Download, label: 'Download Payroll' },
  { icon: Shield, label: 'Manage Roles' },
  { icon: FileText, label: 'Download Summary' },
  { icon: BarChart3, label: 'View Reports' },
];

const planStyle: Record<string, { bg: string; color: string; border: string }> = {
  Enterprise: { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe' },
  Pro:        { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  Basic:      { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
};

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
          Manage your platform and monitor client companies
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>{s.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{s.value}</p>
              </div>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: s.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <s.icon size={17} color={s.iconColor} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                color: s.up ? '#16a34a' : '#dc2626',
                backgroundColor: s.up ? '#f0fdf4' : '#fef2f2',
                padding: '2px 6px', borderRadius: '4px',
              }}>
                {s.change}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            Revenue Trend (Last 6 Months)
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0d7470' }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Revenue ($)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={36} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#0d7470" strokeWidth={2.5}
              dot={{ fill: '#0d7470', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#0d7470' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Alerts & Issues */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          border: '1px solid #e2e8f0', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Alerts & Issues</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Items requiring attention</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                backgroundColor: a.bg, border: `1px solid ${a.color}22`,
              }}>
                <AlertCircle size={15} color={a.color} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: a.color,
                    textTransform: 'uppercase', letterSpacing: '0.3px',
                    backgroundColor: `${a.color}20`, padding: '1px 6px', borderRadius: '4px',
                  }}>
                    {a.type === 'critical' ? 'CRITICAL' : a.type === 'warning' ? 'WARNING' : 'INFO'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>{a.label}</span>
                  <p style={{ fontSize: '12px', color: '#374151', marginTop: '3px', fontWeight: 500 }}>{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          border: '1px solid #e2e8f0', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={16} color="#0d7470" />
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Recent Activity</h2>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>Platform-level events</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: a.bg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <a.icon size={15} color={a.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{a.text}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Companies Overview */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Companies Overview</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Quick view of all client companies</p>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '13px', fontWeight: 600, color: '#0d7470',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            View All <ArrowUpRight size={14} />
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['Company', 'Plan', 'Users', 'Status', 'Expiry', 'Action'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 22px',
                  fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => (
              <tr key={c.name} style={{ borderBottom: i < companies.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <td style={{ padding: '13px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      backgroundColor: c.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: c.color, fontWeight: 700, fontSize: '12px',
                    }}>
                      {c.initials}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{c.name}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8' }}>{c.industry}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 22px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: planStyle[c.plan]?.bg,
                    color: planStyle[c.plan]?.color,
                    border: `1px solid ${planStyle[c.plan]?.border}`,
                  }}>
                    {c.plan}
                  </span>
                </td>
                <td style={{ padding: '13px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={13} color="#94a3b8" />
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{c.users}</span>
                  </div>
                </td>
                <td style={{ padding: '13px 22px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: c.status === 'active' ? '#dcfce7' : '#f1f5f9',
                    color: c.status === 'active' ? '#15803d' : '#64748b',
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '13px 22px' }}>
                  <p style={{ fontSize: '13px', color: c.expiryWarn ? '#dc2626' : '#374151', fontWeight: c.expiryWarn ? 600 : 400 }}>
                    {c.expiry}
                  </p>
                  {c.expiryWarn && c.expiry !== 'Expired' && (
                    <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '1px' }}>14 days left</p>
                  )}
                </td>
                <td style={{ padding: '13px 22px' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '13px', fontWeight: 600, color: '#0d7470',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>
                    View <ArrowUpRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0', padding: '18px 22px',
      }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
          QUICK ACTIONS
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {quickActions.map((q) => (
            <button key={q.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              padding: '18px 12px', borderRadius: '10px',
              border: '1px solid #e2e8f0', backgroundColor: 'white',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#0d7470'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
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
