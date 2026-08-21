import Counter from '../models/Counter';

/** Allocates the next company code atomically. Gaps are acceptable if creation later fails. */
export const nextCompanyCode = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'company' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  if (!counter?.seq) throw new Error('Unable to allocate company code');
  return `CMP-${String(counter.seq).padStart(6, '0')}`;
};
