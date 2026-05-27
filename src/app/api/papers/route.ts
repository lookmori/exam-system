import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/papers — list papers for teacher
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  if (!schoolId) return NextResponse.json({ error: "缺少学校ID" }, { status: 400 });

  const where: Record<string, unknown> = { schoolId, teacherId: session.user.id };
  if (status && status !== "all") where.paperStatus = status;

  const [papers, total] = await Promise.all([
    prisma.examPaper.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { paperQuestions: true, examRecords: true } },
      },
    }),
    prisma.examPaper.count({ where }),
  ]);

  return NextResponse.json({ papers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

// POST /api/papers — create a new paper
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperTitle, schoolId, startTime, endTime, examDuration, isPublic, classIds, totalScore, passScore, isRetry, questions } = await req.json();

  if (!paperTitle || !schoolId || !examDuration) {
    return NextResponse.json({ error: "必填字段不能为空" }, { status: 400 });
  }

  const paper = await prisma.examPaper.create({
    data: {
      paperTitle,
      schoolId,
      teacherId: session.user.id,
      // datetime-local 输入不含时区，显式指定 +08:00（北京时间）
      startTime: startTime ? new Date(startTime + ":00+08:00") : new Date(),
      endTime: endTime ? new Date(endTime + ":00+08:00") : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      examDuration,
      isPublic: isPublic || false,
      classIds: classIds || [],
      totalScore: totalScore || 0,
      passScore: passScore || null,
      isRetry: isRetry || false,
      paperStatus: "draft",
      paperQuestions: questions?.length
        ? {
            create: questions.map((q: { questionId: string; sort: number; score: number }, i: number) => ({
              questionId: q.questionId,
              sort: q.sort ?? i,
              score: q.score ?? 1,
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json({ paper }, { status: 201 });
}
