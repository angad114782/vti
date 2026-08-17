import { useState } from 'react';
import { toast } from 'sonner';
import { extractError } from '../../utils/errorUtils';
import { Search, Plus, X, ChevronDown, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import PaginationBar from '../../components/data/Pagination';
import { useEmployees } from '../../hooks/queries/useHrQueries';
import { useHrDepartments } from '../../hooks/queries/useHrQueries';
import { useCreateEmployee } from '../../hooks/mutations/useHrMutations';

const DEPTS = ['All', 'Engineering', 'Operations', 'HR', 'Finance', 'Sales', 'Support'];

interface AddEmpForm {
  name: string; dept: string; designation: string; email: string; type: string; joined: string;
}
const EMPTY_FORM: AddEmpForm = { name: '', dept: '', designation: '', email: '', type: 'Permanent', joined: '' };

const ini = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function CAWorkforcePage() {
  const [tab,        setTab]        = useState<'overview' | 'list'>('overview');
  const [deptFilter, setDeptFilter] = useState('All');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const limit = 20;
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState<AddEmpForm>(EMPTY_FORM);
  const [addError,   setAddError]   = useState('');
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied,     setCopied]     = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const empParams: Record<string, string> = { page: String(page), limit: String(limit) };
  if (debouncedSearch) empParams.search = debouncedSearch;
  if (deptFilter !== 'All') empParams.department = deptFilter;

  const { data: empData, isLoading: loading } = useEmployees(empParams);
  const { data: deptsData } = useHrDepartments();
  const createEmployee = useCreateEmployee();

  const employees  = empData?.employees  ?? [];
  const stats      = empData?.stats      ?? { total: 0, active: 0, inactive: 0, departments: 0 };
  const pagination = empData?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };
  const depts      = deptsData           ?? [];

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleDeptFilter   = (d: string) => { setDeptFilter(d); setPage(1); };

  const handleAddEmployee = () => {
    if (!form.name || !form.email) { setAddError('Name and email are required'); return; }
    setAddError('');
    createEmployee.mutate(
      {
        name: form.name,
        email: form.email,
        department: form.dept,
        designation: form.designation,
        joiningDate: form.joined,
        employmentType: form.type,
      },
      {
        onSuccess: (data) => {
          setShowAdd(false);
          setForm(EMPTY_FORM);
          setCredentials({ name: form.name, email: form.email, password: (data as any).generatedPassword ?? '' });
          toast.success('Employee created');
        },
        onError: (err) => {
          setAddError(extractError(err, 'Failed to create employee'));
        },
      },
    );
  };

  const handleCopyPassword = () => {
    if (!credentials) return;
    void navigator.clipboard.writeText(credentials.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxBar = Math.max(...depts.map((d) => d.count), 1);

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

      {loading && tab === 'overview' ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#0d7470" /></div>
      ) : tab === 'overview' ? (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total Employees', value: stats.total,       color: '#0d7470' },
              { label: 'Active',          value: stats.active,      color: '#2563eb' },
              { label: 'Inactive',        value: stats.inactive,    color: '#d97706' },
              { label: 'Departments',     value: stats.departments, color: '#6366f1' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '4px' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Dept bar chart */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Headcount by Department</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {depts.map((d) => (
                <div key={d.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>{d.name}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{d.count}</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${(d.count / maxBar) * 100}%`, height: '100%', backgroundColor: '#0d7470' }} />
                  </div>
                </div>
              ))}
              {depts.length === 0 && <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>No department data available</p>}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DEPTS.map((d) => (
                <button key={d} onClick={() => handleDeptFilter(d)} style={{ padding: '5px 11px', borderRadius: '20px', border: `1px solid ${deptFilter === d ? '#0d7470' : '#e2e8f0'}`, backgroundColor: deptFilter === d ? '#0d7470' : 'white', color: deptFilter === d ? 'white' : '#374151', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {d}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search employee…" style={{ paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#374151', width: '180px' }} />
              </div>
              <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                <Plus size={13} /> Add Employee
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#0d7470" /></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    {['ID', 'Name', 'Department', 'Designation', 'Type', 'Joined', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e, i) => (
                    <tr key={e.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', borderBottom: '1px solid #f1f5f9' }}>{e.employeeId}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#0d7470', flexShrink: 0 }}>{ini(e.user.name)}</div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{e.user.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{e.department ?? '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: '12px', color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{e.designation ?? '—'}</td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: e.employmentType === 'Permanent' ? '#eff6ff' : '#fef3c7', color: e.employmentType === 'Permanent' ? '#2563eb' : '#d97706' }}>{e.employmentType}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                        {e.joiningDate ? new Date(e.joiningDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, backgroundColor: e.status === 'Active' ? '#f0fdf4' : '#fef2f2', color: e.status === 'Active' ? '#16a34a' : '#dc2626' }}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>No employees found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <PaginationBar page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} limit={limit} onPageChange={(p) => setPage(p)} />
        </>
      )}

      {/* Add Employee Slide-in Panel */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
          <div onClick={() => setShowAdd(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '380px', backgroundColor: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Add Employee</h2>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>A login password will be auto-generated</p>
              </div>
              <button onClick={() => { setShowAdd(false); setAddError(''); setForm(EMPTY_FORM); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} color="#64748b" /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {addError && <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '12px', marginBottom: '14px' }}>{addError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {([
                  { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Rahul Sharma' },
                  { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'rahul@company.com' },
                  { label: 'Designation', key: 'designation', type: 'text', placeholder: 'Software Engineer' },
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
              <button onClick={() => { setShowAdd(false); setAddError(''); setForm(EMPTY_FORM); }} style={{ flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={handleAddEmployee} disabled={createEmployee.isPending} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: '8px', backgroundColor: createEmployee.isPending ? '#94a3b8' : '#0d7470', color: 'white', fontSize: '12px', fontWeight: 600, cursor: createEmployee.isPending ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {createEmployee.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {credentials && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <CheckCircle2 size={22} color="#16a34a" />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Employee Created</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '20px' }}>
                Share these credentials with the new employee. The password <strong>cannot be recovered</strong> after this dialog is closed.
              </p>
            </div>
            <div style={{ margin: '0 24px', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '20px' }}>
              {[
                { label: 'Name', value: credentials.name },
                { label: 'Email', value: credentials.email },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', padding: '11px 16px', borderBottom: '1px solid #f1f5f9', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', width: '70px', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', padding: '11px 16px', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', width: '70px', flexShrink: 0 }}>Password</span>
                <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 500, fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{credentials.password}</span>
                <button onClick={handleCopyPassword} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: copied ? '#f0fdf4' : 'white', color: copied ? '#16a34a' : '#374151', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  <Copy size={11} />{copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <button onClick={() => { setCredentials(null); setCopied(false); }} style={{ width: '100%', padding: '11px', backgroundColor: '#0d7470', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
