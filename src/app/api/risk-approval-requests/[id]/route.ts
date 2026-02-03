import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - الحصول على طلب اعتماد محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const approvalRequest = await prisma.riskApprovalRequest.findUnique({
      where: { id },
      include: {
        risk: {
          include: {
            category: true,
            department: true,
            riskOwner: true,
            champion: {
              select: {
                id: true,
                fullName: true,
                fullNameEn: true,
              },
            },
            owner: {
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
    });

    if (!approvalRequest) {
      return NextResponse.json(
        { success: false, error: 'طلب الاعتماد غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approvalRequest,
    });
  } catch (error) {
    console.error('Error fetching risk approval request:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب طلب الاعتماد' },
      { status: 500 }
    );
  }
}

// PATCH - مراجعة طلب الاعتماد (قبول/رفض/تأجيل/طلب تعديل)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    // التحقق من صلاحية المستخدم (admin أو riskManager فقط)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, fullName: true, fullNameEn: true },
    });

    if (!user || !['admin', 'riskManager'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بمراجعة طلبات الاعتماد' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, noteAr, noteEn } = body;

    // التحقق من الإجراء المطلوب
    const validActions = ['approve', 'reject', 'defer', 'request_revision'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'إجراء غير صالح' },
        { status: 400 }
      );
    }

    // التحقق من وجود الطلب
    const approvalRequest = await prisma.riskApprovalRequest.findUnique({
      where: { id },
      include: {
        risk: {
          select: {
            id: true,
            riskNumber: true,
            titleAr: true,
            titleEn: true,
            department: { select: { nameAr: true, nameEn: true } },
          },
        },
        requester: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!approvalRequest) {
      return NextResponse.json(
        { success: false, error: 'طلب الاعتماد غير موجود' },
        { status: 404 }
      );
    }

    if (approvalRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'هذا الطلب تمت مراجعته مسبقاً' },
        { status: 400 }
      );
    }

    // تحديد الحالة الجديدة
    let newStatus: string;
    let riskApprovalStatus: string;
    let notificationType: string;
    let notificationTitleAr: string;
    let notificationTitleEn: string;
    let notificationMessageAr: string;
    let notificationMessageEn: string;

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        riskApprovalStatus = 'Approved';
        notificationType = 'risk_approved';
        notificationTitleAr = 'تم اعتماد الخطر';
        notificationTitleEn = 'Risk Approved';
        notificationMessageAr = `تم اعتماد الخطر "${approvalRequest.risk.titleAr}" من قبل ${user.fullName}`;
        notificationMessageEn = `Risk "${approvalRequest.risk.titleEn || approvalRequest.risk.titleAr}" approved by ${user.fullNameEn || user.fullName}`;
        break;
      case 'reject':
        newStatus = 'rejected';
        riskApprovalStatus = 'Draft'; // يعود للمسودة
        notificationType = 'risk_rejected';
        notificationTitleAr = 'تم رفض الخطر';
        notificationTitleEn = 'Risk Rejected';
        notificationMessageAr = `تم رفض الخطر "${approvalRequest.risk.titleAr}" من قبل ${user.fullName}`;
        notificationMessageEn = `Risk "${approvalRequest.risk.titleEn || approvalRequest.risk.titleAr}" rejected by ${user.fullNameEn || user.fullName}`;
        break;
      case 'defer':
        newStatus = 'deferred';
        riskApprovalStatus = 'Under Discussing';
        notificationType = 'risk_deferred';
        notificationTitleAr = 'تم تأجيل الخطر';
        notificationTitleEn = 'Risk Deferred';
        notificationMessageAr = `تم تأجيل النظر في الخطر "${approvalRequest.risk.titleAr}" من قبل ${user.fullName}`;
        notificationMessageEn = `Risk "${approvalRequest.risk.titleEn || approvalRequest.risk.titleAr}" deferred by ${user.fullNameEn || user.fullName}`;
        break;
      case 'request_revision':
        newStatus = 'revision_requested';
        riskApprovalStatus = 'Draft'; // يعود للمسودة لإجراء التعديلات
        notificationType = 'risk_revision_requested';
        notificationTitleAr = 'مطلوب تعديل الخطر';
        notificationTitleEn = 'Risk Revision Requested';
        notificationMessageAr = `مطلوب تعديل الخطر "${approvalRequest.risk.titleAr}" من قبل ${user.fullName}`;
        notificationMessageEn = `Revision requested for risk "${approvalRequest.risk.titleEn || approvalRequest.risk.titleAr}" by ${user.fullNameEn || user.fullName}`;
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'إجراء غير صالح' },
          { status: 400 }
        );
    }

    // تحديث طلب الاعتماد
    const updatedRequest = await prisma.riskApprovalRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewerId: session.user.id,
        reviewNoteAr: noteAr || null,
        reviewNoteEn: noteEn || null,
        reviewedAt: new Date(),
      },
    });

    // تحديث حالة الخطر
    await prisma.risk.update({
      where: { id: approvalRequest.risk.id },
      data: { approvalStatus: riskApprovalStatus },
    });

    // إرسال إشعار لصاحب الطلب
    await prisma.notification.create({
      data: {
        userId: approvalRequest.requester.id,
        type: notificationType,
        titleAr: notificationTitleAr,
        titleEn: notificationTitleEn,
        messageAr: notificationMessageAr + (noteAr ? `\n\nملاحظات: ${noteAr}` : ''),
        messageEn: notificationMessageEn + (noteEn ? `\n\nNotes: ${noteEn}` : ''),
        link: `/risks/${approvalRequest.risk.id}`,
        isRead: false,
      },
    });

    // إنشاء سجل تغيير
    await prisma.riskChangeLog.create({
      data: {
        riskId: approvalRequest.risk.id,
        userId: session.user.id,
        changeType: 'status_change',
        changeCategory: 'status',
        fieldName: 'approvalStatus',
        fieldNameAr: 'حالة الاعتماد',
        oldValue: 'Sent',
        newValue: riskApprovalStatus,
        description: `Approval request ${action}: ${noteEn || ''}`,
        descriptionAr: `طلب الاعتماد ${action === 'approve' ? 'قُبل' : action === 'reject' ? 'رُفض' : action === 'defer' ? 'مؤجل' : 'مطلوب تعديل'}: ${noteAr || ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest,
      message: action === 'approve' ? 'تم اعتماد الخطر بنجاح' :
               action === 'reject' ? 'تم رفض الخطر' :
               action === 'defer' ? 'تم تأجيل النظر في الخطر' :
               'تم طلب تعديل الخطر',
    });
  } catch (error) {
    console.error('Error reviewing risk approval request:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في مراجعة طلب الاعتماد' },
      { status: 500 }
    );
  }
}
