import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/questions/[questionId]
export async function GET(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { questionId } = await params;
  const question = await prisma.question.findUnique({ where: { questionId } });

  if (!question || question.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  return NextResponse.json({ question });
}

// PATCH /api/questions/[questionId]
export async function PATCH(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { questionId } = await params;
  const question = await prisma.question.findUnique({ where: { questionId } });

  if (!question || question.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { questionType, title, titleImgs, optionContent, optionImgs, score, answer, analysis, analysisImgs, status } = await req.json();

  const data: Record<string, unknown> = {};
  if (questionType !== undefined) data.questionType = questionType;
  if (title !== undefined) data.title = title;
  if (titleImgs !== undefined) data.titleImgs = titleImgs;
  if (optionContent !== undefined) data.optionContent = optionContent;
  if (optionImgs !== undefined) data.optionImgs = optionImgs;
  if (score !== undefined) data.score = score;
  if (answer !== undefined) data.answer = answer;
  if (analysis !== undefined) data.analysis = analysis;
  if (analysisImgs !== undefined) data.analysisImgs = analysisImgs;
  if (status !== undefined) data.status = status;

  const updated = await prisma.question.update({
    where: { questionId },
    data,
  });

  return NextResponse.json({ question: updated });
}

// DELETE /api/questions/[questionId] — soft delete
export async function DELETE(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { questionId } = await params;
  const question = await prisma.question.findUnique({ where: { questionId } });

  if (!question || question.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await prisma.question.update({
    where: { questionId },
    data: { status: "deleted" },
  });

  return NextResponse.json({ success: true });
}
