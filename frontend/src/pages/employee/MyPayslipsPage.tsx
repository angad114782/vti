import { useState, useEffect } from 'react';
import { employeeApi, type MyPayslip } from '../../api/employee';
import { Eye, Download, Loader2, TrendingUp } from 'lucide-react';

const STATUS_META: Record<string, { bg: string; color: string }> = {
  Paid:       { bg: '#dcfce7', color: '#15803d' },
  Processing: { bg: '#fef9c3', color: '#854d0e' },
  Pending:    { bg: '#f1f5f9', color: '#475569' },
};

const fmtPay = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<MyPayslip[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    employeeApi.getPayslips().then(({ data }) => setPayslips(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const latestPaid = payslips.find((p) => p.status === 'Paid');
  const totalYTD   = payslips.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.netPay, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>My Payslips</h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>View and download your monthly salary statements</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div style={{ backgroundColor: '#0d4a47', borderRadius: '12px', padding: '18px 20px', color: 'white' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Latest Net Pay</p>
          <p style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px' }}>{latestPaid ? fmtPay(latestPaid.netPay) : '—'}</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>{latestPaid?.period ?? 'No paid payslip'}</p>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total Earned YTD</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{fmtPay(totalYTD)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={12} color="#16a34a" />
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>+4.2% vs last year</span>
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total Payslips</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{payslips.length}</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{payslips.filter((p) => p.status === 'Paid').length} paid</p>
        </div>
      </div>

      {/* Net pay trend - mini SVG */}
      {payslips.length >= 2 && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Net Pay Trend</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            {[...payslips].reverse().map((p, _i, arr) => {
              const max = Math.max(...arr.map((x) => x.netPay));
              const pct = (p.netPay / max) * 100;
              return (
                <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#0d7470' }}>{fmtPay(p.netPay)}</span>
                  <div style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'flex-end', padding: '0 3px', boxSizing: 'border-box' }}>
                    <div style={{ width: '100%', height: `${pct}%`, backgroundColor: p.status === 'Processing' ? '#fcd34d' : '#0d7470', borderRadius: '3px 3px 0 0', opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>{p.period.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payslip table */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>All Payslips</h3>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#0d7470" /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                {['Payslip ID', 'Period', 'Net Pay', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payslips.map((p, i) => {
                const sm = STATUS_META[p.status] ?? STATUS_META['Pending']!;
                return (
                  <tr key={p.id} style={{ borderBottom: i < payslips.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '13px', fontWeight: 700, color: '#0d7470', fontFamily: 'monospace' }}>{p.payslipId}</span></td>
                    <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '13px', color: '#374151' }}>{p.period}</span></td>
                    <td style={{ padding: '14px 20px' }}><span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{fmtPay(p.netPay)}</span></td>
                    <td style={{ padding: '14px 20px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: sm.bg, color: sm.color }}>{p.status}</span></td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button style={{ width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><Eye size={13} /></button>
                        <button disabled={p.status !== 'Paid'} style={{ width: '30px', height: '30px', borderRadius: '7px', border: 'none', backgroundColor: p.status === 'Paid' ? '#0d7470' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: p.status === 'Paid' ? 'pointer' : 'not-allowed', opacity: p.status !== 'Paid' ? 0.5 : 1 }}><Download size={13} color={p.status === 'Paid' ? 'white' : '#94a3b8'} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {payslips.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>No payslips found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
