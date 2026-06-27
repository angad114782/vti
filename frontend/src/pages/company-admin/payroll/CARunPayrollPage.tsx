import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Users, Home, Download } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS  = ['2024','2025','2026'];

interface Toggle { label: string; enabled: boolean }

const INIT_TOGGLES: Toggle[] = [
  { label: 'Overtime',         enabled: true  },
  { label: 'Bonus',            enabled: true  },
  { label: 'Travel Expense',   enabled: false },
  { label: 'Accommodation',    enabled: true  },
  { label: 'Food Expense',     enabled: false },
];

function StepCircle({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `2px solid ${done || active ? '#0d7470' : '#e2e8f0'}`, backgroundColor: done ? '#0d7470' : active ? 'white' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {done
          ? <CheckCircle2 size={18} color="white" fill="#0d7470" />
          : <span style={{ fontSize: '13px', fontWeight: 700, color: active ? '#0d7470' : '#94a3b8' }}>{n}</span>
        }
      </div>
      <span style={{ fontSize: '10px', fontWeight: active ? 700 : 500, color: active ? '#0d7470' : '#94a3b8', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return <div style={{ flex: 1, height: '2px', backgroundColor: done ? '#0d7470' : '#e2e8f0', marginBottom: '18px' }} />;
}

export default function CARunPayrollPage() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(1);
  const [month,   setMonth]   = useState('February');
  const [year,    setYear]    = useState('2026');
  const [empType, setEmpType] = useState<'permanent' | 'contract'>('permanent');
  const [toggles, setToggles] = useState<Toggle[]>(INIT_TOGGLES);
  const [locked,  setLocked]  = useState(false);

  const toggleItem = (i: number) =>
    setToggles((p) => p.map((t, idx) => idx === i ? { ...t, enabled: !t.enabled } : t));

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151',
    backgroundColor: 'white', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', cursor: 'pointer',
  };

  if (locked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '0' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f0fdf4', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={32} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Payroll Locked Successfully!</h2>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{month} {year} payroll has been processed. You can now generate payslips.</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
            <button
              onClick={() => navigate('/company-admin/payroll/payslips')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              <Download size={15} /> Generate Payslips
            </button>
            <button
              onClick={() => navigate('/company-admin/payroll/overview')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: 'white', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              <Home size={15} /> Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Configure Payroll Run</h1>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Select the parameters for this payroll cycle.</p>
      </div>

      {/* Step wizard */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', padding: '0 8px' }}>
        <StepCircle n={1} label="Configure Period" active={step === 1} done={step > 1} />
        <StepLine done={step > 1} />
        <StepCircle n={2} label="Review & Edit"    active={step === 2} done={step > 2} />
        <StepLine done={step > 2} />
        <StepCircle n={3} label="Validate & Lock"  active={step === 3} done={false} />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={selectStyle}>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
                {YEARS.map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Employee Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setEmpType('permanent')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: `2px solid ${empType === 'permanent' ? '#0d7470' : '#e2e8f0'}`, borderRadius: '10px', backgroundColor: empType === 'permanent' ? '#0d7470' : 'white', color: empType === 'permanent' ? 'white' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                <Users size={15} /> Permanent Staff
              </button>
              <button
                onClick={() => setEmpType('contract')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: `2px solid ${empType === 'contract' ? '#0d7470' : '#e2e8f0'}`, borderRadius: '10px', backgroundColor: empType === 'contract' ? '#0d7470' : 'white', color: empType === 'contract' ? 'white' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                <Users size={15} /> Contract Workers
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            style={{ width: '100%', padding: '13px', backgroundColor: '#0d4a47', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Generate Payroll Preview →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            {month} {year} — {empType === 'permanent' ? 'Permanent Staff' : 'Contract Workers'}
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Enable or disable components before finalising.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {toggles.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < toggles.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{t.label}</span>
                <button
                  onClick={() => toggleItem(i)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', backgroundColor: t.enabled ? '#0d7470' : '#cbd5e1', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: '3px', left: t.enabled ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={() => setStep(1)} style={{ padding: '12px 20px', border: '1.5px solid #e2e8f0', borderRadius: '10px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Back</button>
            <button onClick={() => setStep(3)} style={{ flex: 1, padding: '12px', backgroundColor: '#0d4a47', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Proceed to Validate & Lock →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Validate & Lock Payroll</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Review the summary below. Once locked, payroll cannot be edited.</p>

          <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Period',        value: `${month} ${year}` },
                { label: 'Employee Type', value: empType === 'permanent' ? 'Permanent Staff' : 'Contract Workers' },
                { label: 'Components',    value: toggles.filter((t) => t.enabled).map((t) => t.label).join(', ') },
                { label: 'Payroll Cost',  value: '₹4,85,250' },
                { label: 'Net Payable',   value: '₹4,12,450' },
                { label: 'Total Deductions', value: '₹72,800' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600, marginTop: '3px' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>⚠ Once you lock the payroll, no further edits can be made for this cycle.</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setStep(2)} style={{ padding: '12px 20px', border: '1.5px solid #e2e8f0', borderRadius: '10px', backgroundColor: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Back</button>
            <button
              onClick={() => setLocked(true)}
              style={{ flex: 1, padding: '12px', backgroundColor: '#0d4a47', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              🔒 Lock & Process Payroll
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
