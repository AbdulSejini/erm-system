import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - الحصول على سجل تغييرات التزام
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.complianceChangeLog.findMany({
      where: { obligationId: id },
      include: {
        user: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching change logs:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب سجل التغييرات' }, { status: 500 });
  }
}
