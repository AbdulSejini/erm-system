import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/rate-limit';

// GET - الحصول على تقييمات التزام
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

    const assessments = await prisma.complianceAssessment.findMany({
      where: { obligationId: id },
      include: {
        assessor: {
          select: { id: true, fullName: true, fullNameEn: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ success: false, error: 'فشل في جلب التقييمات' }, { status: 500 });
  }
}

// POST - إضافة تقييم جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`compliance-assess-${clientIP}`, rateLimitConfigs.write);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'riskManager', 'riskAnalyst'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'ليس لديك صلاحية إضافة تقييمات' }, { status: 403 });
    }

    const obligation = await prisma.complianceObligation.findUnique({ where: { id } });
    if (!obligation) {
      return NextResponse.json({ success: false, error: 'الالتزام غير موجود' }, { status: 404 });
    }

    const body = await request.json();

    if (!body.testResult) {
      return NextResponse.json({ success: false, error: 'نتيجة الاختبار مطلوبة' }, { status: 400 });
    }

    const assessment = await prisma.complianceAssessment.create({
      data: {
        obligationId: id,
        assessorId: session.user.id,
        testingMethod: body.testingMethod || null,
        testResult: body.testResult,
        testDate: body.testDate ? new Date(body.testDate) : new Date(),
        findingsAr: body.findingsAr || null,
        findingsEn: body.findingsEn || null,
        evidenceNotes: body.evidenceNotes || null,
        attachmentUrl: body.attachmentUrl || null,
        attachmentName: body.attachmentName || null,
      },
      include: {
        assessor: {
          select: { id: true, fullName: true, fullNameEn: true },
        },
      },
    });

    // تحديث آخر اختبار في الالتزام
    await prisma.complianceObligation.update({
      where: { id },
      data: {
        lastTestResult: body.testResult,
        lastTestDate: body.testDate ? new Date(body.testDate) : new Date(),
        testingMethod: body.testingMethod || obligation.testingMethod,
      },
    });

    // تسجيل التغيير
    await prisma.complianceChangeLog.create({
      data: {
        obligationId: id,
        userId: session.user.id,
        changeType: 'assessment',
        description: `New assessment: ${body.testResult}`,
        descriptionAr: `تقييم جديد: ${body.testResult}`,
      },
    });

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ success: false, error: 'فشل في إنشاء التقييم' }, { status: 500 });
  }
}
