import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/api-auth';
import { createAuditLog, getClientInfo } from '@/lib/audit';

// POST - إعادة تعيين كلمة المرور (للمسؤول فقط)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ⚠️ AUTHENTICATION: admin only — this is a privileged operation that can
  // grant an attacker full takeover of any account if left unguarded.
  const authResult = await requireAuth(request, { roles: ['admin'] });
  if ('error' in authResult) return authResult.error;

  try {
    const { id } = await params;

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // كلمة المرور الافتراضية
    const defaultPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Audit trail — password reset is a sensitive action
    const clientInfo = getClientInfo(request);
    await createAuditLog({
      userId: authResult.userId,
      action: 'update',
      entity: 'user',
      entityId: id,
      newValues: { passwordReset: true, targetEmail: existingUser.email },
      ...clientInfo,
    });

    // NOTE: We intentionally do NOT return the plaintext password in the
    // response body. The admin should communicate the default credential
    // out-of-band to the user (and the user should change it on first login).
    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح. كلمة المرور الافتراضية: Welcome@123',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إعادة تعيين كلمة المرور' },
      { status: 500 }
    );
  }
}
