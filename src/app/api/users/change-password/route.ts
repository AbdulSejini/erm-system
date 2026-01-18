import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';

// POST - تغيير كلمة المرور (للمستخدم الحالي)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول أولاً' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال كلمة المرور الحالية والجديدة' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // جلب المستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    // التحقق من كلمة المرور الحالية
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تغيير كلمة المرور' },
      { status: 500 }
    );
  }
}
