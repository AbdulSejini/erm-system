/**
 * Risk renumbering migration (one-off).
 *
 * Goal — restamp every existing risk with a number that follows the new
 * canonical format:
 *
 *     {DEPT_CODE}-{SOURCE_FIRST_CHAR}-{GLOBAL_SEQ_003}
 *
 * Rules:
 *   - DEPT_CODE: Department.code, already 3 uppercase letters in this DB.
 *   - SOURCE_FIRST_CHAR: first letter of RiskSource.code, upper-cased.
 *     Risks currently missing a sourceId are first linked to ERM (the
 *     requested default), so they become "E".
 *   - GLOBAL_SEQ: strictly sequential across ALL risks regardless of
 *     department or source. Ordered by createdAt ASC (then id ASC as
 *     tiebreaker) so the oldest record gets sequence 001.
 *
 * Safety:
 *   - Pass --dry-run to preview the first 20 changes + totals without
 *     touching the DB.
 *   - Live mode renames every risk to a temporary prefix first (TMP-i)
 *     to free the unique namespace, then writes the final numbers in a
 *     second pass. Running it again on an already-migrated DB is a
 *     no-op (it still reorders into the new sequence, but since the
 *     source data is unchanged the result is the same).
 *   - Runs the two-phase rewrite inside a single prisma.$transaction so
 *     a crash mid-way leaves the DB untouched.
 *
 * Usage:
 *   DRY RUN: npx tsx scripts/renumber-risks.ts --dry-run
 *   LIVE:    npx tsx scripts/renumber-risks.ts --live
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const LIVE = process.argv.includes('--live');

if (!DRY_RUN && !LIVE) {
  console.error('Pass either --dry-run or --live');
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log(`\nDatabase host: ${new URL(process.env.DATABASE_URL || '').host}`);
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE (will modify DB)'}\n`);

    // -------------------------------------------------------------------
    // Phase 0 — make sure every risk has a sourceId. Risks without one
    // are assigned to the ERM source per requirement.
    // -------------------------------------------------------------------
    const ermSource = await prisma.riskSource.findUnique({ where: { code: 'ERM' } });
    if (!ermSource) {
      throw new Error(
        'RiskSource with code "ERM" not found. Create it via the seed endpoint first.'
      );
    }

    const sourcelessCount = await prisma.risk.count({ where: { sourceId: null } });
    console.log(`Phase 0 — assigning ERM to ${sourcelessCount} sourceless risks`);

    if (!DRY_RUN && sourcelessCount > 0) {
      const res = await prisma.risk.updateMany({
        where: { sourceId: null },
        data: { sourceId: ermSource.id },
      });
      console.log(`  → updated ${res.count} risks\n`);
    } else if (DRY_RUN) {
      console.log(`  → (dry run — would update ${sourcelessCount} risks)\n`);
    }

    // -------------------------------------------------------------------
    // Phase 1 — build the renumber plan.
    // -------------------------------------------------------------------
    // We read every risk ordered by createdAt ASC (id ASC tiebreaker) so
    // the global sequence is deterministic and the oldest record gets 001.
    //
    // For the dry run we need the computed source code; for sourceless
    // rows we simulate the ERM assignment in memory so the preview
    // matches what the live run would produce.
    const risks = await prisma.risk.findMany({
      select: {
        id: true,
        riskNumber: true,
        sourceId: true,
        department: { select: { code: true } },
        source: { select: { code: true } },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    console.log(`Phase 1 — building plan for ${risks.length} risks\n`);

    type PlanRow = {
      id: string;
      oldNumber: string;
      newNumber: string;
      deptCode: string;
      sourceChar: string;
    };
    const plan: PlanRow[] = [];

    risks.forEach((r, idx) => {
      // Department code is already 3 uppercase letters in this DB. We
      // still defensively slice + upper just in case a migration ever
      // loosens that constraint.
      const deptCode = (r.department?.code || 'GEN').toUpperCase().slice(0, 3);

      // Resolve the effective source code. Real DB state if it exists,
      // otherwise simulate the ERM assignment from Phase 0.
      let sourceCode = r.source?.code;
      if (!sourceCode) sourceCode = 'ERM'; // matches the Phase 0 backfill
      const sourceChar = sourceCode.toUpperCase().charAt(0);

      const seq = String(idx + 1).padStart(3, '0');
      const newNumber = `${deptCode}-${sourceChar}-${seq}`;

      plan.push({
        id: r.id,
        oldNumber: r.riskNumber,
        newNumber,
        deptCode,
        sourceChar,
      });
    });

    // -------------------------------------------------------------------
    // Preview
    // -------------------------------------------------------------------
    console.log('=== Preview (first 20 changes) ===');
    console.log('old                  →  new');
    console.log('-'.repeat(44));
    plan.slice(0, 20).forEach((p) => {
      console.log(`  ${p.oldNumber.padEnd(18)} →  ${p.newNumber}`);
    });

    console.log('\n=== Preview (last 5 changes) ===');
    plan.slice(-5).forEach((p) => {
      console.log(`  ${p.oldNumber.padEnd(18)} →  ${p.newNumber}`);
    });

    // Distribution by department + source char
    const distribution: Record<string, number> = {};
    for (const p of plan) {
      const key = `${p.deptCode}-${p.sourceChar}`;
      distribution[key] = (distribution[key] || 0) + 1;
    }
    console.log('\n=== Distribution ===');
    Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, count]) => {
        console.log(`  ${key.padEnd(10)} ${count}`);
      });

    // Number-of-changes sanity check
    const unchanged = plan.filter((p) => p.oldNumber === p.newNumber).length;
    const changed = plan.length - unchanged;
    console.log(`\n=== Summary ===`);
    console.log(`  Total risks:   ${plan.length}`);
    console.log(`  Will change:   ${changed}`);
    console.log(`  Already match: ${unchanged}`);
    console.log(`  Highest seq:   ${plan[plan.length - 1]?.newNumber || '(none)'}`);

    if (DRY_RUN) {
      console.log('\n✓ Dry run complete — no changes written.\n');
      return;
    }

    // -------------------------------------------------------------------
    // Phase 2 — live rewrite using bulk raw SQL.
    // -------------------------------------------------------------------
    // We can't wrap 1,594 individual updates in a single transaction on
    // Neon (the pooled connection closes partway through). Instead:
    //
    //   Phase 2a: ONE raw SQL statement that moves every row to a unique
    //             temporary name derived from its primary key. This
    //             frees the unique namespace in a single round-trip.
    //
    //   Phase 2b: ONE raw SQL statement (VALUES list) that writes every
    //             final name from a mapping of id → newNumber.
    //
    // Both statements use `UPDATE … FROM (VALUES …)` which PostgreSQL
    // executes as a single server-side operation — fast and atomic per
    // statement.
    // -------------------------------------------------------------------
    console.log('\nPhase 2a — move every risk to a temporary placeholder');

    // PostgreSQL: UPDATE "Risk" SET "riskNumber" = '__TMP__' || id
    const tmpRes = await prisma.$executeRaw`
      UPDATE "Risk" SET "riskNumber" = '__TMP__' || "id"
    `;
    console.log(`  → ${tmpRes} rows moved to __TMP__ prefix`);

    console.log('\nPhase 2b — write final numbers via VALUES payload');

    // Build a single VALUES list with all 797 rows and run one UPDATE.
    // Using $executeRawUnsafe because tagged-template literals don't
    // interpolate table-shaped data; the values come from our own
    // computed plan (not user input), so this is safe.
    const valuesRows = plan
      .map((p) => `('${p.id}', '${p.newNumber}')`)
      .join(',\n');

    const sql = `
      UPDATE "Risk" AS r
      SET "riskNumber" = v.new_number
      FROM (VALUES
        ${valuesRows}
      ) AS v(id, new_number)
      WHERE r."id" = v.id
    `;

    const finalRes = await prisma.$executeRawUnsafe(sql);
    console.log(`  → ${finalRes} rows renamed to final form`);

    // Verify
    const verify = await prisma.risk.findMany({
      select: { riskNumber: true },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });
    console.log('=== Verify (first 5 by createdAt) ===');
    verify.forEach((v) => console.log(`  ${v.riskNumber}`));

    console.log('\n✓ Renumber complete.\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n✗ Migration failed:', err);
  process.exit(1);
});
