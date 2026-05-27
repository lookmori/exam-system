import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/exam — start a new exam
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { paperId } = await req.json();
  if (!paperId) return NextResponse.json({ error: "试卷ID不能为空" }, { status: 400 });

  const student = await prisma.user.findUnique({ where: { userId: session.user.id } });
  if (!student?.schoolId) return NextResponse.json({ error: "学校信息不完整" }, { status: 400 });

  const paper = await prisma.examPaper.findUnique({ where: { paperId } });
  if (!paper || paper.paperStatus !== "published") {
    return NextResponse.json({ error: "试卷不可用" }, { status: 400 });
  }

  // Check school membership
  if (paper.schoolId !== student.schoolId) {
    return NextResponse.json({ error: "无权访问此试卷" }, { status: 403 });
  }

  // Check visibility: paper must be public or student's class must be in classIds
  if (!paper.isPublic && !paper.classIds.includes(student.classId || "")) {
    return NextResponse.json({ error: "你不在该试卷的考试范围内" }, { status: 403 });
  }

  // Check time window
  const now = new Date();
  if (now < paper.startTime || now > paper.endTime) {
    return NextResponse.json({ error: "不在考试时间范围内" }, { status: 400 });
  }

  // Check for existing in-progress record
  let record = await prisma.examRecord.findFirst({
    where: { paperId, studentId: session.user.id, status: "in_progress" },
  });

  if (!record) {
    // Check retry policy
    if (!paper.isRetry) {
      const existing = await prisma.examRecord.findFirst({
        where: { paperId, studentId: session.user.id },
      });
      if (existing) return NextResponse.json({ error: "此考试不允许重复参加" }, { status: 400 });
    }

    record = await prisma.examRecord.create({
      data: { paperId, studentId: session.user.id, startTime: new Date() },
    });
  }

  return NextResponse.json({ recordId: record.recordId });
}
