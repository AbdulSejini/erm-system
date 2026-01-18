import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - إنشاء الحالات الافتراضية
export async function POST() {
  try {
    const defaultStatuses = [
      {
        code: 'open',
        nameAr: 'مفتوح',
        nameEn: 'Open',
        descriptionAr: 'خطر جديد قيد المراجعة',
        descriptionEn: 'New risk under review',
        color: '#f59e0b',
        icon: 'AlertCircle',
        isDefault: true,
        order: 1,
      },
      {
        code: 'inProgress',
        nameAr: 'قيد المعالجة',
        nameEn: 'In Progress',
        descriptionAr: 'جاري تنفيذ خطة المعالجة',
        descriptionEn: 'Treatment plan in progress',
        color: '#3b82f6',
        icon: 'Clock',
        isDefault: false,
        order: 2,
      },
      {
        code: 'mitigated',
        nameAr: 'تم التخفيف',
        nameEn: 'Mitigated',
        descriptionAr: 'تم تخفيف الخطر إلى مستوى مقبول',
        descriptionEn: 'Risk mitigated to acceptable level',
        color: '#10b981',
        icon: 'CheckCircle',
        isDefault: false,
        order: 3,
      },
      {
        code: 'closed',
        nameAr: 'مغلق',
        nameEn: 'Closed',
        descriptionAr: 'تم إغلاق الخطر',
        descriptionEn: 'Risk closed',
        color: '#6b7280',
        icon: 'XCircle',
        isDefault: false,
        order: 4,
      },
      {
        code: 'accepted',
        nameAr: 'مقبول',
        nameEn: 'Accepted',
        descriptionAr: 'تم قبول الخطر كما هو',
        descriptionEn: 'Risk accepted as is',
        color: '#8b5cf6',
        icon: 'Check',
        isDefault: false,
        order: 5,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const status of defaultStatuses) {
      const existing = await prisma.riskStatus.findUnique({
        where: { code: status.code },
      });

      if (!existing) {
        await prisma.riskStatus.create({ data: status });
        created++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إنشاء ${created} حالة وتخطي ${skipped} حالة موجودة مسبقاً`,
      created,
      skipped,
    });
  } catch (error) {
    console.error('Error seeding risk statuses:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إنشاء الحالات الافتراضية' },
      { status: 500 }
    );
  }
}
