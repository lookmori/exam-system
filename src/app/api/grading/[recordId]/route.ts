import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/grading/[recordId] — get record with paper and questions for grading
export async function GET(req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({
    where: { recordId },
    include: {
      paper: {
        select: {
          paperId: true,
          paperTitle: true,
          teacherId: true,
          totalScore: true,
          passScore: true,
        },
      },
      student: { select: { username: true } },
    },
  });

  if (!record || record.paper.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const paperQuestions = await prisma.paperQuestion.findMany({
    where: { paperId: record.paperId },
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
  });

  return NextResponse.json({
    record: {
      recordId: record.recordId,
      answerContent: record.answerContent,
      score: record.score,
      status: record.status,
      submitTime: record.submitTime,
      answerImgs: record.answerImgs,
    },
    paper: {
      paperTitle: record.paper.paperTitle,
      totalScore: record.paper.totalScore,
      passScore: record.paper.passScore,
      teacherId: record.paper.teacherId,
    },
    student: record.student,
    questions: paperQuestions.map((pq) => ({
      question: pq.question,
      sort: pq.sort,
      score: pq.score,
    })),
  });
}

// PATCH /api/grading/[recordId] — save manual scores
export async function PATCH(req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({
    where: { recordId },
    include: { paper: { select: { teacherId: true } } },
  });

  if (!record || record.paper.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { scores, comments, commentImgs } = await req.json(); // { [questionId]: number }, { [questionId]: string }, { [questionId]: string[] }

  // Calculate auto-score for objective questions
  const paperQuestions = await prisma.paperQuestion.findMany({
    where: { paperId: record.paperId },
    include: { question: { select: { questionId: true, answer: true, questionType: true } } },
  });

  const answers = (record.answerContent as Record<string, string>) || {};
  const objectiveTypes = ["single_choice", "multi_choice", "true_false"];
  let totalScore = 0;

  for (const pq of paperQuestions) {
    if (objectiveTypes.includes(pq.question.questionType)) {
      const studentAnswer = answers[pq.questionId]?.trim();
      const correctAnswer = pq.question.answer?.trim();
      if (studentAnswer && studentAnswer === correctAnswer) {
        totalScore += pq.score;
      }
    } else if (scores?.[pq.questionId] !== undefined) {
      totalScore += scores[pq.questionId];
    }
  }

  // Merge comments and commentImgs into existing
  const existingComments = (record.gradingComments as Record<string, string>) || {};
  const existingCommentImgs = (record.gradingCommentImgs as Record<string, string[]>) || {};
  const mergedComments = comments ? { ...existingComments, ...comments } : existingComments;
  const mergedCommentImgs = commentImgs ? { ...existingCommentImgs, ...commentImgs } : existingCommentImgs;

  await prisma.examRecord.update({
    where: { recordId },
    data: {
      score: totalScore,
      status: "graded",
      gradingComments: mergedComments,
      gradingCommentImgs: mergedCommentImgs,
      gradedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, score: totalScore });
}
