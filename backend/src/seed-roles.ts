import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Company from './models/Company';
import Employee from './models/Employee';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vook';

async function seedRoles() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Create a demo company
  let company = await Company.findOne({ name: 'Demo Company Pvt Ltd' });
  if (!company) {
    company = await Company.create({
      name: 'Demo Company Pvt Ltd',
      email: 'contact@democompany.com',
      phone: '9999999999',
      industry: 'Technology',
      status: 'ACTIVE',
      plan: 'PRO',
      maxUsers: 200,
    });
    console.log('Demo company created');
  } else {
    console.log('Demo company already exists');
  }

  const companyId = company._id;
  const pass = await bcrypt.hash('Test@123', 10);

  const roles = [
    { email: 'company.admin@demo.com', name: 'Company Admin', role: 'COMPANY_ADMIN' },
    { email: 'hr@demo.com',            name: 'HR Manager',    role: 'HR' },
    { email: 'supervisor@demo.com',    name: 'Supervisor',    role: 'SUPERVISOR' },
    { email: 'manager@demo.com',       name: 'Manager',       role: 'MANAGER' },
    { email: 'finance@demo.com',       name: 'Finance Head',  role: 'FINANCE' },
    { email: 'employee@demo.com',      name: 'John Employee', role: 'EMPLOYEE' },
  ];

  for (const r of roles) {
    const existing = await User.findOne({ email: r.email });
    if (!existing) {
      const user = await User.create({
        email: r.email,
        password: pass,
        name: r.name,
        role: r.role,
        companyId,
        isActive: true,
      });

      // Create employee record for non-admin roles
      if (['HR', 'SUPERVISOR', 'MANAGER', 'FINANCE', 'EMPLOYEE'].includes(r.role)) {
        const count = await Employee.countDocuments({ companyId });
        await Employee.create({
          employeeId: `EMP${String(count + 1).padStart(3, '0')}`,
          userId: user._id,
          companyId,
          department: r.role === 'HR' ? 'Human Resources' : r.role === 'FINANCE' ? 'Finance' : 'Operations',
          designation: r.name,
          employmentType: 'Permanent',
          status: 'Active',
        });
      }

      console.log(`Created: ${r.email} / Test@123  [${r.role}]`);
    } else {
      console.log(`Already exists: ${r.email}  [${r.role}]`);
    }
  }

  console.log('\nRole seed complete!');
  await mongoose.disconnect();
}

seedRoles().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
