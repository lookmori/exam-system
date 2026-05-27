import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({
    where: { recordId },
    select: { studentId: true, status: true, violations: true },
  });
  if (!record || record.studentId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (record.status !== "in_progress") {
    return NextResponse.json({ error: "考试已结束" }, { status: 400 });
  }

  const { violations } = await req.json();
  if (!Array.isArray(violations)) {
    return NextResponse.json({ error: "无效数据" }, { status: 400 });
  }

  // Merge new violations with existing ones
  const existing = (record.violations as any[]) || [];
  const merged = [...existing, ...violations];

  await prisma.examRecord.update({
    where: { recordId },
    data: { violations: merged },
  });

  return NextResponse.json({ success: true, total: merged.length });
}
