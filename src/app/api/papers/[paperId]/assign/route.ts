import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/papers/[paperId]/assign — assign a public paper to teacher's own school
export async function POST(
  req: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperId } = await params;
  const { schoolId, startTime, endTime, examDuration, classIds, isPublic, isRetry, passScore } = await req.json();

  if (!schoolId || !examDuration || !classIds || classIds.length === 0) {
    return NextResponse.json({ error: "学校、时长和班级为必填项" }, { status: 400 });
  }

  // Verify teacher belongs to the target school
  const ts = await prisma.teacherSchool.findFirst({
    where: { teacherId: session.user.id, schoolId },
  });
  if (!ts) {
    return NextResponse.json({ error: "无权限操作此学校" }, { status: 403 });
  }

  // Verify source paper exists, is published, and is public
  const source = await prisma.examPaper.findUnique({
    where: { paperId },
    include: {
      paperQuestions: { select: { questionId: true, sort: true, score: true } },
    },
  });

  if (!source || source.paperStatus !== "published") {
    return NextResponse.json({ error: "试卷不可用" }, { status: 400 });
  }

  if (!source.isPublic) {
    return NextResponse.json({ error: "该试卷未公开" }, { status: 400 });
  }

  // Create a new paper for the teacher
  const paper = await prisma.examPaper.create({
    data: {
      paperTitle: source.paperTitle,
      schoolId,
      teacherId: session.user.id,
      startTime: startTime ? new Date(startTime + ":00+08:00") : source.startTime,
      endTime: endTime ? new Date(endTime + ":00+08:00") : source.endTime,
      examDuration: examDuration || source.examDuration,
      isPublic: isPublic ?? false,
      isRetry: isRetry ?? false,
      classIds,
      totalScore: source.totalScore,
      passScore: passScore ?? source.passScore,
      paperStatus: "draft",
      paperQuestions: source.paperQuestions.length > 0
        ? {
            create: source.paperQuestions.map((q) => ({
              questionId: q.questionId,
              sort: q.sort,
              score: q.score,
            })),
          }
        : undefined,
    },
  });

  return NextResponse.json({ paper }, { status: 201 });
}
