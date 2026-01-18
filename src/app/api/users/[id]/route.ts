import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - الحصول على مستخدم محدد
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المستخدم' },
      { status: 500 }
    );
  }
}

// PATCH - تحديث مستخدم
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    // إذا كان هناك تحديث للبريد الإلكتروني، تحقق من عدم استخدامه
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.fullNameEn !== undefined) updateData.fullNameEn = body.fullNameEn;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في حذف المستخدم' },
      { status: 500 }
    );
  }
}
