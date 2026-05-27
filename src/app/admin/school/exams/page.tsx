import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PAPER_STATUS_LABELS, type PaperStatus } from "@/lib/constants";
import { redirect } from "next/navigation";

export default async function ExamsPage() {
  const session = await auth();
  if (session?.user?.role !== "school_admin") redirect("/admin/dashboard");

  const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
  const schoolId = admin?.adminSchoolId;
  if (!schoolId) redirect("/admin/dashboard");

  const [papers, school] = await Promise.all([
    prisma.examPaper.findMany({
      where: { schoolId },
      include: { teacher: { select: { username: true } }, _count: { select: { examRecords: true, paperQuestions: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } }),
  ]);

  return (
    <div>
      <PageHeader title="考试管理" description={school?.schoolName || ""} />
      <Card>
        <CardContent className="p-0">
          {papers.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">暂无考试</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left p-4 text-xs font-medium text-slate-500">试卷名称</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">出卷教师</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">考试时间</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">题目/记录</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">状态</th>
                </tr></thead>
                <tbody>
                  {papers.map((p) => (
                    <tr key={p.paperId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4 text-sm font-medium text-slate-900">{p.paperTitle}</td>
                      <td className="p-4 text-sm text-slate-600">{p.teacher.username}</td>
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(p.startTime).toLocaleDateString("zh-CN")} ~ {new Date(p.endTime).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="p-4 text-sm text-slate-500">{p._count.paperQuestions} 题 · {p._count.examRecords} 记录</td>
                      <td className="p-4">
                        <Badge variant={p.paperStatus === "published" ? "success" : p.paperStatus === "draft" ? "default" : p.paperStatus === "ended" ? "info" : "danger"}>
                          {PAPER_STATUS_LABELS[p.paperStatus as PaperStatus]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
