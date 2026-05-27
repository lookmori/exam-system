import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { schoolSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function checkSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== "super_admin") return null;
  return session.user;
}

export async function GET() {
  const user = await checkSuperAdmin();
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, classes: true, examPapers: true } },
    },
  });
  return NextResponse.json(schools);
}

export async function POST(req: Request) {
  const user = await checkSuperAdmin();
  if (!user) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const body = await req.json();
  const parsed = schoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const school = await prisma.school.create({
    data: { schoolName: parsed.data.schoolName },
  });
  return NextResponse.json(school);
}
