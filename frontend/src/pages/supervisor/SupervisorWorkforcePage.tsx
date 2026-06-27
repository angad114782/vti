import { useState, useEffect, useCallback } from 'react';
import { hrApi, type Employee } from '../../api/hr';
import { Search, Plus, Eye, Edit2, Loader2, X, ChevronDown } from 'lucide-react';

const DEPT_TABS = [
  { key: 'ALL',         label: 'All',         count: 8 },
  { key: 'Assembly',    label: 'Assembly',     count: 4 },
  { key: 'Quality',     label: 'Quality',      count: 2 },
  { key: 'Maintenance', label: 'Maintenance',  count: 2 },
];

const avatarColors = [
  { bg: '#eef2ff', color: '#6366f1' }, { bg: '#f0fdf4', color: '#10b981' },
  { bg: '#fffbeb', color: '#f59e0b' }, { bg: '#fdf4ff', color: '#ec4899' },
  { bg: '#f0f9ff', color: '#0ea5e9' },
];
const getAv = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length]!;
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const PRESENT_CACHE: Record<number, boolean> = {};
const isPresent = (idx: number) => {
  if (!(idx in PRESENT_CACHE)) PRESENT_CACHE[idx] = Math.random() > 0.3;
  return PRESENT_CACHE[idx]!;
};

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#0f172a', backgroundColor: 'white' };
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block' };

function AddEmployeePanel({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', width: '460px', height: '100%', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Add Employee</h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Create a new contract workforce profile</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Basic Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0d7470' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Basic Details</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={labelStyle}>Full Name *</label><input placeholder="e.g. Ankita Yadav" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={labelStyle}>Employee ID *</label><input placeholder="EMP-001" style={inputStyle} /></div>
                <div><label style={labelStyle}>Date of Joining *</label><input type="date" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={labelStyle}>Mobile Number *</label><input placeholder="+91 12345 67890" style={inputStyle} /></div>
                <div><label style={labelStyle}>Email Address</label><input type="email" placeholder="Optional" style={inputStyle} /></div>
              </div>
            </div>
          </div>
          {/* Work Assignment */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0d7470' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Work Assignment</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={labelStyle}>Department / Unit</label>
                  <div style={{ position: 'relative' }}>
                    <select style={{ ...inputStyle, appearance: 'none', paddingRight: '28px' }}><option>Designing</option><option>Assembly</option><option>Quality</option></select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div><label style={labelStyle}>Role / Designation</label><input placeholder="e.g. UI/UX Designer" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={labelStyle}>Shift Type *</label>
                  <div style={{ position: 'relative' }}>
                    <select style={{ ...inputStyle, appearance: 'none', paddingRight: '28px' }}><option>Morning</option><option>Evening</option><option>Night</option></select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>
                <div><label style={labelStyle}>Shift Timing</label><input placeholder="08:00 - 06:00 PM" style={inputStyle} /></div>
              </div>
            </div>
          </div>
          {/* Bank Account Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0d7470' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Bank Account Details</h4>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Link bank account for salary processing</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label style={labelStyle}>Account Holder Name *</label><input placeholder="As per bank records" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label style={labelStyle}>Bank Name *</label><input placeholder="e.g. HDFC Bank" style={inputStyle} /></div>
                <div><label style={labelStyle}>Branch Name</label><input style={inputStyle} /></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', justifyContent: 'flex-end', position: 'sticky', bottom: 0, backgroundColor: 'white' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
          <button style={{ padding: '9px 22px', backgroundColor: '#0d7470', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>+ Add Employee</button>
        </div>
      </div>
    </div>
  );
}

export default function SupervisorWorkforcePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);

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

  const total = employees.length;
  const permanent = employees.filter((e) => e.employmentType === 'Permanent').length;
  const contract = employees.filter((e) => e.employmentType === 'Contract').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Employee List</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Manage and track all employees information</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: '#0d7470', border: 'none', borderRadius: '9px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '24px' }}>
        {[{ label: 'Total Workers', value: total }, { label: 'Permanent', value: permanent }, { label: 'Contract', value: contract }].map(({ label, value }) => (
          <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 20px', minWidth: '100px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Dept tabs */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {DEPT_TABS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setDept(key)} style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif', borderColor: dept === key ? '#0d7470' : '#e2e8f0', backgroundColor: dept === key ? '#0d7470' : 'white', color: dept === key ? 'white' : '#374151' }}>
              {label} {count}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." style={{ paddingLeft: '32px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', backgroundColor: '#f8fafc', width: '200px' }} />
          </div>
          <button style={{ padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Permanent</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '10px', color: '#64748b' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /><span style={{ fontSize: '14px' }}>Loading...</span></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['Employee', 'Type', 'Department', 'Shift', 'Contact Information', 'Status', 'Actions'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => {
                  const av = getAv(emp.user.name);
                  const present = isPresent(i);
                  return (
                    <tr key={emp.id} style={{ borderBottom: i < employees.length - 1 ? '1px solid #f8fafc' : 'none' }}>
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
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: emp.employmentType === 'Permanent' ? '#dbeafe' : '#fef9c3', color: emp.employmentType === 'Permanent' ? '#1d4ed8' : '#854d0e' }}>{emp.employmentType}</span>
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

      {showAdd && <AddEmployeePanel onClose={() => setShowAdd(false)} />}
    </div>
  );
}
