import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userCreateSchema } from "@/lib/validations";
import { generateUniqueAccount } from "@/lib/utils";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

async function checkSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") return null;
  return session.user;
}

export async function GET(req: Request) {
  const user = await checkSuperAdmin();
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const role = url.searchParams.get("role") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) where.username = { contains: search, mode: "insensitive" };
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        userId: true, username: true, name: true, role: true, status: true,
        createdAt: true,
        school: { select: { schoolId: true, schoolName: true } },
        class: { select: { classId: true, className: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await req.json();
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { role, schoolId, classId } = parsed.data;
  const name = parsed.data.name || null;

  // 自动生成8位数字账号
  const username = parsed.data.username || await generateUniqueAccount(role);
  // 默认密码 123456
  const password = parsed.data.password || "123456";

  // super_admin can create any role
  // school_admin / teacher can only create student (or teacher for school_admin) in their own school
  if (session.user.role === "school_admin" || session.user.role === "teacher") {
    const allowedRoles = session.user.role === "school_admin" ? ["teacher", "student"] : ["student"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "无权限创建此角色" }, { status: 403 });
    }

    let adminSchoolId: string | null = null;
    if (session.user.role === "school_admin") {
      const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
      adminSchoolId = admin?.adminSchoolId ?? null;
    } else {
      const ts = await prisma.teacherSchool.findFirst({ where: { teacherId: session.user.id }, select: { schoolId: true } });
      adminSchoolId = ts?.schoolId ?? null;
    }

    if (!adminSchoolId || adminSchoolId !== schoolId) {
      return NextResponse.json({ error: "无权限操作此学校" }, { status: 403 });
    }
  } else if (session.user.role !== "super_admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "账号已存在，请重试" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);

  const newUser = await prisma.user.create({
    data: {
      username, name, password: hashed, role,
      ...(schoolId && { schoolId }),
      ...(classId && { classId }),
      ...(role === "school_admin" && schoolId ? { adminSchoolId: schoolId } : {}),
    },
    select: { userId: true, username: true, name: true, role: true, status: true, createdAt: true },
  });

  // Auto-create teacher-school association for teacher role
  if (role === "teacher" && schoolId) {
    await prisma.teacherSchool.create({
      data: { teacherId: newUser.userId, schoolId },
    });
  }

  return NextResponse.json(newUser, { status: 201 });
}
