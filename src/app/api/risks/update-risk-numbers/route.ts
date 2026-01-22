import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST - Update all risk numbers based on their departments
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can run this
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Get all risks with their departments
    const risks = await prisma.risk.findMany({
      include: {
        department: {
          select: { code: true }
        }
      }
    });

    let updatedCount = 0;
    const updates: { id: string; oldNumber: string; newNumber: string }[] = [];

    for (const risk of risks) {
      if (!risk.department?.code) continue;

      // Extract sequence number from current risk number (e.g., PRO-R-761 -> 761, IT-001 -> 001)
      const sequenceMatch = risk.riskNumber.match(/(\d+)$/);
      if (!sequenceMatch) continue;

      const sequenceNumber = sequenceMatch[1];
      const newRiskNumber = `${risk.department.code}-${sequenceNumber}`;

      // Only update if different
      if (newRiskNumber !== risk.riskNumber) {
        await prisma.risk.update({
          where: { id: risk.id },
          data: { riskNumber: newRiskNumber }
        });

        updates.push({
          id: risk.id,
          oldNumber: risk.riskNumber,
          newNumber: newRiskNumber
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} risk numbers`,
      totalRisks: risks.length,
      updatedCount,
      updates: updates.slice(0, 20) // Return first 20 examples
    });
  } catch (error) {
    console.error('Error updating risk numbers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update risk numbers' },
      { status: 500 }
    );
  }
}
