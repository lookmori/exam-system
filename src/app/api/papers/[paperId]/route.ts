import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/papers/[paperId]
export async function GET(req: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({
    where: { paperId },
    include: {
      paperQuestions: {
        orderBy: { sort: "asc" },
        include: {
          question: {
            select: {
              questionId: true,
              title: true,
              titleImgs: true,
              questionType: true,
              optionContent: true,
              optionImgs: true,
              score: true,
              answer: true,
              analysis: true,
              analysisImgs: true,
            },
          },
        },
      },
    },
  });

  if (!paper || paper.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  return NextResponse.json({ paper });
}

// PATCH /api/papers/[paperId]
export async function PATCH(req: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({ where: { paperId } });

  if (!paper || paper.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperTitle, startTime, endTime, examDuration, isPublic, classIds, totalScore, passScore, isRetry, questions } = await req.json();

  // Update questions if provided
  if (questions) {
    await prisma.paperQuestion.deleteMany({ where: { paperId } });
    if (questions.length > 0) {
      await prisma.paperQuestion.createMany({
        data: questions.map((q: { questionId: string; sort: number; score: number }, i: number) => ({
          paperId,
          questionId: q.questionId,
          sort: q.sort ?? i,
          score: q.score ?? 1,
        })),
      });
    }
  }

  const updated = await prisma.examPaper.update({
    where: { paperId },
    data: {
      ...(paperTitle !== undefined && { paperTitle }),
      // datetime-local 输入不含时区，显式指定 +08:00（北京时间）
      ...(startTime !== undefined && { startTime: startTime ? new Date(startTime + ":00+08:00") : undefined }),
      ...(endTime !== undefined && { endTime: endTime ? new Date(endTime + ":00+08:00") : undefined }),
      ...(examDuration !== undefined && { examDuration }),
      ...(isPublic !== undefined && { isPublic }),
      ...(classIds !== undefined && { classIds }),
      ...(totalScore !== undefined && { totalScore }),
      ...(passScore !== undefined && { passScore }),
      ...(isRetry !== undefined && { isRetry }),
    },
  });

  return NextResponse.json({ paper: updated });
}

// DELETE /api/papers/[paperId]
export async function DELETE(req: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({ where: { paperId } });

  if (!paper || paper.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await prisma.examPaper.update({
    where: { paperId },
    data: { paperStatus: "removed" },
  });

  return NextResponse.json({ success: true });
}
