import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) { console.log('Company not found — run seed.ts first'); return; }

  const pw = await bcrypt.hash('admin@company123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@smartfactory.com' },
    update: {},
    create: {
      email:     'admin@smartfactory.com',
      password:  pw,
      name:      'Priya Mehta',
      role:      'COMPANY_ADMIN',
      companyId: company.id,
      isActive:  true,
    },
  });

  console.log('Company Admin seeded: admin@smartfactory.com / admin@company123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
