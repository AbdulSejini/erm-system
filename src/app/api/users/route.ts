import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - الحصول على جميع المستخدمين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // بناء شروط البحث
    const where: Record<string, unknown> = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
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
            code: true,
            nameAr: true,
            nameEn: true,
          },
        },
        accessibleDepartments: {
          select: {
            id: true,
            departmentId: true,
            canView: true,
            canEdit: true,
            department: {
              select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true,
              },
            },
          },
        },
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'فشل في جلب المستخدمين' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من البيانات المطلوبة
    if (!body.email || !body.fullName) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني والاسم مطلوبان' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود البريد الإلكتروني مسبقاً
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور
    const defaultPassword = body.password || 'Welcome@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // تحويل departmentId الفارغ إلى null
    const departmentId = body.departmentId && body.departmentId.trim() !== '' ? body.departmentId : null;

    const user = await prisma.user.create({
      data: {
        email: body.email.trim(),
        password: hashedPassword,
        fullName: body.fullName.trim(),
        fullNameEn: body.fullNameEn?.trim() || null,
        role: body.role || 'employee',
        status: body.status || 'active',
        departmentId: departmentId,
        phone: body.phone?.trim() || null,
      },
      select: {
        id: true,
        fullName: true,
        fullNameEn: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء المستخدم';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
