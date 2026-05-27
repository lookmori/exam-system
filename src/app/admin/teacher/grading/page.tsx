import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default async function GradingPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const records = await prisma.examRecord.findMany({
    where: {
      status: { in: ["submitted", "graded"] },
      paper: {
        teacherId: session.user.id,
        paperStatus: { not: "removed" },
        paperQuestions: {
          some: {
            question: { questionType: "programming" },
          },
        },
      },
    },
    orderBy: { submitTime: "desc" },
    include: {
      paper: { select: { paperId: true, paperTitle: true, totalScore: true } },
      student: { select: { username: true } },
    },
    take: 50,
  });

  const pending = records.filter(r => r.status === "submitted").length;

  return (
    <div>
      <PageHeader title="阅卷中心" description={`${pending} 份待阅 · ${records.length} 份总计`} />

      {records.length === 0 ? (
        <EmptyState title="暂无待阅试卷" description="当学生提交试卷后，将在此显示" icon={<ClipboardCheck className="h-10 w-10" />} />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.recordId}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.student.username}</p>
                  <p className="text-xs text-slate-500">{r.paper.paperTitle} · {r.paper.totalScore} 分</p>
                  <p className="text-xs text-slate-400">提交于 {r.submitTime ? formatDate(r.submitTime) : "-"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {r.status === "graded" ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-emerald-600">{r.score}</span>
                        <span className="text-xs text-slate-400">/ {r.paper.totalScore}</span>
                      </div>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">待阅卷</Badge>
                    )}
                  </div>
                  <Link href={`/admin/teacher/grading/${r.recordId}`}>
                    <Button variant={r.status === "graded" ? "outline" : "primary"} size="sm">
                      {r.status === "graded" ? "查看" : "开始阅卷"}
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
