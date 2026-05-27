import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, School, User } from "lucide-react";
import { BrowseActions } from "./browse-actions";

export default async function BrowsePapersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "teacher") return null;

  // Fetch teacher's schools for the assign dialog
  const teacherSchools = await prisma.teacherSchool.findMany({
    where: { teacherId: session.user.id },
    include: { school: { select: { schoolId: true, schoolName: true } } },
  });

  const schools = teacherSchools.map((ts) => ({
    schoolId: ts.school.schoolId,
    schoolName: ts.school.schoolName,
  }));

  // Fetch public papers (exclude own papers)
  const papers = await prisma.examPaper.findMany({
    where: {
      isPublic: true,
      paperStatus: "published",
      teacherId: { not: session.user.id },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      _count: { select: { paperQuestions: true } },
      school: { select: { schoolName: true } },
      teacher: { select: { name: true } },
    },
  });

  return (
    <div>
      <PageHeader title="浏览公开试卷" description={`共发现 ${papers.length} 份公开试卷`} />

      {papers.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-4 text-slate-500">暂无可用的公开试卷</p>
          <p className="text-sm text-slate-400 mt-1">其他学校老师发布公开试卷后，会显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {papers.map((p) => (
            <Card key={p.paperId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">{p.paperTitle}</CardTitle>
                  <Badge variant="success">公开</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-xs text-slate-500 mb-3">
                  <p className="flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5" />{p.school.schoolName}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />{p.teacher.name}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />{p._count.paperQuestions} 道题 · {p.totalScore} 分
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />{p.examDuration} 分钟
                  </p>
                </div>
                <BrowseActions paper={p} schools={schools} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
