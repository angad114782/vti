import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Shift {
  id: number; name: string; start: string; end: string; days: string[]; grace: number;
}

const INIT_SHIFTS: Shift[] = [
  { id: 1, name: 'Morning Shift',   start: '06:00', end: '14:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], grace: 15 },
  { id: 2, name: 'Afternoon Shift', start: '14:00', end: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], grace: 10 },
  { id: 3, name: 'Night Shift',     start: '22:00', end: '06:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], grace: 10 },
];

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY_SHIFT: Omit<Shift, 'id'> = { name: '', start: '', end: '', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], grace: 10 };

export default function CACompanySettingsPage() {
  const [company, setCompany] = useState({
    name:     'Vook Tech Btrewal',
    industry: 'Technology',
    address:  '3rd Floor, Tower B, Sector 62, Noida, UP 201309',
    phone:    '+91 98765 43210',
    email:    'admin@vooktech.com',
    website:  'https://vooktech.com',
    gstin:    '09AAGCV1234A1Z5',
    pan:      'AAGCV1234A',
  });

  const [shifts, setShifts] = useState<Shift[]>(INIT_SHIFTS);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState<Omit<Shift, 'id'>>(EMPTY_SHIFT);

  const openAdd = () => { setEditShift(null); setShiftForm(EMPTY_SHIFT); setShowShiftModal(true); };
  const openEdit = (s: Shift) => { setEditShift(s); setShiftForm({ name: s.name, start: s.start, end: s.end, days: [...s.days], grace: s.grace }); setShowShiftModal(true); };
  const saveShift = () => {
    if (editShift) {
      setShifts((p) => p.map((s) => s.id === editShift.id ? { ...s, ...shiftForm } : s));
    } else {
      setShifts((p) => [...p, { id: Date.now(), ...shiftForm }]);
    }
    setShowShiftModal(false);
  };
  const deleteShift = (id: number) => setShifts((p) => p.filter((s) => s.id !== id));
  const toggleDay = (d: string) => setShiftForm((p) => ({ ...p, days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Company Settings</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Manage company profile, shifts, and configuration.</p>
      </div>

      {/* Company Profile */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Company Profile</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {([
            { label: 'Company Name',   key: 'name',     type: 'text' },
            { label: 'Industry',       key: 'industry', type: 'text' },
            { label: 'Phone Number',   key: 'phone',    type: 'text' },
            { label: 'Email Address',  key: 'email',    type: 'email' },
            { label: 'Website',        key: 'website',  type: 'text' },
            { label: 'GSTIN',          key: 'gstin',    type: 'text' },
            { label: 'PAN',            key: 'pan',      type: 'text' },
          ] as const).map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</label>
              <input type={type} value={company[key]} onChange={(e) => setCompany((p) => ({ ...p, [key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} onFocus={(e) => (e.target.style.borderColor = '#0d7470')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
            </div>
          ))}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Address</label>
            <textarea value={company.address} onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', resize: 'vertical', boxSizing: 'border-box' }} onFocus={(e) => (e.target.style.borderColor = '#0d7470')} onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')} />
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ padding: '8px 18px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save Company Profile</button>
        </div>
      </div>

      {/* Shift Definitions */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Shift Definitions</h3>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Plus size={12} /> Add Shift
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              {['Shift Name', 'Start Time', 'End Time', 'Working Days', 'Grace (min)', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts.map((s, i) => (
              <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '11px 16px', fontSize: '12px', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9' }}>{s.name}</td>
                <td style={{ padding: '11px 16px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{s.start}</td>
                <td style={{ padding: '11px 16px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{s.end}</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {s.days.map((d) => <span key={d} style={{ padding: '1px 5px', backgroundColor: '#f0fdfa', color: '#0d7470', fontSize: '9px', fontWeight: 700, borderRadius: '3px' }}>{d}</span>)}
                  </div>
                </td>
                <td style={{ padding: '11px 16px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{s.grace} min</td>
                <td style={{ padding: '11px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d7470' }}><Edit2 size={13} /></button>
                    <button onClick={() => deleteShift(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shift Modal */}
      {showShiftModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'relative', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', width: '380px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{editShift ? 'Edit Shift' : 'Add Shift'}</h2>
              <button onClick={() => setShowShiftModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Shift Name</label>
                <input value={shiftForm.name} onChange={(e) => setShiftForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Morning Shift" style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Start Time</label>
                  <input type="time" value={shiftForm.start} onChange={(e) => setShiftForm((p) => ({ ...p, start: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>End Time</label>
                  <input type="time" value={shiftForm.end} onChange={(e) => setShiftForm((p) => ({ ...p, end: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>Working Days</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {ALL_DAYS.map((d) => (
                    <button key={d} onClick={() => toggleDay(d)} style={{ flex: 1, padding: '5px 2px', borderRadius: '6px', border: `1.5px solid ${shiftForm.days.includes(d) ? '#0d7470' : '#e2e8f0'}`, backgroundColor: shiftForm.days.includes(d) ? '#0d7470' : 'white', color: shiftForm.days.includes(d) ? 'white' : '#94a3b8', fontSize: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Grace Period (minutes)</label>
                <input type="number" value={shiftForm.grace} onChange={(e) => setShiftForm((p) => ({ ...p, grace: Number(e.target.value) }))} min={0} max={60} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={() => setShowShiftModal(false)} style={{ flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={saveShift} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '8px', backgroundColor: '#0d7470', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save Shift</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
