import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/papers/public — browse public papers from all schools
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");

  const where: Record<string, unknown> = {
    isPublic: true,
    paperStatus: "published",
  };

  if (keyword) {
    where.paperTitle = { contains: keyword };
  }

  const [papers, total] = await Promise.all([
    prisma.examPaper.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { paperQuestions: true } },
        school: { select: { schoolName: true } },
        teacher: { select: { name: true } },
      },
    }),
    prisma.examPaper.count({ where }),
  ]);

  return NextResponse.json({
    papers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
