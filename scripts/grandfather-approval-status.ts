/**
 * One-off data migration: grandfather all existing risks.
 *
 * Background: The approvalStatus governance filter (introduced in the
 * Risk Approval workflow) hides every risk whose approvalStatus is not
 * "Approved" from the public register. Historic data in this database
 * was imported long before that workflow existed, and 601 of the 797
 * risks currently carry statuses like "Draft", "N/A", "Future", etc.
 *
 * If the filter were applied naively, ~75% of the register would
 * vanish for non-admin users overnight. This script marks every
 * existing non-Approved risk as "Approved" so that only brand-new
 * submissions (created after this migration runs) are subject to the
 * new approval workflow.
 *
 * Safe to re-run: a second invocation finds zero rows to update.
 *
 * Usage:
 *   npx tsx scripts/grandfather-approval-status.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const prisma = new PrismaClient();

  try {
    // 1. Show current distribution
    const before = await prisma.risk.groupBy({
      by: ['approvalStatus'],
      _count: true,
    });
    const total = before.reduce((s, r) => s + r._count, 0);

    console.log(`\nDatabase URL host: ${new URL(process.env.DATABASE_URL || '').host}`);
    console.log(`\nBefore migration — ${total} risks total:`);
    for (const r of before) {
      console.log(`  ${(r.approvalStatus || '(null)').padEnd(20)} ${r._count}`);
    }

    const nonApprovedCount = before
      .filter((r) => r.approvalStatus !== 'Approved')
      .reduce((s, r) => s + r._count, 0);

    if (nonApprovedCount === 0) {
      console.log('\n✓ Nothing to migrate — all risks are already Approved.');
      return;
    }

    console.log(`\n→ Will mark ${nonApprovedCount} risks as Approved (grandfather).`);

    // 2. Run the update
    const result = await prisma.risk.updateMany({
      where: {
        approvalStatus: { not: 'Approved' },
      },
      data: {
        approvalStatus: 'Approved',
      },
    });

    console.log(`\n✓ Updated ${result.count} rows.`);

    // 3. Show the new distribution for verification
    const after = await prisma.risk.groupBy({
      by: ['approvalStatus'],
      _count: true,
    });
    console.log('\nAfter migration:');
    for (const r of after) {
      console.log(`  ${(r.approvalStatus || '(null)').padEnd(20)} ${r._count}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
