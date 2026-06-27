import { useState } from 'react';
import { Plus, Edit2, AlertTriangle, RotateCcw } from 'lucide-react';

type ShiftTab = 'Shift Assignment' | 'Workforce Planning' | 'Shortage Alerts';
const SHIFT_TABS: ShiftTab[] = ['Shift Assignment', 'Workforce Planning', 'Shortage Alerts'];

const SHIFT_STATS = [
  { label: 'Total Workers',    value: '80',  sub: 'Total workforce' },
  { label: 'Morning Shift',    value: '22',  sub: 'Starts 1 hour',  badge: 'green' },
  { label: 'Afternoon Shift',  value: '32',  sub: 'Starts 4 hours', badge: 'yellow' },
  { label: 'Night Shift',      value: '16',  sub: 'Requirement Fulfilled', badge: 'blue' },
];

const MORNING_EMPS = [
  { name: 'Rajni Kumar', id: 'EMP001', dept: 'Assembly',  role: 'Line Worker', shift: '06:00 - 14:00' },
  { name: 'Amit Fajar',  id: 'EMP002', dept: 'Quality',   role: 'Inspector',   shift: '06:00 - 14:00' },
  { name: 'Priya Singh', id: 'EMP003', dept: 'Assembly',  role: 'Line Worker', shift: '06:00 - 14:00' },
];
const EVENING_EMPS = [
  { name: 'Ankit Fajar', id: 'EMP004', dept: 'Packaging', role: 'Packager',    shift: '14:00 - 22:00' },
  { name: 'Ravi Varma',  id: 'EMP005', dept: 'Quality',   role: 'Inspector',   shift: '14:00 - 22:00' },
];
const NIGHT_EMPS = [
  { name: 'Vikas Rao',   id: 'EMP006', dept: 'Maintenance', role: 'Technician', shift: '22:00 - 06:00' },
  { name: 'Suniti Kumar',id: 'EMP007', dept: 'Security',    role: 'Guard',      shift: '22:00 - 06:00' },
  { name: 'Deepak Gupta',id: 'EMP008', dept: 'Maintenance', role: 'Technician', shift: '22:00 - 06:00' },
];

const WORKFORCE_PLAN = [
  { dept: 'Assembly', machine: 'Packaging', shift: 'Morning', required: 5 },
  { dept: 'Assembly', machine: 'Packaging', shift: 'Morning', required: 5 },
  { dept: 'Assembly', machine: 'Packaging', shift: 'Morning', required: 5 },
  { dept: 'Assembly', machine: 'Packaging', shift: 'Morning', required: 5 },
];

const SHORTAGE_STATS = [
  { label: 'Total Machines',  value: '20', color: '#374151' },
  { label: 'Understaffed',    value: '3',  color: '#dc2626', sub: 'Need workers' },
  { label: 'Fully Staffed',   value: '4',  color: '#16a34a', sub: 'Morning Surplus' },
  { label: 'Overstaffed',     value: '1',  color: '#7c3aed', sub: 'Minus Requirement' },
];

const CRITICAL_SHORTAGES = [
  { station: 'Assembly – Station 1', shift: 'Morning Shift', required: 5, actual: 2, severity: 'critical' },
  { station: 'Packaging – Line A',   shift: 'Morning Shift', required: 3, actual: 1, severity: 'high'     },
];

const UNDERSTAFFED = [
  { station: 'Packaging – Line A', shift: 'Morning Shift' },
];

function ShiftCard({ label, color, employees }: { label: string; color: string; employees: typeof MORNING_EMPS }) {
  return (
    <div style={{ borderRadius: '12px', border: `2px solid ${color}20`, overflow: 'hidden' }}>
      <div style={{ backgroundColor: color, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{employees.length} workers</span>
      </div>
      <div style={{ backgroundColor: 'white' }}>
        {employees.map((e, i) => (
          <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < employees.length - 1 ? `1px solid ${color}15` : 'none' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{e.name}</p>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>{e.id} • {e.dept}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: '#64748b' }}>{e.role}</p>
              <p style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{e.shift}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShiftManagementPage() {
  const [tab, setTab] = useState<ShiftTab>('Shift Assignment');
  const [date, setDate] = useState('Today');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Shift Management</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage shift assignments and workforce planning</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <RotateCcw size={13} /> Rotate Shifts
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Plus size={13} /> Assign Shift
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '4px', gap: '2px', width: 'fit-content' }}>
        {SHIFT_TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? '#0d7470' : 'transparent', color: tab === t ? 'white' : '#64748b', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {t}
            {t === 'Shortage Alerts' && <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: tab === t ? '#f87171' : '#dc2626', display: 'inline-block' }} />}
          </button>
        ))}
      </div>

      {tab === 'Shift Assignment' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Date:</span>
            <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {['Today', 'Tomorrow', 'This Week'].map((d) => (
                <button key={d} onClick={() => setDate(d)} style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: date === d ? '#0d7470' : 'white', color: date === d ? 'white' : '#374151' }}>{d}</button>
              ))}
            </div>
            <select style={{ padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#374151', backgroundColor: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif' }}>
              <option>All Departments</option>
              <option>Assembly</option>
              <option>Quality</option>
              <option>Maintenance</option>
            </select>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {SHIFT_STATS.map(({ label, value, sub, badge }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
                  {badge && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: badge === 'green' ? '#16a34a' : badge === 'yellow' ? '#f59e0b' : '#3b82f6' }} />}
                </div>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{value}</p>
                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Shift cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <ShiftCard label="Morning Shift  06:00 - 14:00" color="#0d7470" employees={MORNING_EMPS} />
            <ShiftCard label="Evening Shift  14:00 - 22:00" color="#f59e0b" employees={EVENING_EMPS} />
            <ShiftCard label="Night Shift    22:00 - 06:00" color="#6366f1" employees={NIGHT_EMPS} />
          </div>

          {/* Quick Actions */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>QUICK ACTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {['Mark Attendance', 'Approve Leave', 'Manage Shifts', 'View Workforce'].map((label) => (
                <button key={label} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#0d7470'; el.style.backgroundColor = '#f0fdfa'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e2e8f0'; el.style.backgroundColor = 'white'; }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'Workforce Planning' && (
        <>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select style={{ padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#374151', backgroundColor: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif' }}>
              <option>Assembly</option>
              <option>Quality</option>
              <option>Maintenance</option>
            </select>
            <select style={{ padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#374151', backgroundColor: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'Inter, sans-serif' }}>
              <option>All Status</option>
              <option>Understaffed</option>
              <option>Fulfilled</option>
            </select>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <Plus size={12} /> Add Plan
            </button>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Department', 'Machine', 'Shift', 'Required', 'Action'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WORKFORCE_PLAN.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < WORKFORCE_PLAN.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{row.dept}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{row.machine}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{row.shift}</span></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{row.required}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Edit2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'Shortage Alerts' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
            {SHORTAGE_STATS.map(({ label, value, color, sub }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
                <p style={{ fontSize: '22px', fontWeight: 800, color, marginTop: '4px' }}>{value}</p>
                {sub && <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{sub}</p>}
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div style={{ backgroundColor: '#fff7ed', borderRadius: '10px', border: '1px solid #fed7aa', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} color="#ea580c" />
            <span style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600 }}>3 machines understaffed — 2 in Assembly Line + 1 in Packaging Line A — Short by 2 workers</span>
          </div>

          {/* Critical Shortages */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fef2f2' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c' }}>● Critical Shortages</h3>
            </div>
            {CRITICAL_SHORTAGES.map((s, i) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: i < CRITICAL_SHORTAGES.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{s.station}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.shift} • Required: {s.required} workers • Currently: {s.actual}</p>
                  <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px', fontWeight: 600 }}>Short by {s.required - s.actual} workers</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Reassign Shift</button>
                  <button style={{ padding: '6px 14px', backgroundColor: '#0d7470', border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Rotate Shift</button>
                  {s.severity === 'critical' && <button style={{ padding: '6px 14px', backgroundColor: '#dc2626', border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Mark Critical</button>}
                </div>
              </div>
            ))}
          </div>

          {/* Understaffed */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>● Understaffed</h3>
            </div>
            {UNDERSTAFFED.map((s, i) => (
              <div key={i} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{s.station}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.shift}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '7px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Reassign Shift</button>
                  <button style={{ padding: '6px 14px', backgroundColor: '#0d7470', border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Rotate Shift</button>
                  <button style={{ padding: '6px 14px', backgroundColor: '#f59e0b', border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Mark Critical</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
