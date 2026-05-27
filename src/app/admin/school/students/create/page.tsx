import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateStudentForm } from "./form";

export default async function CreateStudentPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "school_admin" && role !== "teacher") redirect("/admin/dashboard");

  let schoolId: string | null = null;
  if (role === "school_admin") {
    const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
    schoolId = admin?.adminSchoolId ?? null;
  } else if (role === "teacher") {
    const ts = await prisma.teacherSchool.findFirst({ where: { teacherId: session.user.id }, select: { schoolId: true } });
    schoolId = ts?.schoolId ?? null;
  }
  if (!schoolId) redirect("/admin/dashboard");

  const params = await searchParams;
  const defaultClassId = params.classId || "";

  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: { classId: true, className: true },
    orderBy: { createdAt: "desc" },
  });

  const school = await prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={defaultClassId ? `/admin/school/classes/${defaultClassId}` : "/admin/school/students"}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <PageHeader title="添加学生" description={school?.schoolName || ""} />
      </div>
      <Card className="max-w-lg">
        <CardHeader><CardTitle>学生信息</CardTitle></CardHeader>
        <CardContent>
          <CreateStudentForm schoolId={schoolId} classes={classes} defaultClassId={defaultClassId} />
        </CardContent>
      </Card>
    </div>
  );
}
