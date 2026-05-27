import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET — load exam data
export async function GET(req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({
    where: { recordId },
    include: {
      paper: {
        select: {
          paperId: true,
          paperTitle: true,
          examDuration: true,
          totalScore: true,
          passScore: true,
          paperStatus: true,
        },
      },
    },
  });

  if (!record || record.studentId !== session.user.id || record.paper.paperStatus === "removed") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (record.status !== "in_progress") {
    return NextResponse.json({ error: "考试已结束" }, { status: 400 });
  }

  const paperQuestions = await prisma.paperQuestion.findMany({
    where: { paperId: record.paperId },
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
    orderBy: { sort: "asc" },
  });

  const paper = {
    paperId: record.paper.paperId,
    paperTitle: record.paper.paperTitle,
    examDuration: record.paper.examDuration,
    totalScore: record.paper.totalScore,
    passScore: record.paper.passScore,
    questions: paperQuestions.map(pq => ({
      question: pq.question,
      sort: pq.sort,
      score: pq.score,
    })),
  };

  return NextResponse.json({
    paper,
    record: {
      answerContent: record.answerContent,
      startTime: record.startTime,
    },
  });
}

// PATCH — save answers
export async function PATCH(req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({ where: { recordId }, include: { paper: { select: { paperStatus: true } } } });
  if (!record || record.studentId !== session.user.id || record.paper.paperStatus === "removed") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (record.status !== "in_progress") {
    return NextResponse.json({ error: "考试已结束" }, { status: 400 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.answers) data.answerContent = body.answers;
  if (body.violations && Array.isArray(body.violations)) {
    const record = await prisma.examRecord.findUnique({ where: { recordId }, select: { violations: true } });
    const existing = (record?.violations as any[]) || [];
    data.violations = [...existing, ...body.violations];
  }

  if (Object.keys(data).length > 0) {
    await prisma.examRecord.update({ where: { recordId }, data });
  }

  return NextResponse.json({ success: true });
}

// POST — submit exam
export async function POST(req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({ where: { recordId }, include: { paper: { select: { paperStatus: true } } } });
  if (!record || record.studentId !== session.user.id || record.paper.paperStatus === "removed") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (record.status !== "in_progress") {
    return NextResponse.json({ error: "考试已结束" }, { status: 400 });
  }

  const { answers } = await req.json();

  // Calculate auto-score for objective questions
  const paperQuestions = await prisma.paperQuestion.findMany({
    where: { paperId: record.paperId },
    include: { question: { select: { questionId: true, answer: true, questionType: true, score: true } } },
  });

  let autoScore = 0;
  const objectiveTypes = ["single_choice", "multi_choice", "true_false"];
  let hasProgramming = false;
  for (const pq of paperQuestions) {
    if (pq.question.questionType === "programming") {
      hasProgramming = true;
    }
    if (objectiveTypes.includes(pq.question.questionType)) {
      const studentAnswer = answers?.[pq.questionId];
      const correctAnswer = pq.question.answer;
      if (studentAnswer && studentAnswer.trim() === correctAnswer.trim()) {
        autoScore += pq.score;
      }
    }
  }

  // If no programming questions, auto-grade completely
  const isAutoGraded = !hasProgramming;

  await prisma.examRecord.update({
    where: { recordId },
    data: {
      answerContent: answers,
      status: isAutoGraded ? "graded" : "submitted",
      score: isAutoGraded ? autoScore : null,
      submitTime: new Date(),
      ...(isAutoGraded ? { gradedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ success: true, autoScore, autoGraded: isAutoGraded });
}
