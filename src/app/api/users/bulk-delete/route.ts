import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "super_admin" && role !== "school_admin" && role !== "teacher")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  let userSchoolId: string | null = null;
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    userSchoolId = admin?.adminSchoolId ?? null;
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({ where: { teacherId: session.user.id }, select: { schoolId: true } });
    userSchoolId = ts?.schoolId ?? null;
  }

  const { userIds } = await req.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "请选择要删除的用户" }, { status: 400 });
  }

  let deleted = 0;
  let skipped = 0;

  for (const userId of userIds) {
    const target = await prisma.user.findUnique({
      where: { userId },
      select: { role: true, userId: true, schoolId: true },
    });

    if (!target) continue;
    if (target.role === "super_admin" || target.userId === session.user.id) {
      skipped++;
      continue;
    }

    // school_admin and teacher can only delete users in their own school
    if (role !== "super_admin") {
      if (!userSchoolId || target.schoolId !== userSchoolId) {
        skipped++;
        continue;
      }
    }

    await prisma.user.delete({ where: { userId } });
    deleted++;
  }

  return NextResponse.json({ deleted, skipped });
}
