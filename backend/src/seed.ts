/**
 * MongoDB seed script — run once to bootstrap the database.
 * Usage: npx ts-node src/seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User';
import Plan from './models/Plan';
import Module from './models/Module';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vook';

const plans = [
  {
    name: 'Basic',
    type: 'BASIC',
    price: 999,
    maxUsers: 50,
    features: ['Employee Management', 'Attendance', 'Leave Management'],
    isActive: true,
  },
  {
    name: 'Pro',
    type: 'PRO',
    price: 2499,
    maxUsers: 200,
    features: ['Everything in Basic', 'Payroll', 'Expense Management', 'Document Management', 'Reports'],
    isActive: true,
  },
  {
    name: 'Enterprise',
    type: 'ENTERPRISE',
    price: 5999,
    maxUsers: 1000,
    features: ['Everything in Pro', 'Custom Integrations', 'Dedicated Support', 'Advanced Analytics'],
    isActive: true,
  },
];

const modules = [
  { name: 'Employee Management', description: 'Manage employees, departments and designations', availableFor: ['BASIC', 'PRO', 'ENTERPRISE'] },
  { name: 'Attendance',          description: 'Track daily attendance and work hours',           availableFor: ['BASIC', 'PRO', 'ENTERPRISE'] },
  { name: 'Leave Management',    description: 'Manage leave requests and approvals',             availableFor: ['BASIC', 'PRO', 'ENTERPRISE'] },
  { name: 'Payroll',             description: 'Process salaries, payslips and compliance',       availableFor: ['PRO', 'ENTERPRISE'] },
  { name: 'Expense Management',  description: 'Submit and approve expense claims',               availableFor: ['PRO', 'ENTERPRISE'] },
  { name: 'Document Management', description: 'Upload and manage company documents',             availableFor: ['PRO', 'ENTERPRISE'] },
  { name: 'Reports & Analytics', description: 'Detailed reports and dashboards',                 availableFor: ['PRO', 'ENTERPRISE'] },
  { name: 'Custom Integrations', description: 'Connect with third-party tools',                  availableFor: ['ENTERPRISE'] },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Plans ──────────────────────────────────────────────
  for (const p of plans) {
    await Plan.findOneAndUpdate({ type: p.type as any }, p, { upsert: true, returnDocument: "after" });
    console.log(`Plan upserted: ${p.name}`);
  }

  // ── Modules ────────────────────────────────────────────
  for (const m of modules) {
    await Module.findOneAndUpdate({ name: m.name }, m, { upsert: true, returnDocument: "after" });
    console.log(`Module upserted: ${m.name}`);
  }

  // ── Super Admin ────────────────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@vook.com';
  const superAdminPass  = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';

  const existing = await User.findOne({ email: superAdminEmail });
  if (!existing) {
    const hashed = await bcrypt.hash(superAdminPass, 12);
    await User.create({
      email: superAdminEmail,
      password: hashed,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    console.log(`Super admin created: ${superAdminEmail} / ${superAdminPass}`);
  } else {
    console.log(`Super admin already exists: ${superAdminEmail}`);
  }

  console.log('\nSeed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
