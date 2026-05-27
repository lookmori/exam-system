import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { QuestionActions } from "./actions";

const typeLabels: Record<string, string> = {
  single_choice: "单选题", multi_choice: "多选题", true_false: "判断题", programming: "编程题",
};

export default async function QuestionsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const teacher = await prisma.user.findUnique({ where: { userId: session.user.id } });
  const schools = await prisma.teacherSchool.findMany({
    where: { teacherId: session.user.id },
    include: { school: { select: { schoolId: true, schoolName: true } } },
  });

  if (schools.length === 0) {
    return <><PageHeader title="题库管理" /><EmptyState title="未绑定学校" description="请联系管理员将你添加到学校" /></>;
  }

  const questions = await prisma.question.findMany({
    where: {
      schoolId: { in: schools.map(s => s.schoolId) },
      teacherId: session.user.id,
      status: { not: "deleted" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      questionId: true,
      title: true,
      questionType: true,
      score: true,
      status: true,
      createdAt: true,
      optionContent: true,
      answer: true,
    },
    take: 50,
  });

  const questionsByType: Record<string, number> = {};
  for (const q of questions) {
    questionsByType[q.questionType] = (questionsByType[q.questionType] || 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="题库管理" description={`共 ${questions.length} 道题目`}
          actions={<Link href="/admin/teacher/questions/new"><Button><Plus className="h-4 w-4 mr-1" />新建题目</Button></Link>} />
      </div>

      {/* Type filter tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(typeLabels).map(([key, label]) => (
          <a key={key} href={`?type=${key}`}
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
            {label} ({questionsByType[key] || 0})
          </a>
        ))}
      </div>

      {questions.length === 0 ? (
        <EmptyState title="题库为空" description="点击上方按钮创建第一道题目" icon={<FileText className="h-10 w-10" />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {questions.map((q) => {
            const options = q.optionContent as Record<string, string> | null;
            return (
              <Card key={q.questionId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="default">{typeLabels[q.questionType]}</Badge>
                    <div className="flex items-center gap-2">
                      <Badge variant={q.status === "active" ? "success" : "warning"} className="text-[10px]">{q.status === "active" ? "启用" : "禁用"}</Badge>
                      <QuestionActions questionId={q.questionId} questionType={q.questionType} />
                    </div>
                  </div>
                  <div className="text-sm text-slate-800 line-clamp-2 mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.title }} />
                  {options && (
                    <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                      {Object.entries(options).map(([k, v]) => (
                        <p key={k} className="line-clamp-1">{k}. {v}</p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{q.score} 分</span>
                    <Link href={`/admin/teacher/questions/${q.questionId}/edit`} className="text-blue-500 hover:text-blue-700">编辑</Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
