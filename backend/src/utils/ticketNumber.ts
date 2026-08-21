import Counter from '../models/Counter';

/** Allocates a ticket number without count-and-increment races. */
export async function nextSupportTicketNumber(now = new Date()): Promise<string> {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const counter = await Counter.findOneAndUpdate(
    { _id: `ticket:${datePart}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
  if (!counter?.seq) throw new Error('Unable to allocate support ticket number');
  return `TKT-${datePart}-${String(counter.seq).padStart(4, '0')}`;
}
