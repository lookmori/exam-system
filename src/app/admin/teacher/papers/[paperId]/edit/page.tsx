import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditPaperForm } from "./form";

export default async function EditPaperPage({ params }: { params: Promise<{ paperId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({
    where: { paperId },
    include: {
      paperQuestions: {
        orderBy: { sort: "asc" },
        include: {
          question: {
            select: { questionId: true, title: true, questionType: true, score: true },
          },
        },
      },
    },
  });

  if (!paper || paper.teacherId !== session.user.id) notFound();

  return <EditPaperForm paper={paper} />;
}
