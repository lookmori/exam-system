import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TitleImages, OptionImages, AnalysisImages } from "@/components/shared/question-images";
import { CodeEditor } from "@/components/shared/code-editor";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Circle, Award, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ recordId: string }>;
}

export default async function ScoreDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { recordId } = await params;

  const record = await prisma.examRecord.findUnique({
    where: { recordId },
    include: {
      paper: {
        select: {
          paperTitle: true,
          totalScore: true,
          passScore: true,
          examDuration: true,
          paperStatus: true,
        },
      },
    },
  });

  if (!record || record.studentId !== session.user.id || record.paper.paperStatus === "removed") {
    notFound();
  }

  if (record.status === "in_progress") {
    redirect(`/student/exam/${recordId}`);
  }

  const paperQuestions = await prisma.paperQuestion.findMany({
    where: { paperId: record.paperId },
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
    orderBy: { sort: "asc" },
  });

  const answers = (record.answerContent as Record<string, string>) || {};
  const gradingComments = (record.gradingComments as Record<string, string>) || {};
  const gradingCommentImgs = (record.gradingCommentImgs as Record<string, string[]>) || {};
  const objectiveTypes = ["single_choice", "multi_choice", "true_false"];

  // Build question results
  const questionResults = paperQuestions.map((pq) => {
    const studentAnswer = answers[pq.questionId] || "";
    const correctAnswer = pq.question.answer;
    const isObjective = objectiveTypes.includes(pq.question.questionType);
    let isCorrect: boolean | null = null;

    if (record.status === "graded" && isObjective) {
      isCorrect = studentAnswer.trim() === correctAnswer.trim();
    }

    return {
      questionId: pq.questionId,
      title: pq.question.title,
      titleImgs: pq.question.titleImgs,
      questionType: pq.question.questionType,
      optionContent: pq.question.optionContent as Record<string, string> | null,
      optionImgs: pq.question.optionImgs as Record<string, string[]> | null,
      questionScore: pq.score,
      studentAnswer,
      correctAnswer,
      isCorrect,
      analysis: pq.question.analysis,
      analysisImgs: pq.question.analysisImgs,
      isObjective,
      gradingComment: gradingComments[pq.questionId] || null,
      gradingCommentImgs: gradingCommentImgs[pq.questionId] || null,
    };
  });

  const correctCount = questionResults.filter((q) => q.isCorrect === true).length;
  const objectiveCount = questionResults.filter((q) => q.isObjective).length;

  const typeLabels: Record<string, string> = {
    single_choice: "单选题", multi_choice: "多选题", true_false: "判断题", programming: "编程题",
  };

  const passed = record.paper.passScore != null && record.score != null && record.score >= record.paper.passScore;

  return (
    <div>
      <PageHeader title="成绩详情" description={record.paper.paperTitle} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">
              {record.score != null ? record.score : "-"}
            </p>
            <p className="text-xs text-slate-500">得分 / {record.paper.totalScore}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
            <p className="text-xs text-slate-500">客观题正确 / {objectiveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-slate-900">{record.submitTime ? formatDate(record.submitTime) : "-"}</p>
            <p className="text-xs text-slate-500">交卷时间</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {record.status === "graded" ? (
              passed ? <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" /> :
                <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            ) : (
              <Circle className="h-5 w-5 text-slate-400 mx-auto mb-1" />
            )}
            <p className="text-sm font-bold text-slate-900">
              {record.status === "graded"
                ? (passed ? "通过" : "未通过")
                : "待阅卷"}
            </p>
            <p className="text-xs text-slate-500">
              {record.paper.passScore != null ? `及格线 ${record.paper.passScore} 分` : "无及格线"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Questions review */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">答题回顾</h2>
        {questionResults.map((q, i) => (
          <Card key={q.questionId}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-500">
                      第 {i + 1} 题
                    </span>
                    <Badge variant="default">{typeLabels[q.questionType]}</Badge>
                    <span className="text-xs text-slate-400">{q.questionScore} 分</span>
                  </div>
                  <div className="text-sm text-slate-900 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.title }} />
                  <TitleImages images={q.titleImgs} />
                </div>
                {q.isCorrect !== null && (
                  q.isCorrect
                    ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                    : <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-1" />
                )}
              </div>

              {/* Options display */}
              {q.optionContent && (
                <div className="ml-0 space-y-1.5 mb-3">
                  {Object.entries(q.optionContent).map(([key, text]) => {
                    let optionClass = "border-slate-200 text-slate-700";
                    const isStudentSelected = q.isObjective && (
                      q.questionType === "multi_choice"
                        ? (() => { try { return (JSON.parse(q.studentAnswer || "[]") as string[]).includes(key); } catch { return false; } })()
                        : q.studentAnswer === key
                    );
                    const isCorrectOption = q.isObjective && q.correctAnswer && (
                      q.questionType === "multi_choice"
                        ? (() => { try { return (JSON.parse(q.correctAnswer || "[]") as string[]).includes(key); } catch { return false; } })()
                        : q.correctAnswer === key
                    );

                    if (isStudentSelected && !isCorrectOption) optionClass = "border-red-300 bg-red-50 text-red-700";
                    else if (isCorrectOption) optionClass = "border-emerald-300 bg-emerald-50 text-emerald-700";
                    else if (isStudentSelected && isCorrectOption) optionClass = "border-emerald-300 bg-emerald-50 text-emerald-700";

                    return (
                      <div key={key} className={`p-2.5 rounded-md border text-sm ${optionClass}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 border border-current">{key}</span>
                          <span>{text}</span>
                          {isStudentSelected && <span className="text-xs ml-auto shrink-0">你的答案</span>}
                        </div>
                        <OptionImages images={q.optionImgs?.[key]} optionKey={key} />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Student answer for text questions */}
              {!q.isObjective && q.questionType !== "programming" && (
                <div className="bg-slate-50 rounded-md p-3 mb-2">
                  <p className="text-xs text-slate-400 mb-1">你的答案</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{q.studentAnswer || "(未作答)"}</p>
                </div>
              )}

              {/* Student answer for programming */}
              {q.questionType === "programming" && (
                <div className="mb-2">
                  <p className="text-xs text-slate-400 mb-1">你的代码</p>
                  <CodeEditor
                    value={q.studentAnswer || "# 未作答"}
                    readOnly
                    language="python"
                    height="250px"
                  />
                </div>
              )}

              {/* Correct answer */}
              {q.isObjective && (
                <p className="text-xs text-slate-500 mt-2">
                  正确答案：<span className="font-medium text-slate-900">{q.correctAnswer}</span>
                </p>
              )}

              {/* Correct answer for programming */}
              {q.questionType === "programming" && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">参考代码</p>
                  <CodeEditor
                    value={q.correctAnswer || ""}
                    readOnly
                    language="python"
                    height="200px"
                  />
                </div>
              )}

              {/* Teacher comment for programming */}
              {q.questionType === "programming" && (q.gradingComment || q.gradingCommentImgs) && (
                <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-200">
                  <p className="text-xs font-medium text-purple-600 mb-1">教师评语</p>
                  {q.gradingComment && (
                    <p className="text-sm text-purple-800 whitespace-pre-wrap mb-2">{q.gradingComment}</p>
                  )}
                  {q.gradingCommentImgs && q.gradingCommentImgs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {q.gradingCommentImgs.map((url: string, j: number) => (
                        <a key={j} href={url} target="_blank" rel="noreferrer" className="block">
                          <img src={url} alt={`评语配图 ${j + 1}`}
                            className="h-20 w-20 object-cover rounded-md border border-purple-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Analysis */}
              {q.analysis && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs font-medium text-blue-600 mb-1">解析</p>
                  <div className="text-xs text-blue-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.analysis }} />
                  <AnalysisImages images={q.analysisImgs} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/student/scores">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1" />返回成绩列表
          </Button>
        </Link>
      </div>
    </div>
  );
}
