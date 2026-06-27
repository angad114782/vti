import { useState } from 'react';
import { Search, Edit2, X } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPLOYEES = [
  { id: 'PER-2024-001', name: 'Rohan Verma',    role: 'Senior Engineer',    type: 'Permanent', ctc: 950000,  revised: 'Jan, 2025' },
  { id: 'PER-2024-002', name: 'Priya Singh',    role: 'HR Manager',         type: 'Permanent', ctc: 800000,  revised: 'Jan, 2025' },
  { id: 'CON-2024-003', name: 'Amit Patel',     role: 'Finance Analyst',    type: 'Contract',  ctc: 750000,  revised: 'Mar, 2025' },
  { id: 'PER-2024-004', name: 'Sneha Mehta',    role: 'Ops Lead',           type: 'Permanent', ctc: 650000,  revised: 'Jan, 2025' },
  { id: 'CON-2024-005', name: 'Karan Joshi',    role: 'Sales Executive',    type: 'Contract',  ctc: 580000,  revised: 'Feb, 2025' },
  { id: 'PER-2024-006', name: 'Divya Sharma',   role: 'Support Specialist', type: 'Permanent', ctc: 520000,  revised: 'Jan, 2025' },
  { id: 'PER-2024-007', name: 'Ananya Rao',     role: 'Sales Manager',      type: 'Permanent', ctc: 880000,  revised: 'Jan, 2025' },
  { id: 'CON-2024-008', name: 'Vikram Nair',    role: 'Junior Engineer',    type: 'Contract',  ctc: 480000,  revised: 'Apr, 2025' },
  { id: 'PER-2024-009', name: 'Alex Johnson',   role: 'Line Supervisor',    type: 'Permanent', ctc: 450000,  revised: 'Jan, 2025' },
  { id: 'CON-2024-010', name: 'Meera Iyer',     role: 'Line Supervisor',    type: 'Contract',  ctc: 450000,  revised: 'Jan, 2025' },
];

const fmtCTC = (n: number) => `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, '')}L` + ' (' + `₹${(n / 12000).toFixed(0)}k/mo` + ')';

export default function CASalaryStructurePage() {
  const [search,  setSearch]  = useState('');
  const [month,   setMonth]   = useState('February');
  const [editEmp, setEditEmp] = useState<typeof EMPLOYEES[0] | null>(null);
  const [editCTC, setEditCTC] = useState('');

  const filtered = EMPLOYEES.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (e: typeof EMPLOYEES[0]) => {
    setEditEmp(e);
    setEditCTC(String(e.ctc));
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 28px 8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151',
    backgroundColor: 'white', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Salary Structure</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>View and update employee CTC and salary components.</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              style={{ paddingLeft: '30px', paddingRight: '10px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', width: '200px' }}
            />
          </div>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
            {MONTHS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} employees</span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['EMPLOYEE', 'ROLE', 'TYPE', 'ANNUAL CTC', 'LAST REVISED', 'ACTIONS'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{e.name}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' }}>{e.id}</p>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{e.role}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, border: `1px solid ${e.type === 'Permanent' ? '#0d7470' : '#d97706'}`, color: e.type === 'Permanent' ? '#0d7470' : '#d97706', backgroundColor: 'white' }}>
                    {e.type}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>₹{e.ctc.toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#0d7470', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{e.revised}</td>
                <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <button onClick={() => openEdit(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d7470', display: 'flex', alignItems: 'center' }}>
                    <Edit2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick actions */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>QUICK ACTIONS</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Download Payroll', 'Manage Roles'].map((label) => (
            <button key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid #0d7470' }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Edit CTC Modal */}
      {editEmp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setEditEmp(null)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'relative', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Edit Salary — {editEmp.name}</h2>
              <button onClick={() => setEditEmp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Annual CTC (₹)</label>
                <input type="number" value={editCTC} onChange={(e) => setEditCTC(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} onFocus={(e) => (e.target.style.borderColor = '#0d7470')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
                {editCTC && <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Monthly: ₹{Math.round(Number(editCTC) / 12).toLocaleString('en-IN')}</p>}
              </div>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ fontSize: '11px', color: '#64748b' }}>Role: <strong style={{ color: '#374151' }}>{editEmp.role}</strong></p>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>Type: <strong style={{ color: '#374151' }}>{editEmp.type}</strong></p>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>Last Revised: <strong style={{ color: '#0d7470' }}>{editEmp.revised}</strong></p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={() => setEditEmp(null)} style={{ flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => setEditEmp(null)} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '8px', backgroundColor: '#0d7470', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
