import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// POST /api/risks/bulk-update-category - Update categories for multiple risks
// (admin/riskManager only — bulk mutation)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request, { roles: ['admin', 'riskManager'] });
  if ('error' in authResult) return authResult.error;

  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid updates array' },
        { status: 400 }
      );
    }

    // Validate all category IDs exist
    const categoryIds = [...new Set(updates.map((u: { categoryId: string }) => u.categoryId))];
    const categories = await prisma.riskCategory.findMany({
      where: { id: { in: categoryIds } }
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some category IDs are invalid' },
        { status: 400 }
      );
    }

    // Update risks in batches
    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const update of updates) {
      try {
        await prisma.risk.update({
          where: { id: update.riskId },
          data: { categoryId: update.categoryId }
        });
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update risk ${update.riskId}: ${error}`);
      }
    }

    // Audit log
    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: authResult.userId,
      action: 'update',
      entity: 'risk',
      newValues: { bulkCategoryUpdate: results.updated, failed: results.failed },
      ...clientInfo,
    });

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update categories' },
      { status: 500 }
    );
  }
}
