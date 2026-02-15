import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

// GET - الحصول على المخاطر المرتبطة بالتزام
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

    const links = await prisma.complianceRiskLink.findMany({
      where: { obligationId: id },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            inherentRating: true,
            residualRating: true,
            status: true,
            department: { select: { nameAr: true, nameEn: true } },
          },
        },
        linkedBy: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
      },
      orderBy: { linkedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error('Error fetching risk links:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب المخاطر المرتبطة' }, { status: 500 });
  }
}

// POST - ربط خطر بالتزام
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-link-${clientIP}`, rateLimitConfigs.write);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'riskManager', 'riskAnalyst'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'ليس لديك صلاحية ربط المخاطر' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.riskId) {
      return NextResponse.json({ success: false, error: 'معرف الخطر مطلوب' }, { status: 400 });
    }

    // التحقق من وجود الالتزام والخطر
    const [obligation, risk] = await Promise.all([
      prisma.complianceObligation.findUnique({ where: { id } }),
      prisma.risk.findUnique({ where: { id: body.riskId } }),
    ]);

    if (!obligation) {
      return NextResponse.json({ success: false, error: 'الالتزام غير موجود' }, { status: 404 });
    }
    if (!risk) {
      return NextResponse.json({ success: false, error: 'الخطر غير موجود' }, { status: 404 });
    }

    // التحقق من عدم وجود ربط مسبق
    const existingLink = await prisma.complianceRiskLink.findUnique({
      where: { obligationId_riskId: { obligationId: id, riskId: body.riskId } },
    });

    if (existingLink) {
      return NextResponse.json({ success: false, error: 'الخطر مرتبط مسبقاً بهذا الالتزام' }, { status: 400 });
    }

    const link = await prisma.complianceRiskLink.create({
      data: {
        obligationId: id,
        riskId: body.riskId,
        linkedById: session.user.id,
      },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            inherentRating: true,
            residualRating: true,
            status: true,
          },
        },
      },
    });

    // تسجيل التغيير
    await prisma.complianceChangeLog.create({
      data: {
        obligationId: id,
        userId: session.user.id,
        changeType: 'risk_link',
        fieldName: 'riskLinks',
        newValue: risk.riskNumber,
        description: `Linked risk ${risk.riskNumber}`,
        descriptionAr: `تم ربط الخطر ${risk.riskNumber}`,
      },
    });

    return NextResponse.json({ success: true, data: link });
  } catch (error) {
    console.error('Error linking risk:', error);
    return NextResponse.json({ success: false, error: 'فشل في ربط الخطر' }, { status: 500 });
  }
}

// DELETE - إلغاء ربط خطر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'riskManager'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'ليس لديك صلاحية إلغاء ربط المخاطر' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const riskId = searchParams.get('riskId');

    if (!riskId) {
      return NextResponse.json({ success: false, error: 'معرف الخطر مطلوب' }, { status: 400 });
    }

    const link = await prisma.complianceRiskLink.findUnique({
      where: { obligationId_riskId: { obligationId: id, riskId } },
      include: { risk: { select: { riskNumber: true } } },
    });

    if (!link) {
      return NextResponse.json({ success: false, error: 'الربط غير موجود' }, { status: 404 });
    }

    await prisma.complianceRiskLink.delete({
      where: { obligationId_riskId: { obligationId: id, riskId } },
    });

    await prisma.complianceChangeLog.create({
      data: {
        obligationId: id,
        userId: session.user.id,
        changeType: 'risk_unlink',
        fieldName: 'riskLinks',
        oldValue: link.risk.riskNumber,
        description: `Unlinked risk ${link.risk.riskNumber}`,
        descriptionAr: `تم إلغاء ربط الخطر ${link.risk.riskNumber}`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم إلغاء الربط' });
  } catch (error) {
    console.error('Error unlinking risk:', error);
    return NextResponse.json({ success: false, error: 'فشل في إلغاء الربط' }, { status: 500 });
  }
}
