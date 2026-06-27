import { useState } from 'react';
import { Search, Plus, X, ChevronDown } from 'lucide-react';

const DEPTS = ['All', 'Engineering', 'Operations', 'HR', 'Finance', 'Sales', 'Support'];

const EMPLOYEES = [
  { id: 'EMP-001', name: 'Rohan Verma',    dept: 'Engineering', role: 'Senior Engineer',    status: 'Active', type: 'Permanent', joined: '2022-03-10' },
  { id: 'EMP-002', name: 'Priya Singh',    dept: 'HR',          role: 'HR Manager',         status: 'Active', type: 'Permanent', joined: '2021-07-14' },
  { id: 'EMP-003', name: 'Amit Patel',     dept: 'Finance',     role: 'Finance Analyst',    status: 'Active', type: 'Permanent', joined: '2023-01-22' },
  { id: 'EMP-004', name: 'Sneha Mehta',    dept: 'Operations',  role: 'Ops Lead',           status: 'Active', type: 'Contract',  joined: '2022-11-05' },
  { id: 'EMP-005', name: 'Karan Joshi',    dept: 'Sales',       role: 'Sales Executive',    status: 'Active', type: 'Permanent', joined: '2023-06-18' },
  { id: 'EMP-006', name: 'Divya Sharma',   dept: 'Support',     role: 'Support Specialist', status: 'Active', type: 'Permanent', joined: '2022-09-01' },
  { id: 'EMP-007', name: 'Vikram Nair',    dept: 'Engineering', role: 'Junior Engineer',    status: 'Inactive', type: 'Contract', joined: '2023-03-15' },
  { id: 'EMP-008', name: 'Ananya Rao',     dept: 'Sales',       role: 'Sales Manager',      status: 'Active', type: 'Permanent', joined: '2021-12-20' },
];

const DEPT_BARS = [
  { name: 'Engineering', perm: 220, contract: 90 },
  { name: 'Operations',  perm: 180, contract: 100 },
  { name: 'Sales',       perm: 140, contract: 45 },
  { name: 'Support',     perm: 95,  contract: 15 },
  { name: 'Finance',     perm: 50,  contract: 5 },
  { name: 'HR',          perm: 35,  contract: 7 },
];
const maxBar = 310;

const OVERVIEW_STATS = [
  { label: 'Total Employees', value: '982', color: '#0d7470' },
  { label: 'Permanent',       value: '720', color: '#2563eb' },
  { label: 'Contract',        value: '262', color: '#d97706' },
  { label: 'Departments',     value: '6',   color: '#6366f1' },
];

interface AddEmpForm {
  name: string; dept: string; role: string; email: string; type: string; joined: string;
}

const EMPTY_FORM: AddEmpForm = { name: '', dept: '', role: '', email: '', type: 'Permanent', joined: '' };

export default function CAWorkforcePage() {
  const [tab, setTab] = useState<'overview' | 'list'>('overview');
  const [deptFilter, setDeptFilter] = useState('All');
  const [search, setSearch]  = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddEmpForm>(EMPTY_FORM);

  const filtered = EMPLOYEES.filter((e) => {
    const matchDept = deptFilter === 'All' || e.dept === deptFilter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Workforce</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Manage your company's employees and organizational structure.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
        {(['overview', 'list'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#0d4a47' : '#64748b', boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            {t === 'overview' ? 'Overview' : 'Employee List'}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {OVERVIEW_STATS.map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Dept bar chart */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Headcount by Department</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[{ label: '■ Permanent', color: '#0d7470' }, { label: '■ Contract', color: '#60a5fa' }].map(({ label, color }) => (
                  <span key={label} style={{ fontSize: '10px', color, fontWeight: 600 }}>{label}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEPT_BARS.map((d) => (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>{d.name}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{d.perm + d.contract}</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(d.perm / maxBar) * 100}%`, height: '100%', backgroundColor: '#0d7470' }} />
                    <div style={{ width: `${(d.contract / maxBar) * 100}%`, height: '100%', backgroundColor: '#60a5fa' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DEPTS.map((d) => (
                <button key={d} onClick={() => setDeptFilter(d)} style={{ padding: '5px 11px', borderRadius: '20px', border: `1px solid ${deptFilter === d ? '#0d7470' : '#e2e8f0'}`, backgroundColor: deptFilter === d ? '#0d7470' : 'white', color: deptFilter === d ? 'white' : '#374151', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {d}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" style={{ paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', width: '180px' }} />
              </div>
              <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                <Plus size={13} /> Add Employee
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['ID', 'Name', 'Department', 'Role', 'Type', 'Joined', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9' }}>{e.id}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#0d7470', flexShrink: 0 }}>{e.name.split(' ').map((w) => w[0]).join('').toUpperCase()}</div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{e.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{e.dept}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{e.role}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: e.type === 'Permanent' ? '#eff6ff' : '#fef3c7', color: e.type === 'Permanent' ? '#2563eb' : '#d97706' }}>{e.type}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '11px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{new Date(e.joined).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: e.status === 'Active' ? '#f0fdf4' : '#fef2f2', color: e.status === 'Active' ? '#16a34a' : '#dc2626' }}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Employee Slide-in Panel */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setShowAdd(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '380px', backgroundColor: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Add Employee</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {([
                  { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Rahul Sharma' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'rahul@company.com' },
                  { label: 'Role / Designation', key: 'role', type: 'text', placeholder: 'Software Engineer' },
                  { label: 'Date of Joining', key: 'joined', type: 'date', placeholder: '' },
                ] as const).map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{label}</label>
                    <input type={type} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Department</label>
                  <div style={{ position: 'relative' }}>
                    <select value={form.dept} onChange={(e) => setForm((p) => ({ ...p, dept: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', appearance: 'none', backgroundColor: 'white' }}>
                      <option value="">Select department</option>
                      {DEPTS.filter((d) => d !== 'All').map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Employment Type</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Permanent', 'Contract'].map((t) => (
                      <button key={t} onClick={() => setForm((p) => ({ ...p, type: t }))} style={{ flex: 1, padding: '8px', border: `1.5px solid ${form.type === t ? '#0d7470' : '#e2e8f0'}`, borderRadius: '7px', backgroundColor: form.type === t ? '#f0fdfa' : 'white', color: form.type === t ? '#0d7470' : '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '8px', backgroundColor: '#0d7470', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Add Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
