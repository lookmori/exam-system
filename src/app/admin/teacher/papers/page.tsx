import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Users, Clock, Globe } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { PaperActions } from "./actions";

const statusLabels: Record<string, string> = { draft: "草稿", published: "已发布", ended: "已结束", removed: "已删除" };
const statusVariants: Record<string, "default" | "success" | "warning" | "danger"> = { draft: "default", published: "success", ended: "warning", removed: "danger" };

export default async function PapersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  const papers = await prisma.examPaper.findMany({
    where: { teacherId: session.user.id, paperStatus: { not: "removed" } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { paperQuestions: true, examRecords: true } },
      school: { select: { schoolName: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="试卷管理" description={`共 ${papers.length} 份试卷`} />
        <div className="flex items-center gap-2">
          <Link href="/admin/teacher/papers/browse">
            <Button variant="secondary"><Globe className="h-4 w-4 mr-1" />浏览公开试卷</Button>
          </Link>
          <Link href="/admin/teacher/papers/new">
            <Button><Plus className="h-4 w-4 mr-1" />创建试卷</Button>
          </Link>
        </div>
      </div>

      {papers.length === 0 ? (
        <EmptyState title="暂无试卷" description="点击上方按钮创建第一份试卷" icon={<FileText className="h-10 w-10" />} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((p) => (
            <Card key={p.paperId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">{p.paperTitle}</CardTitle>
                  <Badge variant={statusVariants[p.paperStatus]}>{statusLabels[p.paperStatus]}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                  <p className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{p._count.paperQuestions} 道题 · {p.totalScore} 分</p>
                  <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{p.examDuration} 分钟</p>
                  <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{p._count.examRecords} 人参加</p>
                  <p>学校：{p.school.schoolName}</p>
                  <p>创建：{formatDate(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/teacher/papers/${p.paperId}`}>
                    <Button variant="outline" size="sm">查看</Button>
                  </Link>
                  {p.paperStatus === "published" && (
                    <Link href={`/admin/teacher/papers/${p.paperId}/results`}>
                      <Button variant="ghost" size="sm" className="text-emerald-600">结果</Button>
                    </Link>
                  )}
                  <Link href={`/admin/teacher/papers/${p.paperId}/edit`}>
                    <Button variant="ghost" size="sm">编辑</Button>
                  </Link>
                  {p.paperStatus !== "published" && <PaperActions paperId={p.paperId} />}
                  {p.paperStatus === "published" && <PaperActions paperId={p.paperId} showPublish={false} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
