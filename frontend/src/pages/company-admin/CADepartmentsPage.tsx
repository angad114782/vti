import { useState, useEffect } from 'react';
import { caApi, type CADept } from '../../api/companyAdmin';
import { Loader2, Users, UserCheck, Building2 } from 'lucide-react';

const DEPT_COLORS = ['#6366f1', '#0d7470', '#7c3aed', '#ea580c', '#2563eb', '#16a34a', '#ec4899', '#f59e0b'];

export default function CADepartmentsPage() {
  const [depts, setDepts] = useState<CADept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caApi.getDepartments().then(({ data }) => setDepts(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalEmp = depts.reduce((s, d) => s + d.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Departments</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>View headcount and status across all departments</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#6366f1' }}>{depts.length}</p>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>Departments</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '10px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{totalEmp}</p>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>Total Employees</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#6366f1" /></div>
      ) : (
        <>
          {/* Visual bar comparison */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Headcount by Department</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {depts.map((d, idx) => {
                const pct    = totalEmp > 0 ? (d.total / totalEmp) * 100 : 0;
                const color  = DEPT_COLORS[idx % DEPT_COLORS.length]!;
                const actPct = d.total > 0 ? Math.round((d.active / d.total) * 100) : 0;
                return (
                  <div key={d.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{d.name}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>({d.active} active)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{pct.toFixed(1)}%</span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{d.total}</span>
                      </div>
                    </div>
                    <div style={{ height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '5px', opacity: 0.85 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {depts.map((d, idx) => {
              const color  = DEPT_COLORS[idx % DEPT_COLORS.length]!;
              const actPct = d.total > 0 ? Math.round((d.active / d.total) * 100) : 0;
              return (
                <div key={d.name} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', borderTop: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={17} color={color} />
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, color, backgroundColor: `${color}15`, padding: '3px 8px', borderRadius: '20px' }}>{actPct}% active</span>
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{d.name}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '7px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><Users size={11} color="#94a3b8" /><span style={{ fontSize: '10px', color: '#94a3b8' }}>Total</span></div>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{d.total}</span>
                    </div>
                    <div style={{ backgroundColor: '#f0fdf4', borderRadius: '7px', padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><UserCheck size={11} color="#16a34a" /><span style={{ fontSize: '10px', color: '#94a3b8' }}>Active</span></div>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{d.active}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
