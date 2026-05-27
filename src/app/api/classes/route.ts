import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/classes?schoolId=xxx — list classes for a school
export async function GET(req: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "school_admin" && role !== "teacher" && role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  if (!schoolId) return NextResponse.json({ error: "缺少学校ID" }, { status: 400 });

  if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id, schoolId },
    });
    if (!ts) return NextResponse.json({ error: "无权限操作此学校" }, { status: 403 });
  }

  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: { classId: true, className: true },
    orderBy: { className: "asc" },
  });

  return NextResponse.json({ classes });
}

export async function POST(req: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "school_admin" && role !== "teacher" && role !== "super_admin")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { className, schoolId } = await req.json();
  if (!className || !schoolId) {
    return NextResponse.json({ error: "班级名称和学校ID不能为空" }, { status: 400 });
  }

  // Verify teacher belongs to this school
  if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id, schoolId },
    });
    if (!ts) return NextResponse.json({ error: "无权限操作此学校" }, { status: 403 });
  }

  const cls = await prisma.class.create({
    data: { className, schoolId },
  });
  return NextResponse.json(cls, { status: 201 });
}
