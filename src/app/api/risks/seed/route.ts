import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Seed initial risks data to database
export async function POST() {
  try {
    // Get departments and categories from database
    const [departments, categories, users] = await Promise.all([
      prisma.department.findMany(),
      prisma.riskCategory.findMany(),
      prisma.user.findMany({ take: 1 }), // Get at least one user for owner
    ]);

    // Create maps for quick lookup by code
    const deptByCode = new Map(departments.map(d => [d.code.toUpperCase(), d.id]));
    const deptByNameAr = new Map(departments.map(d => [d.nameAr, d.id]));
    const catByCode = new Map(categories.map(c => [c.code.toUpperCase(), c.id]));

    // Get or create default user
    let defaultUserId = users[0]?.id;
    if (!defaultUserId) {
      const defaultUser = await prisma.user.create({
        data: {
          email: 'system@erm.local',
          password: 'system',
          fullName: 'النظام',
          fullNameEn: 'System',
          role: 'admin',
        },
      });
      defaultUserId = defaultUser.id;
    }

    // Get or create default department
    let defaultDeptId = departments[0]?.id;
    if (!defaultDeptId) {
      const defaultDept = await prisma.department.create({
        data: {
          nameAr: 'عام',
          nameEn: 'General',
          code: 'GEN',
        },
      });
      defaultDeptId = defaultDept.id;
    }

    // Mock risks data to migrate
    const risksToMigrate = [
      {
        riskNumber: 'FIN-R-001',
        titleAr: 'خطر تقلبات أسعار النحاس',
        titleEn: 'Copper Price Fluctuation Risk',
        descriptionAr: 'تقلبات أسعار النحاس قد تؤثر سلباً على هوامش الربح وتكاليف الإنتاج',
        descriptionEn: 'Copper price fluctuations may negatively impact profit margins and production costs',
        categoryCode: 'FIN',
        departmentAr: 'المالية',
        status: 'open',
        processText: 'المشتريات',
        subProcessText: 'إدارة العقود',
        inherentLikelihood: 5,
        inherentImpact: 5,
        inherentScore: 25,
        inherentRating: 'Critical',
        residualLikelihood: 4,
        residualImpact: 4,
        residualScore: 16,
        residualRating: 'Major',
        issuedBy: 'KPMG',
        potentialCauseAr: 'تغيرات في أسعار السوق العالمية للنحاس',
        potentialCauseEn: 'Changes in global copper market prices',
        potentialImpactAr: 'انخفاض هوامش الربح وزيادة تكاليف الإنتاج',
        potentialImpactEn: 'Reduced profit margins and increased production costs',
        identifiedDate: new Date('2026-01-14'),
      },
      {
        riskNumber: 'OPS-R-001',
        titleAr: 'خطر تأخر توريد المواد الخام',
        titleEn: 'Raw Material Supply Delay Risk',
        descriptionAr: 'تأخر توريد المواد الخام قد يؤدي إلى توقف خطوط الإنتاج',
        descriptionEn: 'Delayed raw material supply may cause production line stoppage',
        categoryCode: 'OPS',
        departmentAr: 'سلسلة التوريد',
        status: 'inProgress',
        processText: 'المشتريات',
        subProcessText: 'إدارة الموردين',
        inherentLikelihood: 4,
        inherentImpact: 4,
        inherentScore: 16,
        inherentRating: 'Major',
        residualLikelihood: 3,
        residualImpact: 3,
        residualScore: 9,
        residualRating: 'Moderate',
        issuedBy: 'Internal',
        identifiedDate: new Date('2026-01-15'),
      },
      {
        riskNumber: 'OPS-R-002',
        titleAr: 'خطر انقطاع الكهرباء',
        titleEn: 'Power Outage Risk',
        descriptionAr: 'انقطاع الكهرباء قد يؤدي إلى توقف الإنتاج وتلف المواد',
        descriptionEn: 'Power outages may lead to production stoppage and material damage',
        categoryCode: 'OPS',
        departmentAr: 'العمليات',
        status: 'mitigated',
        processText: 'الإنتاج',
        subProcessText: '',
        inherentLikelihood: 3,
        inherentImpact: 4,
        inherentScore: 12,
        inherentRating: 'Moderate',
        residualLikelihood: 2,
        residualImpact: 3,
        residualScore: 6,
        residualRating: 'Minor',
        issuedBy: 'Internal',
        identifiedDate: new Date('2026-01-13'),
      },
      {
        riskNumber: 'TECH-R-001',
        titleAr: 'خطر الأمن السيبراني',
        titleEn: 'Cybersecurity Risk',
        descriptionAr: 'خطر الهجمات السيبرانية على أنظمة تقنية المعلومات',
        descriptionEn: 'Risk of cyber attacks on IT systems',
        categoryCode: 'TECH',
        departmentAr: 'تقنية المعلومات',
        status: 'open',
        processText: 'الأمن السيبراني',
        subProcessText: '',
        inherentLikelihood: 4,
        inherentImpact: 5,
        inherentScore: 20,
        inherentRating: 'Critical',
        residualLikelihood: 3,
        residualImpact: 4,
        residualScore: 12,
        residualRating: 'Moderate',
        issuedBy: 'KPMG',
        identifiedDate: new Date('2026-01-10'),
      },
      {
        riskNumber: 'COMP-R-001',
        titleAr: 'خطر الامتثال البيئي',
        titleEn: 'Environmental Compliance Risk',
        descriptionAr: 'خطر عدم الامتثال للوائح البيئية المحلية والدولية',
        descriptionEn: 'Risk of non-compliance with local and international environmental regulations',
        categoryCode: 'COMP',
        departmentAr: 'السلامة والبيئة',
        status: 'open',
        processText: 'البيئة',
        subProcessText: '',
        inherentLikelihood: 2,
        inherentImpact: 3,
        inherentScore: 6,
        inherentRating: 'Minor',
        residualLikelihood: 2,
        residualImpact: 2,
        residualScore: 4,
        residualRating: 'Negligible',
        issuedBy: 'Internal',
        identifiedDate: new Date('2026-01-12'),
      },
      {
        riskNumber: 'HSE-R-001',
        titleAr: 'خطر إصابات العمل',
        titleEn: 'Workplace Injury Risk',
        descriptionAr: 'خطر الإصابات في موقع العمل نتيجة عدم الالتزام بمعايير السلامة',
        descriptionEn: 'Risk of workplace injuries due to non-compliance with safety standards',
        categoryCode: 'HSE',
        departmentAr: 'السلامة والبيئة',
        status: 'accepted',
        processText: 'السلامة المهنية',
        subProcessText: '',
        inherentLikelihood: 3,
        inherentImpact: 3,
        inherentScore: 9,
        inherentRating: 'Moderate',
        residualLikelihood: 2,
        residualImpact: 2,
        residualScore: 4,
        residualRating: 'Negligible',
        issuedBy: 'Internal',
        identifiedDate: new Date('2026-01-08'),
      },
    ];

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const risk of risksToMigrate) {
      try {
        // Check if risk already exists
        const existing = await prisma.risk.findUnique({
          where: { riskNumber: risk.riskNumber },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Find department ID
        let departmentId = deptByCode.get(risk.categoryCode) ||
                          deptByNameAr.get(risk.departmentAr) ||
                          defaultDeptId;

        // Find category ID
        const categoryId = catByCode.get(risk.categoryCode) || null;

        // Create risk
        await prisma.risk.create({
          data: {
            riskNumber: risk.riskNumber,
            titleAr: risk.titleAr,
            titleEn: risk.titleEn,
            descriptionAr: risk.descriptionAr,
            descriptionEn: risk.descriptionEn,
            categoryId,
            departmentId,
            status: risk.status,
            processText: risk.processText || null,
            subProcessText: risk.subProcessText || null,
            inherentLikelihood: risk.inherentLikelihood,
            inherentImpact: risk.inherentImpact,
            inherentScore: risk.inherentScore,
            inherentRating: risk.inherentRating,
            residualLikelihood: risk.residualLikelihood,
            residualImpact: risk.residualImpact,
            residualScore: risk.residualScore,
            residualRating: risk.residualRating,
            issuedBy: risk.issuedBy || null,
            potentialCauseAr: risk.potentialCauseAr || null,
            potentialCauseEn: risk.potentialCauseEn || null,
            potentialImpactAr: risk.potentialImpactAr || null,
            potentialImpactEn: risk.potentialImpactEn || null,
            identifiedDate: risk.identifiedDate,
            ownerId: defaultUserId,
            createdById: defaultUserId,
            approvalStatus: 'Draft',
          },
        });

        results.added++;
      } catch (error) {
        console.error(`Error creating risk ${risk.riskNumber}:`, error);
        results.errors.push(`Failed to create ${risk.riskNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${results.added} added, ${results.skipped} skipped`,
      results,
    });
  } catch (error) {
    console.error('Error in seed migration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
