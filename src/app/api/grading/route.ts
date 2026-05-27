import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/grading — list records ready for grading
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId");
  const schoolId = searchParams.get("schoolId");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const where: Record<string, unknown> = {
    status: { in: ["submitted", "graded"] },
    paper: { teacherId: session.user.id },
  };

  if (paperId) where.paperId = paperId;
  if (schoolId) where.paper = { ...(where.paper as object), schoolId };

  const [records, total] = await Promise.all([
    prisma.examRecord.findMany({
      where,
      orderBy: { submitTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        paper: { select: { paperTitle: true, totalScore: true } },
        student: { select: { username: true } },
      },
    }),
    prisma.examRecord.count({ where }),
  ]);

  return NextResponse.json({ records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
