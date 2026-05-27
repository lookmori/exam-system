import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import { Award } from "lucide-react";
import Link from "next/link";

export default async function StudentScores() {
  const session = await auth();
  const userId = session?.user?.id;

  const records = await prisma.examRecord.findMany({
    where: { studentId: userId, status: { in: ["submitted", "graded"] }, paper: { paperStatus: { not: "removed" } } },
    include: {
      paper: {
        select: {
          paperTitle: true,
          totalScore: true,
          passScore: true,
          teacher: { select: { username: true } },
        },
      },
    },
    orderBy: { submitTime: "desc" },
  });

  return (
    <div>
      <PageHeader title="我的成绩" description="查看考试结果和成绩详情" />
      {records.length === 0 ? (
        <EmptyState title="暂无考试记录" description="你还没有参加过任何考试" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Card key={record.recordId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{record.paper.paperTitle}</CardTitle>
                  <StatusBadge status={record.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-500 mb-4">
                  <p>教师：{record.paper.teacher?.username}</p>
                  <p>提交：{record.submitTime ? formatDate(record.submitTime) : "-"}</p>
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {record.status === "graded" ? (
                      <span className="font-semibold text-slate-900">{record.score} / {record.paper.totalScore} 分</span>
                    ) : (
                      <span>总分 {record.paper.totalScore} 分 (待阅卷)</span>
                    )}
                  </div>
                </div>
                <Link href={`/student/scores/${record.recordId}`}>
                  <Button variant="outline" className="w-full" size="sm">查看详情</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
