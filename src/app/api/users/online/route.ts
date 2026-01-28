import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET - Get online users (users who logged in within the last 15 minutes)
export async function GET() {
  try {
    const session = await auth();

    // Only admin and riskManager can see online users
    if (!session?.user?.role || !['admin', 'riskManager'].includes(session.user.role)) {
      return NextResponse.json({ users: [] });
    }

    // Consider users online if they logged in within the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const onlineUsers = await prisma.user.findMany({
      where: {
        status: 'active',
        lastLogin: {
          gte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        lastLogin: true,
        department: {
          select: {
            nameAr: true,
            nameEn: true,
          },
        },
      },
      orderBy: {
        lastLogin: 'desc',
      },
      take: 20, // Limit to 20 users
    });

    return NextResponse.json({
      users: onlineUsers,
      count: onlineUsers.length,
    });
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online users', users: [] },
      { status: 500 }
    );
  }
}

// POST - Update user's last activity (heartbeat)
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update last login to mark user as active
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}
