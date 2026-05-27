import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Clock, Users, ArrowLeft } from "lucide-react";
import { TitleImages, OptionImages, AnalysisImages } from "@/components/shared/question-images";
import { CodeEditor } from "@/components/shared/code-editor";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishButton } from "./publish-button";
import { PaperActions } from "../actions";

const typeLabels: Record<string, string> = {
  single_choice: "单选题", multi_choice: "多选题", true_false: "判断题", programming: "编程题",
};
const statusLabels: Record<string, string> = { draft: "草稿", published: "已发布", ended: "已结束", removed: "已删除" };

export default async function PaperDetailPage({ params }: { params: Promise<{ paperId: string }> }) {
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
      },
      school: { select: { schoolName: true } },
      _count: { select: { examRecords: true } },
    },
  });

  if (!paper || paper.teacherId !== session.user.id) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/teacher/papers" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />返回试卷列表
        </Link>
      </div>

      <PageHeader title={paper.paperTitle} description={`${paper.school.schoolName} · ${statusLabels[paper.paperStatus]}`} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{paper.paperQuestions.length}</p><p className="text-xs text-slate-500">题目数</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{paper.totalScore}</p><p className="text-xs text-slate-500">总分</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{paper.examDuration} 分钟</p><p className="text-xs text-slate-500">时长</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{paper._count.examRecords}</p><p className="text-xs text-slate-500">参加人数</p></CardContent></Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">题目列表</h3>
        {paper.paperQuestions.map((pq, i) => (
          <Card key={pq.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-500">{i + 1}.</span>
                <Badge variant="default">{typeLabels[pq.question.questionType]}</Badge>
                <span className="text-xs text-slate-400">{pq.score} 分</span>
              </div>
              <div className="text-sm text-slate-800 mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: pq.question.title }} />
              <TitleImages images={pq.question.titleImgs} />
              {pq.question.optionContent && (
                <div className="ml-4 space-y-1 mb-2">
                  {Object.entries(pq.question.optionContent as Record<string, string>).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-sm text-slate-600">{k}. {v}</p>
                      <OptionImages images={(pq.question.optionImgs as Record<string, string[]>)?.[k]} optionKey={k} />
                    </div>
                  ))}
                </div>
              )}
              {pq.question.questionType === "programming" ? (
                <div className="mb-2">
                  <p className="text-xs text-slate-400 mb-1">参考代码：</p>
                  <CodeEditor
                    value={pq.question.answer || ""}
                    readOnly
                    language="python"
                    height="200px"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span>答案：{pq.question.answer}</span>
                </div>
              )}
              {pq.question.analysis && (
                <div className="bg-amber-50 rounded-md p-2.5 text-xs text-amber-800">
                  <span className="font-medium">解析：</span>
                  <span dangerouslySetInnerHTML={{ __html: pq.question.analysis }} />
                  <AnalysisImages images={pq.question.analysisImgs} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        {paper.paperStatus === "draft" && (
          <>
            <Link href={`/admin/teacher/papers/${paperId}/edit`}>
              <Button>编辑试卷</Button>
            </Link>
            <PublishButton paperId={paperId} />
          </>
        )}
        {paper.paperStatus === "published" && (
          <Link href={`/admin/teacher/papers/${paperId}/results`}>
            <Button>查看考试结果</Button>
          </Link>
        )}
        <PaperActions paperId={paperId} showPublish={false} />
      </div>
    </div>
  );
}
