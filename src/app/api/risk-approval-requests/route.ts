import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - الحصول على طلبات اعتماد المخاطر
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const myRequests = searchParams.get('myRequests') === 'true';

    // الحصول على معلومات المستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // بناء شروط البحث
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    // إذا كان المستخدم يريد طلباته فقط
    if (myRequests) {
      where.requesterId = session.user.id;
    }
    // إذا لم يكن admin أو riskManager، يرى طلباته فقط
    else if (!['admin', 'riskManager'].includes(user.role)) {
      where.requesterId = session.user.id;
    }

    const requests = await prisma.riskApprovalRequest.findMany({
      where,
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            descriptionAr: true,
            descriptionEn: true,
            categoryId: true,
            departmentId: true,
            processText: true,
            subProcessText: true,
            potentialCauseAr: true,
            potentialCauseEn: true,
            potentialImpactAr: true,
            potentialImpactEn: true,
            inherentLikelihood: true,
            inherentImpact: true,
            inherentScore: true,
            inherentRating: true,
            layersOfProtectionAr: true,
            layersOfProtectionEn: true,
            mitigationActionsAr: true,
            mitigationActionsEn: true,
            status: true,
            approvalStatus: true,
            issuedBy: true,
            category: {
              select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true,
              },
            },
            department: {
              select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true,
              },
            },
            riskOwner: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
            champion: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            fullName: true,
            fullNameEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // حساب عدد الطلبات المعلقة
    const pendingCount = await prisma.riskApprovalRequest.count({
      where: { status: 'pending' },
    });

    return NextResponse.json({
      success: true,
      data: requests,
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching risk approval requests:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب طلبات الاعتماد' },
      { status: 500 }
    );
  }
}

// POST - إنشاء طلب اعتماد خطر جديد (يتم استدعاؤها عند إرسال خطر للاعتماد)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { riskId } = body;

    if (!riskId) {
      return NextResponse.json(
        { success: false, error: 'معرف الخطر مطلوب' },
        { status: 400 }
      );
    }

    // التحقق من وجود الخطر
    const risk = await prisma.risk.findUnique({
      where: { id: riskId },
      select: {
        id: true,
        riskNumber: true,
        titleAr: true,
        titleEn: true,
        approvalStatus: true,
        department: {
          select: { nameAr: true, nameEn: true },
        },
      },
    });

    if (!risk) {
      return NextResponse.json(
        { success: false, error: 'الخطر غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من عدم وجود طلب معلق بالفعل
    const existingRequest = await prisma.riskApprovalRequest.findUnique({
      where: { riskId },
    });

    if (existingRequest && existingRequest.status === 'pending') {
      return NextResponse.json(
        { success: false, error: 'يوجد طلب اعتماد معلق لهذا الخطر بالفعل' },
        { status: 400 }
      );
    }

    // إنشاء أو تحديث طلب الاعتماد
    const approvalRequest = await prisma.riskApprovalRequest.upsert({
      where: { riskId },
      create: {
        riskId,
        requesterId: session.user.id,
        status: 'pending',
      },
      update: {
        requesterId: session.user.id,
        status: 'pending',
        reviewerId: null,
        reviewNoteAr: null,
        reviewNoteEn: null,
        reviewedAt: null,
      },
    });

    // تحديث حالة الخطر إلى "Sent"
    await prisma.risk.update({
      where: { id: riskId },
      data: { approvalStatus: 'Sent' },
    });

    // إرسال إشعارات لمديري المخاطر
    const riskManagers = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'riskManager'] },
        status: 'active',
        id: { not: session.user.id },
      },
      select: { id: true },
    });

    // إنشاء إشعارات
    if (riskManagers.length > 0) {
      await prisma.notification.createMany({
        data: riskManagers.map((manager) => ({
          userId: manager.id,
          type: 'risk_approval_pending',
          titleAr: `طلب اعتماد خطر جديد: ${risk.riskNumber}`,
          titleEn: `New risk approval request: ${risk.riskNumber}`,
          messageAr: `تم إرسال الخطر "${risk.titleAr}" للاعتماد في ${risk.department?.nameAr || 'القسم'}`,
          messageEn: `Risk "${risk.titleEn || risk.titleAr}" sent for approval in ${risk.department?.nameEn || 'department'}`,
          link: `/risk-approvals?id=${approvalRequest.id}`,
          isRead: false,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: approvalRequest,
      message: 'تم إرسال الخطر لمدير المخاطر للاعتماد',
    });
  } catch (error) {
    console.error('Error creating risk approval request:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إرسال طلب الاعتماد' },
      { status: 500 }
    );
  }
}
