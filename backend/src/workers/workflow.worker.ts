import LeaveRequest from '../models/LeaveRequest';
import Expense from '../models/Expense';
import Approval from '../models/Approval';
import User from '../models/User';
import Notification from '../models/Notification';

let timer: NodeJS.Timeout | undefined;
let running = false;

async function notifyApprovers(companyId: unknown, role: string, entityType: string, entityId: unknown, title: string, message: string, dedupeKey: string) {
  const users = await User.find({ companyId, role, isActive: true } as any).select('_id').lean();
  if (!users.length) return;
  await Notification.bulkWrite(users.map((user) => ({
    updateOne: {
      filter: { companyId, dedupeKey: `${dedupeKey}:${user._id}` },
      update: { $setOnInsert: { userId: user._id, companyId, type: 'WORKFLOW', title, message, entityType, entityId, dedupeKey: `${dedupeKey}:${user._id}` } },
      upsert: true,
    },
  })) as any);
}

async function processCollection(Model: any, entityType: string) {
  const now = new Date();
  const records = await Model.find({ status: 'Pending', approvalDueAt: { $lte: now }, escalatedAt: { $exists: false } }).select('_id companyId pendingRole workflowType').limit(200).lean();
  for (const record of records) {
    const nextRole = record.pendingRole === 'SUPERVISOR' || record.pendingRole === 'MANAGER' ? 'HR' : 'COMPANY_ADMIN';
    const updated = await Model.findOneAndUpdate(
      { _id: record._id, status: 'Pending', escalatedAt: { $exists: false } },
      { $set: { pendingRole: nextRole, escalatedAt: now, approvalDueAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) } },
      { returnDocument: 'after' },
    ).lean();
    if (updated) await notifyApprovers(record.companyId, nextRole, entityType, record._id, 'Workflow approval escalated', `A ${entityType} request requires your approval after exceeding its deadline.`, `${entityType}:escalated:${record._id}`);
  }
}

export async function processWorkflowEscalations(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await processCollection(LeaveRequest, 'leave');
    await processCollection(Expense, 'expense');
    await processCollection(Approval, 'approval');
  } finally { running = false; }
}

export function startWorkflowWorker(intervalMs = 60_000): () => void {
  timer = setInterval(() => { void processWorkflowEscalations().catch((err) => console.error('Workflow worker failed:', err)); }, intervalMs);
  timer.unref();
  void processWorkflowEscalations().catch((err) => console.error('Workflow worker failed:', err));
  return () => { if (timer) clearInterval(timer); timer = undefined; };
}
