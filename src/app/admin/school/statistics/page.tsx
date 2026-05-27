import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, FileText, ClipboardCheck, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";

export default async function StatisticsPage() {
  const session = await auth();
  if (session?.user?.role !== "school_admin") redirect("/admin/dashboard");

  const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
  const schoolId = admin?.adminSchoolId;
  if (!schoolId) redirect("/admin/dashboard");

  const [school, studentCount, teacherCount, classCount, questionCount, paperCount, recordCount,
    gradedCount, avgScore, topTeachers,
  ] = await Promise.all([
    prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } }),
    prisma.user.count({ where: { schoolId, role: "student", status: "active" } }),
    prisma.teacherSchool.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.question.count({ where: { schoolId, status: "active" } }),
    prisma.examPaper.count({ where: { schoolId } }),
    prisma.examRecord.count({ where: { paper: { schoolId } } }),
    prisma.examRecord.count({ where: { paper: { schoolId }, status: "graded" } }),
    prisma.examRecord.aggregate({ where: { paper: { schoolId }, status: "graded", score: { not: null } }, _avg: { score: true } }),
    prisma.examPaper.groupBy({ by: ["teacherId"], where: { schoolId }, _count: { paperId: true }, orderBy: { _count: { paperId: "desc" } }, take: 5 }),
  ]);

  // Get teacher names
  const teacherIds = topTeachers.map(t => t.teacherId);
  const teacherNames = teacherIds.length > 0
    ? await prisma.user.findMany({
        where: { userId: { in: teacherIds } },
        select: { userId: true, username: true },
      })
    : [];

  const teacherMap = Object.fromEntries(teacherNames.map(t => [t.userId, t.username]));

  return (
    <div>
      <PageHeader title="数据统计" description={school?.schoolName || ""} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="学生数" value={studentCount} icon={<Users className="h-4 w-4" />} />
        <StatCard label="教师数" value={teacherCount} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="班级数" value={classCount} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="题库数" value={questionCount} icon={<FileText className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>考试概况</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{paperCount}</p>
                <p className="text-xs text-blue-600 mt-1">试卷总数</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{recordCount}</p>
                <p className="text-xs text-emerald-600 mt-1">考试记录</p>
              </div>
              <div className="rounded-lg bg-violet-50 p-4 text-center">
                <p className="text-2xl font-bold text-violet-700">{gradedCount}</p>
                <p className="text-xs text-violet-600 mt-1">已阅卷</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{avgScore._avg.score?.toFixed(1) || "0"}</p>
                <p className="text-xs text-amber-600 mt-1">平均分</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>教师出卷排行</CardTitle></CardHeader>
          <CardContent>
            {topTeachers.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {topTeachers.map((t, i) => (
                  <div key={t.teacherId} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">{i + 1}</div>
                      <span className="text-sm font-medium">{teacherMap[t.teacherId] || t.teacherId}</span>
                    </div>
                    <span className="text-sm text-slate-500">{t._count.paperId} 份试卷</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">{icon}</div>
        <div><p className="text-lg font-bold text-slate-900">{value.toLocaleString()}</p><p className="text-xs text-slate-500">{label}</p></div>
      </CardContent>
    </Card>
  );
}
