import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { schoolSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { schoolId } = await params;
  const body = await req.json();
  const parsed = schoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const school = await prisma.school.update({
    where: { schoolId },
    data: {
      ...(parsed.data.schoolName && { schoolName: parsed.data.schoolName }),
      ...(parsed.data.status && { status: parsed.data.status }),
    },
  });
  return NextResponse.json(school);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { schoolId } = await params;
  // Soft delete - just disable
  await prisma.school.update({
    where: { schoolId },
    data: { status: "disabled" },
  });
  return NextResponse.json({ success: true });
}
