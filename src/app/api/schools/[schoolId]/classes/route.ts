import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { schoolId } = await params;
  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: { classId: true, className: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(classes);
}
