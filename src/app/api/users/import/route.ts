import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueAccount } from "@/lib/utils";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "super_admin" && role !== "school_admin" && role !== "teacher")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  // Get user's school for school_admin/teacher
  let userSchoolId: string | null = null;
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    userSchoolId = admin?.adminSchoolId ?? null;
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({ where: { teacherId: session.user.id }, select: { schoolId: true } });
    userSchoolId = ts?.schoolId ?? null;
  }

  const { rows } = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "无有效数据" }, { status: 400 });
  }

  let success = 0;
  let failed = 0;
  const created: { name: string | null; username: string }[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const name = row._name || row.name || null;

      // Resolve school
      let schoolId: string | null = null;
      if (row.schoolName) {
        let school = await prisma.school.findFirst({ where: { schoolName: row.schoolName } });
        if (!school && role === "super_admin") {
          school = await prisma.school.create({ data: { schoolName: row.schoolName } });
        }
        if (school) schoolId = school.schoolId;
      }

      // Non-super_admin users can only create in their own school
      if (role !== "super_admin") {
        if (!userSchoolId) { failed++; errors.push("无权操作学校"); continue; }
        schoolId = userSchoolId;
      }

      // Resolve class — prefer direct classId, fallback to className
      let classId: string | null = row.classId || null;
      if (!classId && row.className && schoolId) {
        let cls = await prisma.class.findFirst({
          where: { schoolId, className: row.className },
        });
        if (!cls) {
          cls = await prisma.class.create({ data: { schoolId, className: row.className } });
        }
        classId = cls.classId;
      }

      let username = row._username || row.username;
      if (!username || username.trim() === "" || username === "(自动生成)") {
        username = await generateUniqueAccount(row.role);
      }

      const hashed = await bcrypt.hash(row._password || row.password || "123456", 12);

      const newUser = await prisma.user.create({
        data: {
          username,
          name,
          password: hashed,
          role: row.role,
          ...(schoolId && { schoolId }),
          ...(classId && { classId }),
          ...(row.role === "school_admin" && schoolId ? { adminSchoolId: schoolId } : {}),
        },
      });

      created.push({ name: name || newUser.username, username });
      success++;

      // Auto-create teacher-school association for teacher role (non-fatal)
      if (row.role === "teacher" && schoolId) {
        try {
          await prisma.teacherSchool.create({
            data: { teacherId: newUser.userId, schoolId },
          });
        } catch { /* teacher-school association failed but user was created */ }
      }
    } catch (e) {
      failed++;
      errors.push(String(e instanceof Error ? e.message : e));
    }
  }

  return NextResponse.json({ success, failed, created, ...(errors.length > 0 && { errors: errors.slice(0, 5) }) });
}
