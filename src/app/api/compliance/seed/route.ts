import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { OBLIGATIONS, DOMAINS, REG_BODIES } from './data';

// Vercel function config - extend timeout for seed operation
export const maxDuration = 60;

// Deduplicate domains by code (keep first occurrence)
function getUniqueDomains() {
  const seen = new Set<string>();
  return DOMAINS.filter(d => {
    if (seen.has(d.code)) return false;
    seen.add(d.code);
    return true;
  });
}

// Resolve regulatory body name → best match code
function matchRegBodyCode(nameAr: string | null): string | null {
  if (!nameAr) return null;
  const found = REG_BODIES.find(r => r.nameAr === nameAr || nameAr.includes(r.nameAr) || r.nameAr.includes(nameAr));
  return found ? found.code : 'OTH';
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'riskManager'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Check if data already seeded
    const existingCount = await prisma.complianceObligation.count();
    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        error: `بيانات الالتزام موجودة بالفعل. عدد السجلات الحالية: ${existingCount}`,
        existingCount,
      }, { status: 400 });
    }

    const uniqueDomains = getUniqueDomains();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ComplianceDomain records
      const domainIdMap = new Map<string, string>();
      for (let i = 0; i < uniqueDomains.length; i++) {
        const d = uniqueDomains[i];
        const created = await tx.complianceDomain.create({
          data: {
            code: d.code,
            nameAr: d.nameAr,
            nameEn: d.nameEn,
            order: i + 1,
          },
        });
        domainIdMap.set(d.code, created.id);
      }

      // 2. Create RegulatoryBody records
      const regBodyIdMap = new Map<string, string>();
      for (const rb of REG_BODIES) {
        const created = await tx.regulatoryBody.create({
          data: {
            code: rb.code,
            nameAr: rb.nameAr,
            nameEn: rb.nameEn,
          },
        });
        regBodyIdMap.set(rb.code, created.id);
        // Also index by nameAr for lookup
        regBodyIdMap.set(rb.nameAr, created.id);
      }

      // 3. Create ComplianceObligation records (529)
      const obligationIds: { id: string; code: string }[] = [];

      for (const row of OBLIGATIONS) {
        const [
          code, seq, domainCode, subDomainAr, titleAr, titleEn,
          regulatoryRef, articleNum, internalPolicyAr, regulatoryBodyAr,
          obligationType, responsibleDeptAr, directOwnerAr,
          defenseLine, recurrence, criticality, likelihood, impact,
          penalties, status, completion, controlMechanism, evidence,
          gapDesc, remPlan, remOwner, remStatus, kpi, notes,
        ] = row;

        const domainId = domainIdMap.get(domainCode as string) || '';
        if (!domainId) continue; // skip if domain not found

        const regBodyCode = matchRegBodyCode(regulatoryBodyAr as string | null);
        const regBodyId = regBodyCode ? (regBodyIdMap.get(regBodyCode as string) || null) : null;

        const lk = (likelihood as number) || 1;
        const imp = (impact as number) || 1;
        const riskScore = lk * imp;
        const riskRating = riskScore >= 20 ? 'critical'
          : riskScore >= 12 ? 'high'
          : riskScore >= 6 ? 'medium'
          : riskScore >= 2 ? 'low' : 'veryLow';

        const obligation = await tx.complianceObligation.create({
          data: {
            code: code as string,
            sequenceNumber: seq as number,
            domainId,
            subDomainAr: subDomainAr as string | null,
            titleAr: titleAr as string,
            titleEn: (titleEn as string | null) ?? (titleAr as string),
            regulatoryReference: regulatoryRef as string | null,
            articleNumber: articleNum as string | null,
            internalPolicyAr: internalPolicyAr as string | null,
            regulatoryBodyId: regBodyId,
            obligationType: (obligationType as string) || 'mandatory',
            responsibleDepartmentAr: responsibleDeptAr as string | null,
            directOwnerAr: directOwnerAr as string | null,
            defenseLine: defenseLine as string | null,
            recurrence: recurrence as string | null,
            criticalityLevel: (criticality as string) || 'medium',
            nonComplianceLikelihood: lk,
            nonComplianceImpact: imp,
            riskScore: riskScore > 0 ? riskScore : null,
            riskRating: riskScore > 0 ? riskRating : null,
            potentialPenaltiesAr: penalties as string | null,
            complianceStatus: (status as string) || 'notAssessed',
            completionPercentage: (completion as number) || 0,
            controlActivitiesAr: controlMechanism as string | null,
            evidenceRequirementsAr: evidence as string | null,
            gapDescriptionAr: gapDesc as string | null,
            remediationPlanAr: remPlan as string | null,
            remediationOwnerAr: remOwner as string | null,
            remediationStatus: remStatus as string | null,
            kpiKriAr: kpi as string | null,
            notesAr: notes as string | null,
            alertDaysBefore: 30,
            createdById: session.user.id,
          },
        });

        obligationIds.push({ id: obligation.id, code: obligation.code });
      }

      return {
        domains: uniqueDomains.length,
        regulatoryBodies: REG_BODIES.length,
        obligations: obligationIds.length,
      };
    }, { timeout: 60000 });

    return NextResponse.json({
      success: true,
      message: `تم استيراد ${result.obligations} التزام من سجل الامتثال الرئيسي بنجاح`,
      data: result,
    });
  } catch (error) {
    console.error('Compliance seed error:', error);
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء استيراد البيانات',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
