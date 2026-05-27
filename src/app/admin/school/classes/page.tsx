import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreateClassDialog } from "./create-dialog";
import { ClassCardGrid } from "./class-card-grid";
import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ClassesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "school_admin" && role !== "teacher") redirect("/admin/dashboard");

  let schoolId: string | null = null;

  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    schoolId = admin?.adminSchoolId ?? null;
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({
      where: { teacherId: session.user.id },
      select: { schoolId: true },
    });
    schoolId = ts?.schoolId ?? null;
  }

  if (!schoolId) redirect("/admin/dashboard");

  const [school, classes] = await Promise.all([
    prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } }),
    prisma.class.findMany({
      where: { schoolId },
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="班级管理" description={school?.schoolName || ""}
        actions={<CreateClassDialog schoolId={schoolId} />} />

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm">暂无班级，请先创建班级</p>
          </CardContent>
        </Card>
      ) : (
        <ClassCardGrid classes={JSON.parse(JSON.stringify(classes))} />
      )}
    </div>
  );
}
