import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuestionForm } from "@/components/teacher/question-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const { questionId } = await params;
  const question = await prisma.question.findUnique({ where: { questionId } });

  if (!question || question.teacherId !== session.user.id) notFound();

  return (
    <QuestionForm
      schoolId={question.schoolId}
      initialData={{
        questionId: question.questionId,
        title: question.title,
        questionType: question.questionType,
        optionContent: question.optionContent as Record<string, string> | undefined,
        optionImgs: question.optionImgs as Record<string, string[]> | undefined,
        score: question.score,
        answer: question.answer,
        analysis: question.analysis || "",
        titleImgs: question.titleImgs,
        analysisImgs: question.analysisImgs,
      }}
    />
  );
}
