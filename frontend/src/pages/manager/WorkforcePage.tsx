import { useState, useEffect, useCallback } from 'react';
import { hrApi, type Employee } from '../../api/hr';
import { Search, Eye, Edit2, Loader2 } from 'lucide-react';

const DEPT_TABS = [
  { key: 'ALL',         label: 'All',         count: 24 },
  { key: 'Assembly',    label: 'Assembly',     count: 58 },
  { key: 'Quality',     label: 'Quality',      count: 30 },
  { key: 'Maintenance', label: 'Maintenance',  count: 39 },
  { key: 'Marketing',   label: 'Marketing',    count: 64 },
  { key: 'R&D',         label: 'R&D',          count: 64 },
  { key: 'Finance',     label: 'Finance',      count: 30 },
];

const TYPE_FILTERS = ['All', 'Permanent', 'Contract'];

const WORKER_STATS = [
  { label: 'Total Workers',   value: '80' },
  { label: 'Permanent',       value: '14' },
  { label: 'Contract',        value: '40' },
  { label: 'Supervisors',     value: '6'  },
];

const PRESENT_STATUS: Record<number, boolean> = {};

const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
  { bg: '#f0f9ff', color: '#0ea5e9' },
];
const getAv = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]!;
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const isPresent = (idx: number) => {
  if (!(idx in PRESENT_STATUS)) PRESENT_STATUS[idx] = Math.random() > 0.3;
  return PRESENT_STATUS[idx]!;
};

export default function WorkforcePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, string> = {};
      if (search) p.search = search;
      if (dept !== 'ALL') p.department = dept;
      const { data } = await hrApi.getEmployees(p);
      setEmployees(data.employees ?? data as unknown as Employee[]);
    } finally { setLoading(false); }
  }, [search, dept]);

  useEffect(() => { void load(); }, [load]);

  const filtered = typeFilter === 'All' ? employees : employees.filter((e) => e.employmentType === typeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Workforce</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage and track all employee information</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {WORKER_STATS.map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Department tabs */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DEPT_TABS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setDept(key)} style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', borderColor: dept === key ? '#0d7470' : '#e2e8f0', backgroundColor: dept === key ? '#0d7470' : 'white', color: dept === key ? 'white' : '#374151' }}>
              {label} <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
            {TYPE_FILTERS.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: typeFilter === t ? '#0d7470' : 'white', color: typeFilter === t ? 'white' : '#374151', transition: 'all 0.15s' }}>{t}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." style={{ width: '100%', paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: '14px' }}>Loading...</span></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Employee', 'Type', 'Department', 'Shift', 'Contact Info', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => {
                  const av = getAv(emp.user.name);
                  const present = isPresent(i);
                  return (
                    <tr key={emp.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: av.color, fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>{initials(emp.user.name)}</div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{emp.user.name}</p>
                            <p style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: emp.employmentType === 'Permanent' ? '#dbeafe' : '#f5f3ff', color: emp.employmentType === 'Permanent' ? '#1d4ed8' : '#6d28d9' }}>{emp.employmentType}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{emp.department ?? '—'}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', color: '#64748b' }}>{emp.shiftType ?? '—'}</span></td>
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontSize: '12px', color: '#374151' }}>{emp.user.email}</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8' }}>+91 XXXXX XXXXX</p>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: present ? '#16a34a' : '#dc2626' }} />
                          <span style={{ fontSize: '12px', color: present ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{present ? 'Present' : 'Absent'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Eye size={13} /></button>
                          <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Edit2 size={13} /></button>
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
    </div>
  );
}
