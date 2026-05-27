import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaperWizard } from "@/components/teacher/paper-wizard";

export default async function NewPaperPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const schoolRecords = await prisma.teacherSchool.findMany({
    where: { teacherId: session.user.id },
    include: { school: { select: { schoolId: true, schoolName: true } } },
  });

  const schools = schoolRecords.map(s => ({ schoolId: s.school.schoolId, schoolName: s.school.schoolName }));

  if (schools.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">请先绑定学校</p>;
  }

  return <PaperWizard teacherId={session.user.id} schools={schools} />;
}
