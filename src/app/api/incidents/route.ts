import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Fetch all incidents (placeholder - incidents table not implemented yet)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return empty array since we don't have incidents table
    // This prevents the JSON parse error
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Incidents feature coming soon'
    });

  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

// POST - Create a new incident
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Incidents table not implemented yet
    return NextResponse.json({
      success: false,
      error: 'Incidents feature coming soon'
    }, { status: 501 });

  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}
