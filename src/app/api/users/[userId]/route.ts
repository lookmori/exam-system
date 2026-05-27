import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "super_admin" && role !== "school_admin" && role !== "teacher")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { userId } = await params;
  const target = await prisma.user.findUnique({
    where: { userId },
    select: { schoolId: true, role: true },
  });
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  // school_admin and teacher can only modify users in their own school (non-super_admin only)
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    if (!admin?.adminSchoolId || target.schoolId !== admin.adminSchoolId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    // school_admin cannot change roles or modify super_admin
    if (target.role === "super_admin") return NextResponse.json({ error: "无权限" }, { status: 403 });
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id },
      select: { schoolId: true },
    });
    if (!ts || target.schoolId !== ts.schoolId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    // teacher can only modify students, not other teachers/admins
    if (target.role !== "student") return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  // Only super_admin can change roles
  if (body.role && role === "super_admin") data.role = body.role;
  if (body.password) data.password = await bcrypt.hash(body.password, 12);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "无更新内容" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { userId },
    data,
    select: { userId: true, username: true, role: true, status: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "super_admin" && role !== "school_admin" && role !== "teacher")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { userId } = await params;

  // Prevent deleting yourself
  if (userId === session.user.id) {
    return NextResponse.json({ error: "不能删除自己" }, { status: 403 });
  }

  // Prevent deleting super_admin accounts
  const target = await prisma.user.findUnique({
    where: { userId },
    select: { role: true, userId: true, schoolId: true },
  });

  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (target.role === "super_admin") {
    return NextResponse.json({ error: "不能删除超级管理员" }, { status: 403 });
  }

  // school_admin and teacher can only delete users in their own school
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    const adminSchoolId = admin?.adminSchoolId;
    if (!adminSchoolId || target.schoolId !== adminSchoolId) {
      return NextResponse.json({ error: "无权限删除此用户" }, { status: 403 });
    }
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id },
      select: { schoolId: true },
    });
    if (!ts || target.schoolId !== ts.schoolId) {
      return NextResponse.json({ error: "无权限删除此用户" }, { status: 403 });
    }
  }

  await prisma.user.delete({ where: { userId } });
  return NextResponse.json({ success: true });
}
