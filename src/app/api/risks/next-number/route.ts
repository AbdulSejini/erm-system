import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - الحصول على رقم الخطر التالي بناءً على كود الوظيفة (Department)
// مثال: GET /api/risks/next-number?deptCode=Gov → Gov-R-793
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deptCode = searchParams.get('deptCode');

    if (!deptCode) {
      return NextResponse.json(
        { success: false, error: 'deptCode is required' },
        { status: 400 }
      );
    }

    // البحث عن جميع المخاطر التي تبدأ بكود الوظيفة
    const risks = await prisma.risk.findMany({
      where: {
        riskNumber: {
          startsWith: `${deptCode}-`,
        },
      },
      select: {
        riskNumber: true,
      },
      orderBy: {
        riskNumber: 'desc',
      },
    });

    let nextSequence = 1;

    if (risks.length > 0) {
      // استخراج أعلى رقم تسلسلي من المخاطر الموجودة
      for (const risk of risks) {
        // استخراج الرقم من نهاية رقم الخطر (مثل Gov-R-792 → 792, Gov-045 → 45)
        const match = risk.riskNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= nextSequence) {
            nextSequence = num + 1;
          }
        }
      }
    }

    const nextRiskNumber = `${deptCode}-R-${String(nextSequence).padStart(3, '0')}`;

    return NextResponse.json({
      success: true,
      data: {
        nextNumber: nextRiskNumber,
        sequence: nextSequence,
        deptCode,
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
