import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/teacher/question-form";

export default async function NewQuestionPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const schools = await prisma.teacherSchool.findMany({
    where: { teacherId: session.user.id },
    include: { school: { select: { schoolId: true, schoolName: true } } },
  });

  if (schools.length === 0) return <p className="text-sm text-slate-500 py-8 text-center">请先绑定学校</p>;

  return <QuestionForm schoolId={schools[0].schoolId} />;
}
