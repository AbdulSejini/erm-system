import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/risks/bulk-update-category - Update categories for multiple risks
export async function POST(request: NextRequest) {
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
