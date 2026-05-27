import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Users, FileText, ClipboardCheck, TrendingUp, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

export default async function OverviewPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") redirect("/admin/dashboard");

  const [schoolCount, userCount, questionCount, paperCount, recordCount, classCount,
    activeSchools, activeUsers, disabledUsers,
    recentUsers, recentPapers, schoolStats,
  ] = await Promise.all([
    prisma.school.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "active" } }),
    prisma.question.count({ where: { status: "active" } }),
    prisma.examPaper.count(),
    prisma.examRecord.count(),
    prisma.class.count(),
    prisma.school.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "disabled" } }),
    prisma.user.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { userId: true, username: true, name: true, role: true, status: true, createdAt: true } }),
    prisma.examPaper.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { school: { select: { schoolName: true } }, teacher: { select: { username: true } } } }),
    prisma.school.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { _count: { select: { users: true, classes: true } } } }),
  ]);

  return (
    <div>
      <PageHeader title="平台数据总览" description="全平台数据统计分析" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        <StatCard label="入驻学校" value={schoolCount} icon={<School className="h-4 w-4" />} />
        <StatCard label="活跃用户" value={userCount} icon={<Users className="h-4 w-4" />} />
        <StatCard label="班级数" value={classCount} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="题库总量" value={questionCount} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="试卷数" value={paperCount} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard label="考试记录" value={recordCount} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>学校概况</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schoolStats.map((s) => (
                <div key={s.schoolId} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-sm font-medium">{s.schoolName[0]}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.schoolName}</p>
                      <p className="text-xs text-slate-400">{s._count.users} 用户 · {s._count.classes} 班级</p>
                    </div>
                  </div>
                  <Badge variant={s.status === "active" ? "success" : "danger"}>{s.status === "active" ? "正常" : "禁用"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>最新用户</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.userId} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{u.name || u.username}</p>
                    {u.name && <p className="text-xs text-slate-400">{u.username}</p>}
                    <p className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</p>
                  </div>
                  <Badge variant={u.role === "super_admin" ? "danger" : u.role === "school_admin" ? "warning" : u.role === "teacher" ? "primary" : "info"}>
                    {{ super_admin: "超管", school_admin: "校管", teacher: "教师", student: "学生" }[u.role]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>最新试卷</CardTitle></CardHeader>
          <CardContent>
            {recentPapers.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">暂无试卷</p>
            ) : (
              <div className="space-y-3">
                {recentPapers.map((p) => (
                  <div key={p.paperId} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.paperTitle}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{p.school.schoolName} · {p.teacher.username}</p>
                    </div>
                    <Badge variant={p.paperStatus === "published" ? "success" : "default"}>
                      {{ draft: "草稿", published: "已发布", ended: "已结束", removed: "已下架" }[p.paperStatus]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>平台统计</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{activeUsers}</p>
                <p className="text-xs text-emerald-600 mt-1">活跃用户</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{disabledUsers}</p>
                <p className="text-xs text-red-600 mt-1">禁用用户</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{activeSchools}</p>
                <p className="text-xs text-blue-600 mt-1">活跃学校</p>
              </div>
              <div className="rounded-lg bg-violet-50 p-4 text-center">
                <p className="text-2xl font-bold text-violet-700">{recordCount}</p>
                <p className="text-xs text-violet-600 mt-1">考试记录</p>
              </div>
            </div>
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900">{value.toLocaleString()}</p>
          <p className="text-xs text-slate-500 truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
