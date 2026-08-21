import { AlertTriangle, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useAccess } from '../../hooks/queries/useAccess';

const date = (value: string | null) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function SubscriptionBanner() {
  const { data } = useAccess();
  const subscription = data?.subscription;
  if (!subscription || subscription.state === 'UNKNOWN') return null;

  if (subscription.state === 'ACTIVE') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', fontSize: 12 }}>
        <CheckCircle2 size={14} />
        <span><strong>{subscription.plan ?? 'Current plan'}</strong> active · expires {date(subscription.planExpiry)} ({subscription.daysRemaining} days remaining)</span>
      </div>
    );
  }

  const grace = subscription.state === 'GRACE_PERIOD';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: grace ? '#fff7ed' : '#fef2f2', borderBottom: `1px solid ${grace ? '#fed7aa' : '#fecaca'}`, color: grace ? '#9a3412' : '#991b1b', fontSize: 12 }}>
      {grace ? <AlertTriangle size={16} /> : <LockKeyhole size={16} />}
      <div style={{ flex: 1 }}>
        <strong>{grace ? 'Subscription grace period' : subscription.state === 'SUSPENDED' ? 'Account suspended' : 'Subscription expired'}</strong>
        <span style={{ marginLeft: 6 }}>
          {grace ? `Read-only mode. Renew by ${date(subscription.gracePeriodEnd)} (${subscription.daysRemaining} days remaining).` : 'Your account is locked until the plan is renewed.'}
        </span>
      </div>
      <span style={{ fontWeight: 700 }}>Contact Super Admin to renew</span>
    </div>
  );
}
