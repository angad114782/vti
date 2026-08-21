/**
 * One-time safe migration for the People & Organization redesign.
 * It only links an employee when an exact company-scoped Department name exists;
 * unmatched names are reported for administrator review and are never guessed.
 */
import mongoose from 'mongoose';
import Employee from '../models/Employee';
import Department from '../models/Department';

export async function migrateDepartmentReferences(): Promise<{ linked: number; unmatched: Array<{ companyId: string; name: string; count: number }> }> {
  const rows = await Employee.aggregate([{ $match: { departmentId: { $exists: false }, department: { $type: 'string', $ne: '' } } }, { $group: { _id: { companyId: '$companyId', name: '$department' }, count: { $sum: 1 } } }]);
  let linked = 0; const unmatched: Array<{ companyId: string; name: string; count: number }> = [];
  for (const row of rows) {
    const companyId = String(row._id.companyId); const name = String(row._id.name).trim();
    const department = await Department.findOne({ companyId, name }).select('_id').lean();
    if (!department) { unmatched.push({ companyId, name, count: row.count }); continue; }
    const result = await Employee.updateMany({ companyId, department: row._id.name, departmentId: { $exists: false } }, { $set: { departmentId: department._id } });
    linked += result.modifiedCount;
  }
  return { linked, unmatched };
}

if (process.argv[1]?.includes('migrateDepartmentReferences')) {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  mongoose.connect(uri).then(migrateDepartmentReferences).then((result) => { console.log(JSON.stringify(result, null, 2)); return mongoose.disconnect(); }).catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
}
