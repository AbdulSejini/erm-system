import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// الإدارات
const departments = [
  { code: 'COM', nameAr: 'الامتثال', nameEn: 'Compliance' },
  { code: 'ERP', nameAr: 'نظام تخطيط الموارد', nameEn: 'ERP' },
  { code: 'FIN', nameAr: 'المالية', nameEn: 'Finance' },
  { code: 'GOV', nameAr: 'الحوكمة', nameEn: 'Governance' },
  { code: 'HRD', nameAr: 'الموارد البشرية', nameEn: 'HR' },
  { code: 'HSE', nameAr: 'الصحة والسلامة والبيئة', nameEn: 'HSE' },
  { code: 'IAD', nameAr: 'التدقيق الداخلي', nameEn: 'Internal Audit' },
  { code: 'ITD', nameAr: 'تقنية المعلومات', nameEn: 'IT' },
  { code: 'LEG', nameAr: 'الشؤون القانونية', nameEn: 'Legal' },
  { code: 'LOG', nameAr: 'اللوجستيات', nameEn: 'Logistics' },
  { code: 'MAI', nameAr: 'الصيانة', nameEn: 'Maintenance' },
  { code: 'MAR', nameAr: 'التسويق', nameEn: 'Marketing' },
  { code: 'PLA', nameAr: 'التخطيط', nameEn: 'Planning' },
  { code: 'PRC', nameAr: 'المشتريات', nameEn: 'Procurement' },
  { code: 'PRD', nameAr: 'الإنتاج', nameEn: 'Production' },
  { code: 'QCD', nameAr: 'مراقبة الجودة', nameEn: 'Quality Control' },
  { code: 'QAD', nameAr: 'ضمان الجودة', nameEn: 'Quality Assurance' },
  { code: 'SAL', nameAr: 'المبيعات', nameEn: 'Sales' },
  { code: 'SEC', nameAr: 'الأمن', nameEn: 'Security' },
  { code: 'SHP', nameAr: 'الشحن', nameEn: 'Shipping' },
  { code: 'STU', nameAr: 'الموظفين', nameEn: 'Staff' },
  { code: 'SCD', nameAr: 'سلسلة التوريد', nameEn: 'Supply Chain' },
];

// تصنيفات المخاطر
const categories = [
  {
    code: 'STR',
    nameAr: 'المخاطر الاستراتيجية',
    nameEn: 'Strategic Risk',
    descriptionAr: 'المخاطر المتعلقة بالقرارات الاستراتيجية والتوجه العام للمنظمة',
    descriptionEn: 'Risks related to strategic decisions and overall organizational direction',
    color: 'bg-purple-500',
    order: 1,
  },
  {
    code: 'FIN',
    nameAr: 'المخاطر المالية',
    nameEn: 'Financial Risk',
    descriptionAr: 'المخاطر المتعلقة بالأداء المالي والتدفقات النقدية',
    descriptionEn: 'Risks related to financial performance and cash flows',
    color: 'bg-green-500',
    order: 2,
  },
  {
    code: 'OPR',
    nameAr: 'المخاطر التشغيلية',
    nameEn: 'Operational Risk',
    descriptionAr: 'المخاطر المتعلقة بالعمليات اليومية والإجراءات التشغيلية',
    descriptionEn: 'Risks related to daily operations and operational procedures',
    color: 'bg-blue-500',
    order: 3,
  },
  {
    code: 'HRR',
    nameAr: 'مخاطر الموارد البشرية',
    nameEn: 'Human Resources Risk',
    descriptionAr: 'المخاطر المتعلقة بالموظفين والكفاءات والموارد البشرية',
    descriptionEn: 'Risks related to employees, competencies and human resources',
    color: 'bg-orange-500',
    order: 4,
  },
  {
    code: 'CLG',
    nameAr: 'مخاطر الالتزام والقانونية والحوكمة',
    nameEn: 'Compliance, Legal, and Governance Risk',
    descriptionAr: 'المخاطر المتعلقة بالامتثال التنظيمي والقوانين والحوكمة',
    descriptionEn: 'Risks related to regulatory compliance, laws and governance',
    color: 'bg-red-500',
    order: 5,
  },
  {
    code: 'TEC',
    nameAr: 'مخاطر التكنولوجيا',
    nameEn: 'Technology Risk',
    descriptionAr: 'المخاطر المتعلقة بالأنظمة التقنية والأمن السيبراني',
    descriptionEn: 'Risks related to technology systems and cybersecurity',
    color: 'bg-cyan-500',
    order: 6,
  },
  {
    code: 'SCR',
    nameAr: 'مخاطر سلاسل الإمداد',
    nameEn: 'Supply Chain Risk',
    descriptionAr: 'المخاطر المتعلقة بسلسلة التوريد والموردين',
    descriptionEn: 'Risks related to supply chain and suppliers',
    color: 'bg-yellow-500',
    order: 7,
  },
  {
    code: 'EHS',
    nameAr: 'مخاطر البيئة والأمن والسلامة',
    nameEn: 'EHS Risk',
    descriptionAr: 'المخاطر المتعلقة بالبيئة والصحة والسلامة المهنية',
    descriptionEn: 'Risks related to environment, health and safety',
    color: 'bg-pink-500',
    order: 8,
  },
];

async function main() {
  console.log('🚀 بدء إضافة البيانات...\n');

  // إضافة الإدارات
  console.log('📁 إضافة الإدارات...');
  for (const dept of departments) {
    try {
      const existing = await prisma.department.findUnique({
        where: { code: dept.code },
      });

      if (existing) {
        console.log(`  ⏭️  ${dept.nameEn} (${dept.code}) موجودة مسبقاً`);
      } else {
        await prisma.department.create({
          data: {
            code: dept.code,
            nameAr: dept.nameAr,
            nameEn: dept.nameEn,
            type: 'department',
          },
        });
        console.log(`  ✅ ${dept.nameEn} (${dept.code}) تم إضافتها`);
      }
    } catch (error) {
      console.log(`  ❌ خطأ في إضافة ${dept.nameEn}: ${error}`);
    }
  }

  console.log('\n📋 إضافة تصنيفات المخاطر...');
  for (const cat of categories) {
    try {
      const existing = await prisma.riskCategory.findUnique({
        where: { code: cat.code },
      });

      if (existing) {
        // تحديث التصنيف الموجود
        await prisma.riskCategory.update({
          where: { code: cat.code },
          data: {
            nameAr: cat.nameAr,
            nameEn: cat.nameEn,
            descriptionAr: cat.descriptionAr,
            descriptionEn: cat.descriptionEn,
            color: cat.color,
            order: cat.order,
            isActive: true,
          },
        });
        console.log(`  🔄 ${cat.nameEn} (${cat.code}) تم تحديثها`);
      } else {
        await prisma.riskCategory.create({
          data: {
            code: cat.code,
            nameAr: cat.nameAr,
            nameEn: cat.nameEn,
            descriptionAr: cat.descriptionAr,
            descriptionEn: cat.descriptionEn,
            color: cat.color,
            order: cat.order,
            isActive: true,
          },
        });
        console.log(`  ✅ ${cat.nameEn} (${cat.code}) تم إضافتها`);
      }
    } catch (error) {
      console.log(`  ❌ خطأ في إضافة ${cat.nameEn}: ${error}`);
    }
  }

  console.log('\n✨ تم الانتهاء من إضافة البيانات!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
