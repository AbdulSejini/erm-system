import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'abdul.sejini@gmail.com';
  const password = 'Admin@123'; // كلمة المرور الأولية - يجب تغييرها بعد أول تسجيل دخول
  const hashedPassword = await bcrypt.hash(password, 12);

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update existing user to admin
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'admin',
        fullName: 'عبدالإله سجيني',
        fullNameEn: 'Abdulelah Sejini',
      },
    });
    console.log('✅ Admin user updated:', user.email);
  } else {
    // Create new admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'admin',
        fullName: 'عبدالإله سجيني',
        fullNameEn: 'Abdulelah Sejini',
      },
    });
    console.log('✅ Admin user created:', user.email);
  }

  console.log('');
  console.log('📧 Email:', email);
  console.log('🔑 Password: Admin@123');
  console.log('');
  console.log('⚠️  يرجى تغيير كلمة المرور بعد أول تسجيل دخول!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
