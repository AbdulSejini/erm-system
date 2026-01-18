import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST - إعادة تعيين كلمة المرور (للمسؤول)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // التحقق من وجود المستخدم
    const existingUser = await prisma.user.findUnique({
      where: { id },
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

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح',
      defaultPassword: defaultPassword, // نرسلها للمسؤول ليبلغ المستخدم
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في إعادة تعيين كلمة المرور' },
      { status: 500 }
    );
  }
}
