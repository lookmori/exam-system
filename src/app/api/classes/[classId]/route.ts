import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "school_admin" && role !== "teacher" && role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { classId } = await params;
  const cls = await prisma.class.findUnique({
    where: { classId },
    include: {
      school: { select: { schoolId: true, schoolName: true } },
      users: {
        where: { role: "student" },
        select: { userId: true, username: true, name: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!cls) return NextResponse.json({ error: "班级不存在" }, { status: 404 });

  // Verify user belongs to the same school
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    if (admin?.adminSchoolId !== cls.schoolId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id, schoolId: cls.schoolId },
    });
    if (!ts) return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  return NextResponse.json(cls);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "school_admin" && role !== "teacher" && role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { classId } = await params;
  const cls = await prisma.class.findUnique({
    where: { classId },
    select: { schoolId: true },
  });
  if (!cls) {
    return NextResponse.json({ error: "班级不存在" }, { status: 404 });
  }

  // Verify user belongs to the same school as the class
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    if (admin?.adminSchoolId !== cls.schoolId) {
      return NextResponse.json({ error: "无权限删除此班级" }, { status: 403 });
    }
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id, schoolId: cls.schoolId },
    });
    if (!ts) {
      return NextResponse.json({ error: "无权限删除此班级" }, { status: 403 });
    }
  }

  await prisma.class.delete({ where: { classId } });
  return NextResponse.json({ success: true });
}
