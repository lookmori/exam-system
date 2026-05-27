import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Award } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PaperResultsPage({ params }: { params: Promise<{ paperId: string }> }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const { paperId } = await params;
  const paper = await prisma.examPaper.findUnique({
    where: { paperId },
    select: { paperId: true, paperTitle: true, totalScore: true, passScore: true, teacherId: true },
  });

  if (!paper || paper.teacherId !== session.user.id) notFound();

  const records = await prisma.examRecord.findMany({
    where: { paperId, status: { in: ["submitted", "graded"] } },
    orderBy: { submitTime: "desc" },
    include: {
      student: { select: { userId: true, username: true } },
    },
  });

  const avgScore = records.length > 0
    ? records.reduce((sum, r) => sum + (r.score || 0), 0) / records.length
    : 0;
  const passCount = records.filter(r => r.score != null && paper.passScore != null && r.score >= paper.passScore).length;

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/teacher/papers" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />返回试卷列表
        </Link>
      </div>

      <PageHeader title={paper.paperTitle} description="考试结果" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{records.length}</p><p className="text-xs text-slate-500">参加人数</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{records.filter(r => r.status === "graded").length}</p><p className="text-xs text-slate-500">已阅卷</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-emerald-600">{avgScore.toFixed(1)}</p><p className="text-xs text-slate-500">平均分</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold text-slate-900">{passCount}</p><p className="text-xs text-slate-500">及格 ({paper.passScore || "-"} 分线)</p></CardContent></Card>
      </div>

      {records.length === 0 ? (
        <EmptyState title="暂无考试记录" description="还没有学生参加此考试" />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.recordId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    {r.student.username?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.student.username}</p>
                    <p className="text-xs text-slate-500">提交于 {r.submitTime ? formatDate(r.submitTime) : "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-bold text-slate-900">{r.score ?? "-"} / {paper.totalScore}</span>
                    </div>
                    <Badge variant={r.status === "graded" ? "success" : "default"} className="text-[10px]">{r.status === "graded" ? "已阅卷" : "待阅卷"}</Badge>
                  </div>
                  <Link href={`/admin/teacher/grading/${r.recordId}`}>
                    <Button variant="outline" size="sm">
                      {r.status === "graded" ? "查看" : "阅卷"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
