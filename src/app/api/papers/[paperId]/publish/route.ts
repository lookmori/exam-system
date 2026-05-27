import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH /api/papers/[paperId]/publish — publish a paper
export async function PATCH(req: Request, { params }: { params: Promise<{ paperId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({
    where: { paperId },
    include: { _count: { select: { paperQuestions: true } } },
  });

  if (!paper || paper.teacherId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  if (paper._count.paperQuestions === 0) {
    return NextResponse.json({ error: "试卷必须包含至少一道题目" }, { status: 400 });
  }

  const updated = await prisma.examPaper.update({
    where: { paperId },
    data: { paperStatus: "published" },
  });

  return NextResponse.json({ paper: updated });
}
