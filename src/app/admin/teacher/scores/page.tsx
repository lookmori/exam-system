import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { Award } from "lucide-react";

export default async function ScoresPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const records = await prisma.examRecord.findMany({
    where: {
      status: { in: ["submitted", "graded"] },
      paper: { teacherId: session.user.id },
    },
    orderBy: { submitTime: "desc" },
    include: {
      paper: { select: { paperId: true, paperTitle: true, totalScore: true, passScore: true } },
      student: { select: { username: true } },
    },
    take: 100,
  });

  const avgScore = records.filter(r => r.score != null).length > 0
    ? (records.reduce((s, r) => s + (r.score || 0), 0) / records.filter(r => r.score != null).length).toFixed(1)
    : "-";

  return (
    <div>
      <PageHeader title="成绩管理" description={`${records.length} 条记录 · 平均分 ${avgScore}`} />

      {records.length === 0 ? (
        <EmptyState title="暂无成绩" description="当学生提交试卷并阅卷后，成绩将显示在此" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2.5 px-4 font-medium text-slate-500">学生</th>
                <th className="py-2.5 px-4 font-medium text-slate-500">试卷</th>
                <th className="py-2.5 px-4 font-medium text-slate-500">提交时间</th>
                <th className="py-2.5 px-4 font-medium text-slate-500">得分</th>
                <th className="py-2.5 px-4 font-medium text-slate-500">状态</th>
                <th className="py-2.5 px-4 font-medium text-slate-500">及格</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const passed = r.score != null && r.paper.passScore != null && r.score >= r.paper.passScore;
                return (
                  <tr key={r.recordId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {r.student.username?.charAt(0) || "?"}
                        </div>
                        <span className="font-medium text-slate-900">{r.student.username}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-[200px] truncate">{r.paper.paperTitle}</td>
                    <td className="py-2.5 px-4 text-slate-500">{r.submitTime ? formatDate(r.submitTime) : "-"}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-900">{r.score ?? "-"}</span>
                      <span className="text-slate-400"> / {r.paper.totalScore}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant={r.status === "graded" ? "success" : "default"}>{r.status === "graded" ? "已阅卷" : "待阅卷"}</Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      {r.status === "graded" ? (
                        passed ? <Badge variant="success">通过</Badge> : <Badge variant="danger">未通过</Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
