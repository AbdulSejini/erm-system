import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hrRisks } from '@/data/hrRisks';

// Helper function to calculate rating
function calculateRating(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'Major';
  if (score >= 10) return 'Moderate';
  if (score >= 5) return 'Minor';
  return 'Negligible';
}

// POST - Migrate all HR risks to database
export async function POST() {
  try {
    // Get or create HR department
    let hrDepartment = await prisma.department.findFirst({
      where: {
        OR: [
          { code: 'HR' },
          { nameAr: 'الموارد البشرية' },
          { nameEn: 'Human Resources' },
        ],
      },
    });

    if (!hrDepartment) {
      hrDepartment = await prisma.department.create({
        data: {
          code: 'HR',
          nameAr: 'الموارد البشرية',
          nameEn: 'Human Resources',
        },
      });
    }

    // Get or create HR category
    let hrCategory = await prisma.riskCategory.findFirst({
      where: {
        OR: [
          { code: 'HR' },
          { nameAr: 'الموارد البشرية' },
        ],
      },
    });

    if (!hrCategory) {
      hrCategory = await prisma.riskCategory.create({
        data: {
          code: 'HR',
          nameAr: 'الموارد البشرية',
          nameEn: 'Human Resources',
          descriptionAr: 'مخاطر متعلقة بالموارد البشرية والموظفين',
          descriptionEn: 'Risks related to human resources and employees',
          color: '#8B5CF6',
          isActive: true,
        },
      });
    }

    // Get default user for createdBy
    const defaultUser = await prisma.user.findFirst({
      where: { status: 'active' },
    });

    if (!defaultUser) {
      return NextResponse.json(
        { success: false, error: 'No active user found to assign as creator' },
        { status: 400 }
      );
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const hrRisk of hrRisks) {
      try {
        // Check if risk already exists
        const existing = await prisma.risk.findUnique({
          where: { riskNumber: hrRisk.riskId },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Calculate scores
        const inherentScore = hrRisk.likelihood * hrRisk.impact;
        const residualScore = (hrRisk.residualLikelihood || hrRisk.likelihood) * (hrRisk.residualImpact || hrRisk.impact);

        // Create the risk
        await prisma.risk.create({
          data: {
            riskNumber: hrRisk.riskId,
            titleAr: hrRisk.descriptionAr.substring(0, 100),
            titleEn: hrRisk.descriptionEn.substring(0, 100),
            descriptionAr: hrRisk.descriptionAr,
            descriptionEn: hrRisk.descriptionEn,
            categoryId: hrCategory.id,
            departmentId: hrDepartment.id,
            status: hrRisk.status === 'Open' ? 'open' : hrRisk.status === 'In Progress' ? 'inProgress' : 'closed',
            inherentLikelihood: hrRisk.likelihood,
            inherentImpact: hrRisk.impact,
            inherentScore: inherentScore,
            inherentRating: calculateRating(inherentScore),
            residualLikelihood: hrRisk.residualLikelihood || null,
            residualImpact: hrRisk.residualImpact || null,
            residualScore: residualScore,
            residualRating: calculateRating(residualScore),
            potentialCauseAr: null,
            potentialCauseEn: null,
            potentialImpactAr: null,
            potentialImpactEn: null,
            layersOfProtectionAr: hrRisk.existingControlsAr || null,
            layersOfProtectionEn: hrRisk.existingControlsEn || null,
            processText: 'الموارد البشرية',
            subProcessText: null,
            identifiedDate: hrRisk.createdAt,
            ownerId: defaultUser.id,
            createdById: defaultUser.id,
            approvalStatus: 'Draft',
          },
        });

        results.added++;
      } catch (error) {
        console.error(`Error creating risk ${hrRisk.riskId}:`, error);
        results.errors.push(`Failed to create ${hrRisk.riskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete: ${results.added} added, ${results.skipped} skipped`,
      results,
    });
  } catch (error) {
    console.error('Error in HR risks migration:', error);
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
