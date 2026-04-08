import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

/**
 * GET /api/risks/next-number
 *
 * Returns the next risk number following the canonical format:
 *
 *     {DEPT_CODE}-{SOURCE_FIRST_CHAR}-{GLOBAL_SEQ_003}
 *
 * Rules:
 *   - DEPT_CODE: 3 uppercase letters (derived from Department.code).
 *   - SOURCE_FIRST_CHAR: first letter of RiskSource.code (e.g. ERM → E,
 *     KPMG → K). Defaults to 'E' (ERM) when no source is provided, since
 *     sourceless risks are assigned ERM on save.
 *   - GLOBAL_SEQ: strictly sequential across ALL risks regardless of
 *     department or source. Computed from the max existing sequence + 1.
 *
 * Query params:
 *   - deptCode (required): The 3-letter department code for the prefix.
 *   - sourceCode (optional): The source code. Defaults to 'ERM'.
 *
 * Example:
 *   GET /api/risks/next-number?deptCode=FIN&sourceCode=ERM → { nextNumber: "FIN-E-798" }
 *   GET /api/risks/next-number?deptCode=HRD                → { nextNumber: "HRD-E-799" }
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if ('error' in authResult) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const deptCodeRaw = searchParams.get('deptCode');
    const sourceCodeRaw = searchParams.get('sourceCode') || 'ERM';

    if (!deptCodeRaw) {
      return NextResponse.json(
        { success: false, error: 'deptCode is required' },
        { status: 400 }
      );
    }

    // Normalize: 3 uppercase letters for the dept prefix and first upper
    // letter of the source code.
    const deptCode = deptCodeRaw.toUpperCase().slice(0, 3);
    const sourceChar = sourceCodeRaw.toUpperCase().charAt(0);

    // -----------------------------------------------------------------
    // Global sequence: find the highest existing sequence number across
    // ALL risks that follow the canonical pattern {xxx}-{x}-{NNN}.
    // -----------------------------------------------------------------
    // We pull every risk number and parse the trailing integer. This is
    // cheap even at ~1k rows and resilient to legacy formats that may
    // still linger (they simply don't match the regex and are ignored).
    const allRisks = await prisma.risk.findMany({
      select: { riskNumber: true },
    });

    let maxSequence = 0;
    const canonicalPattern = /^[A-Z]{3}-[A-Z]-(\d+)$/;
    for (const r of allRisks) {
      const match = r.riskNumber.match(canonicalPattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSequence) maxSequence = num;
      }
    }

    const nextSequence = maxSequence + 1;
    const nextRiskNumber = `${deptCode}-${sourceChar}-${String(nextSequence).padStart(3, '0')}`;

    return NextResponse.json({
      success: true,
      data: {
        nextNumber: nextRiskNumber,
        sequence: nextSequence,
        deptCode,
        sourceChar,
      },
    });
  } catch (error) {
    console.error('Error generating next risk number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate next risk number' },
      { status: 500 }
    );
  }
}
