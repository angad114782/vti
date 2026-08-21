import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './utils/db';
import Employee from './models/Employee';
import PayrollRun from './models/PayrollRun';
import Payslip from './models/Payslip';
import SalaryStructure from './models/SalaryStructure';
import LeaveRequest from './models/LeaveRequest';
import LeaveLedger from './models/LeaveLedger';
import LeaveBalance from './models/LeaveBalance';
import IdempotencyKey from './models/IdempotencyKey';
import EmployeeHistory from './models/EmployeeHistory';
import Attendance from './models/Attendance';
import Company from './models/Company';
import Module from './models/Module';
import CompanyModule from './models/CompanyModule';
import RolePermission from './models/RolePermission';
import Plan from './models/Plan';
import Subscription from './models/Subscription';
import { nextCompanyCode } from './utils/companyCode';
import User from './models/User';
import Document from './models/Document';
import SupportTicket from './models/SupportTicket';
import Counter from './models/Counter';
import PlatformSetting from './models/PlatformSetting';
import Office from './models/Office';
import Department from './models/Department';
import Holiday from './models/Holiday';
import AttendancePolicy from './models/AttendancePolicy';

async function migrate(): Promise<void> {
  await connectDB();
  // Assign the same short, immutable references to companies created before
  // companyCode was introduced. Existing codes are preserved.
  const companiesWithoutCode = await Company.find({ companyCode: { $exists: false } }).sort({ createdAt: 1, _id: 1 }).select('_id').lean();
  for (const company of companiesWithoutCode) {
    await Company.updateOne({ _id: company._id, companyCode: { $exists: false } }, { $set: { companyCode: await nextCompanyCode() } });
  }
  await Promise.all([Company.syncIndexes(), User.syncIndexes(), Document.syncIndexes(), SupportTicket.syncIndexes(), Counter.syncIndexes(), PlatformSetting.syncIndexes(), Office.syncIndexes(), Department.syncIndexes(), Holiday.syncIndexes(), AttendancePolicy.syncIndexes()]);
  // Backfill normalized search fields for records created before search indexes.
  await Promise.all([
    Company.updateMany({}, [{ $set: { nameSearch: { $toLower: { $trim: { input: { $ifNull: ['$name', ''] } } } }, industrySearch: { $toLower: { $trim: { input: { $ifNull: ['$industry', ''] } } } }, emailSearch: { $toLower: { $trim: { input: { $ifNull: ['$email', ''] } } } } } }], { updatePipeline: true }),
    User.updateMany({}, [{ $set: { nameSearch: { $toLower: { $trim: { input: { $ifNull: ['$name', ''] } } } }, emailSearch: { $toLower: { $trim: { input: { $ifNull: ['$email', ''] } } } } } }], { updatePipeline: true }),
    Employee.updateMany({}, [{ $set: { employeeIdSearch: { $toLower: { $trim: { input: { $ifNull: ['$employeeId', ''] } } } }, departmentSearch: { $toLower: { $trim: { input: { $ifNull: ['$department', ''] } } } }, designationSearch: { $toLower: { $trim: { input: { $ifNull: ['$designation', ''] } } } } } }], { updatePipeline: true }),
    Document.updateMany({}, [{ $set: { nameSearch: { $toLower: { $trim: { input: { $ifNull: ['$name', ''] } } } } } }], { updatePipeline: true }),
    SupportTicket.updateMany({}, [{ $set: { ticketNoSearch: { $toLower: { $trim: { input: { $ifNull: ['$ticketNo', ''] } } } }, categorySearch: { $toLower: { $trim: { input: { $ifNull: ['$category', ''] } } } }, subjectSearch: { $toLower: { $trim: { input: { $ifNull: ['$subject', ''] } } } } } }], { updatePipeline: true }),
  ]);
  const plans = [
    { name: 'Basic', type: 'BASIC', price: 999, maxUsers: 50, features: ['Employee Management', 'Attendance', 'Leave Management'], isActive: true },
    { name: 'Pro', type: 'PRO', price: 2499, maxUsers: 200, features: ['Everything in Basic', 'Payroll', 'Expense Management', 'Document Management', 'Reports'], isActive: true },
    { name: 'Enterprise', type: 'ENTERPRISE', price: 5999, maxUsers: 1000, features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'Advanced Analytics'], isActive: true },
  ];
  for (const plan of plans) {
    await Plan.findOneAndUpdate({ type: plan.type }, plan, { upsert: true, returnDocument: 'after' });
  }
  const cataloguePlans = await Plan.find().select('_id type').lean();
  for (const plan of cataloguePlans) {
    await Subscription.updateMany({ plan: plan.type, planId: { $exists: false } }, { $set: { planId: plan._id } });
  }
  await Subscription.syncIndexes();
  // Older deployments created a global employeeId_1 unique index. Employee IDs
  // are now company-scoped, so remove that legacy index before syncing indexes.
  try { await Employee.collection.dropIndex('employeeId_1'); } catch (err) {
    if ((err as { codeName?: string }).codeName !== 'IndexNotFound') throw err;
  }
  await Promise.all([Employee.syncIndexes(), PayrollRun.syncIndexes(), Payslip.syncIndexes(), SalaryStructure.syncIndexes(), IdempotencyKey.syncIndexes(), EmployeeHistory.syncIndexes()]);
  try { await RolePermission.collection.dropIndex('role_1_permission_1'); } catch (err) {
    if ((err as { codeName?: string }).codeName !== 'IndexNotFound') throw err;
  }
  await RolePermission.syncIndexes();
  const permissionCatalogue = [
    ['ATTENDANCE', 'Attendance — View'], ['ATTENDANCE', 'Attendance — Edit'],
    ['WORKFORCE', 'Workforce — View'], ['WORKFORCE', 'Workforce — Add/Edit'],
    ['PAYROLL', 'Payroll — View'], ['PAYROLL', 'Payroll — Process'],
    ['APPROVALS', 'Approvals — View'], ['APPROVALS', 'Approvals — Action'],
    ['REPORTS', 'Reports — View'], ['REPORTS', 'Reports — Download'],
    ['SETTINGS', 'Settings — Company'], ['SETTINGS', 'Settings — Roles'],
    ['SETTINGS', 'Settings — Workflows'],
  ] as const;
  const permissionRoles = ['COMPANY_ADMIN', 'HR', 'MANAGER', 'SUPERVISOR', 'FINANCE', 'EMPLOYEE'];
  const defaultPermissions: Record<string, string[]> = {
    COMPANY_ADMIN: permissionCatalogue.map(([, permission]) => permission),
    HR: ['Attendance — View', 'Attendance — Edit', 'Workforce — View', 'Workforce — Add/Edit', 'Approvals — View', 'Approvals — Action', 'Reports — View'],
    MANAGER: ['Attendance — View', 'Workforce — View', 'Approvals — View', 'Reports — View'],
    SUPERVISOR: ['Attendance — View', 'Workforce — View', 'Approvals — View'],
    FINANCE: ['Payroll — View', 'Payroll — Process', 'Reports — View', 'Reports — Download'],
    EMPLOYEE: [],
  };
  for (const role of permissionRoles) {
    for (const [module, permission] of permissionCatalogue) {
      await RolePermission.updateOne(
        { role, permission, companyId: { $exists: false } },
        { $setOnInsert: { role, module, permission, isGranted: defaultPermissions[role]?.includes(permission) ?? false } },
        { upsert: true },
      );
    }
  }
  const [employees, historyEmployeeIds] = await Promise.all([
    Employee.find().select('_id companyId managerId department designation annualCtc employmentType status joiningDate createdAt').lean(),
    EmployeeHistory.distinct('employeeId'),
  ]);
  const existingHistory = new Set(historyEmployeeIds.map((id) => id.toString()));
  const initialHistory = employees.filter((employee) => !existingHistory.has(employee._id.toString())).map((employee) => ({
    companyId: employee.companyId,
    employeeId: employee._id,
    effectiveFrom: employee.joiningDate ?? employee.createdAt ?? new Date(),
    changes: { created: true, migrated: true },
    snapshot: {
      department: employee.department,
      designation: employee.designation,
      managerId: employee.managerId,
      annualCtc: employee.annualCtc,
      employmentType: employee.employmentType,
      status: employee.status,
    },
  }));
  if (initialHistory.length) await EmployeeHistory.insertMany(initialHistory, { ordered: false });
  const attendanceRecords = await Attendance.find({ businessDate: { $exists: false } }).select('_id date').lean();
  if (attendanceRecords.length) {
    await Attendance.bulkWrite(attendanceRecords.map((record) => ({
      updateOne: {
        filter: { _id: record._id },
        update: { $set: { businessDate: record.date.toISOString().slice(0, 10) } },
      },
    })));
  }
  await Attendance.syncIndexes();
  await Company.updateMany({ timezone: { $exists: false } }, { $set: { timezone: 'Asia/Kolkata' } });
  await Attendance.updateMany({ timezone: { $exists: false } }, { $set: { timezone: 'Asia/Kolkata', lateMinutes: 0, overtimeMinutes: 0 } });
  const companies = await Company.find().select('_id plan').lean();
  await Module.findOneAndUpdate(
    { name: 'Shift Management' },
    { $setOnInsert: { name: 'Shift Management', description: 'Plan and assign employee shifts', availableFor: ['BASIC', 'PRO', 'ENTERPRISE'] } },
    { upsert: true, returnDocument: 'after' },
  );
  const modules = await Module.find().select('_id availableFor').lean();
  if (companies.length && modules.length) {
    const existingAssignments = await CompanyModule.find().select('companyId moduleId').lean();
    const existingKeys = new Set(existingAssignments.map((item) => `${item.companyId}:${item.moduleId}`));
    const assignments = companies.flatMap((company) => modules
      .filter((module) => module.availableFor.includes(company.plan))
      .filter((module) => !existingKeys.has(`${company._id}:${module._id}`))
      .map((module) => ({ companyId: company._id, moduleId: module._id, isEnabled: true })));
    if (assignments.length) await CompanyModule.insertMany(assignments, { ordered: false });
  }
  const approvedLeaves = await LeaveRequest.find({ status: 'Approved' }).select('companyId employeeId leaveType days startDate _id').lean();
  if (approvedLeaves.length) {
    await LeaveLedger.bulkWrite(approvedLeaves.map((leave) => ({
      updateOne: {
        filter: { companyId: leave.companyId, referenceId: leave._id, source: 'Usage' },
        update: { $setOnInsert: { companyId: leave.companyId, employeeId: leave.employeeId, leaveType: leave.leaveType, source: 'Usage', amount: -Math.abs(leave.days), referenceId: leave._id, effectiveDate: leave.startDate, note: 'Migrated approved leave' } },
        upsert: true,
      },
    })));
  }
  await Promise.all([LeaveLedger.syncIndexes(), LeaveBalance.syncIndexes()]);
  await mongoose.disconnect();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exitCode = 1;
});
