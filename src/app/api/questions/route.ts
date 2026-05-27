import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/questions — list questions for the teacher's school
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const type = searchParams.get("type");
  const keyword = searchParams.get("keyword");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "12");

  if (!schoolId) return NextResponse.json({ error: "缺少学校ID" }, { status: 400 });

  const where: Record<string, unknown> = {
    schoolId,
    teacherId: session.user.id,
    status: { not: "deleted" },
  };

  if (type && type !== "all") where.questionType = type;
  if (keyword) where.title = { contains: keyword };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        questionId: true,
        title: true,
        questionType: true,
        score: true,
        status: true,
        createdAt: true,
        optionContent: true,
        answer: true,
      },
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({ questions, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

// POST /api/questions — create a new question
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { schoolId, questionType, title, titleImgs, optionContent, optionImgs, score, answer, analysis, analysisImgs } = await req.json();

  if (!schoolId || !questionType || !title || !answer) {
    return NextResponse.json({ error: "必填字段不能为空" }, { status: 400 });
  }

  const question = await prisma.question.create({
    data: {
      schoolId,
      teacherId: session.user.id,
      questionType,
      title,
      titleImgs: titleImgs || [],
      optionContent,
      optionImgs: optionImgs || {},
      score: score || 1,
      answer,
      analysis,
      analysisImgs: analysisImgs || [],
      status: "active",
    },
  });

  return NextResponse.json({ question }, { status: 201 });
}
