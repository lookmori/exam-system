import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GradingPanel } from "@/components/teacher/grading-panel";

export default async function GradingDetailPage({ params }: { params: Promise<{ recordId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const { recordId } = await params;
  const record = await prisma.examRecord.findUnique({
    where: { recordId },
    include: {
      paper: { select: { paperId: true, paperTitle: true, teacherId: true, totalScore: true, passScore: true } },
      student: { select: { username: true } },
    },
  });

  if (!record || record.paper.teacherId !== session.user.id) notFound();

  const paperQuestions = await prisma.paperQuestion.findMany({
    where: { paperId: record.paperId },
    orderBy: { sort: "asc" },
    include: {
      question: {
        select: {
          questionId: true,
          title: true,
          titleImgs: true,
          questionType: true,
          optionContent: true,
          optionImgs: true,
          score: true,
          answer: true,
          analysis: true,
          analysisImgs: true,
        },
      },
    },
  });

  const answers = (record.answerContent as Record<string, string>) || {};
  const gradingComments = (record.gradingComments as Record<string, string>) || {};
  const gradingCommentImgs = (record.gradingCommentImgs as Record<string, string[]>) || {};

  // Only show programming questions for manual grading
  const programmingQuestions = paperQuestions.filter(pq => pq.question.questionType === "programming");

  // Calculate auto-score for objective questions
  const objectiveTypes = ["single_choice", "multi_choice", "true_false"];
  const objectiveScore = paperQuestions
    .filter(pq => objectiveTypes.includes(pq.question.questionType))
    .reduce((sum, pq) => {
      const sa = answers[pq.questionId]?.trim();
      const ca = pq.question.answer?.trim();
      return sa && sa === ca ? sum + pq.score : sum;
    }, 0);

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/teacher/grading" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />返回阅卷中心
        </Link>
      </div>

      <PageHeader title="阅卷详情" description={`${record.student.username} · ${record.paper.paperTitle}`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{record.student.username}</p><p className="text-xs text-slate-500">学生</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{record.paper.totalScore}</p><p className="text-xs text-slate-500">试卷总分</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{record.score ?? "-"}</p><p className="text-xs text-slate-500">当前得分</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-slate-500">提交时间</p><p className="text-sm font-bold text-slate-900">{record.submitTime ? formatDate(record.submitTime) : "-"}</p></CardContent></Card>
      </div>

      <GradingPanel
        recordId={recordId}
        totalScore={record.paper.totalScore}
        currentScore={record.score}
        objectiveScore={objectiveScore}
        status={record.status}
        existingComments={gradingComments}
        existingCommentImgs={gradingCommentImgs}
        questions={programmingQuestions.map(pq => ({
          question: pq.question as any,
          sort: pq.sort,
          score: pq.score,
        }))}
        answers={answers}
      />
    </div>
  );
}
