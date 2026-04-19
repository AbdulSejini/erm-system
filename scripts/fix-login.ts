/**
 * One-off script: reset passwords for all sejini accounts.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newHash = await bcrypt.hash('Welcome@123', 12);

  // Reset both accounts that didn't match
  const targets = ['admin@saudicable.com', 'abdul.sejini@gmail.com'];

  for (const email of targets) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { email },
        data: { password: newHash },
      });
      const verify = await bcrypt.compare('Welcome@123', newHash);
      console.log(`✅ ${email} (${user.role}) — password reset. Verify: ${verify ? 'PASS' : 'FAIL'}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
