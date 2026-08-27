import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mat3001.no' },
    update: { role: 'admin', password },
    create: {
      email: 'admin@mat3001.no',
      name: 'Admin User',
      password,
      role: 'admin',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@mat3001.no' },
    update: { role: 'teacher', password },
    create: {
      email: 'teacher@mat3001.no',
      name: 'Teacher User',
      password,
      role: 'teacher',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@mat3001.no' },
    update: { role: 'student', password },
    create: {
      email: 'student@mat3001.no',
      name: 'Student User',
      password,
      role: 'student',
    },
  });

  console.log({ admin, teacher, student });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
