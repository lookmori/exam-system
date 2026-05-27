import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { School, Users, FileText, ClipboardCheck, TrendingUp, Sparkles } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  const role = session?.user?.role as string;

  let stats = { schools: 0, users: 0, papers: 0, records: 0 };
  let recentPapers: any[] = [];
  let recentSchools: any[] = [];

  if (role === "super_admin") {
    const [schools, users, papers, records] = await Promise.all([
      prisma.school.count({ where: { status: "active" } }),
      prisma.user.count({ where: { status: "active" } }),
      prisma.examPaper.count({ where: { paperStatus: { not: "removed" } } }),
      prisma.examRecord.count(),
    ]);
    stats = { schools, users, papers, records };
    recentSchools = await prisma.school.findMany({ take: 5, orderBy: { createdAt: "desc" } });
    recentPapers = await prisma.examPaper.findMany({
      where: { paperStatus: { not: "removed" } },
      take: 5, orderBy: { createdAt: "desc" },
      include: { teacher: { select: { username: true } }, school: { select: { schoolName: true } } },
    });
  } else if (role === "school_admin") {
    const adminUser = await prisma.user.findUnique({ where: { userId: session?.user?.id } });
    const sid = adminUser?.adminSchoolId;
    if (sid) {
      const [users, papers, records] = await Promise.all([
        prisma.user.count({ where: { schoolId: sid, status: "active" } }),
        prisma.examPaper.count({ where: { schoolId: sid, paperStatus: { not: "removed" } } }),
        prisma.examRecord.count({ where: { paper: { schoolId: sid } } }),
      ]);
      stats = { ...stats, users, papers, records };
      recentPapers = await prisma.examPaper.findMany({
        where: { schoolId: sid, paperStatus: { not: "removed" } }, take: 5, orderBy: { createdAt: "desc" },
        include: { teacher: { select: { username: true } } },
      });
    }
  } else if (role === "teacher") {
    const teacherId = session?.user?.id;
    const [papers, records] = await Promise.all([
      prisma.examPaper.count({ where: { teacherId, paperStatus: { not: "removed" } } }),
      prisma.examRecord.count({ where: { paper: { teacherId } } }),
    ]);
    stats = { ...stats, papers, records };
    recentPapers = await prisma.examPaper.findMany({
      where: { teacherId, paperStatus: { not: "removed" } }, take: 5, orderBy: { createdAt: "desc" },
      include: { school: { select: { schoolName: true } } },
    });
  }

  const titles: Record<string, string> = { super_admin: "平台数据总览", school_admin: "学校数据仪表盘", teacher: "教学数据仪表盘" };

  return (
    <div>
      <PageHeader
        title={titles[role] || "仪表盘"}
        description="欢迎回来，来看看今天的精彩数据吧 ✨"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {role === "super_admin" && (
          <StatCard title="🏫 入驻学校" value={stats.schools} gradient="from-fun-coral to-fun-peach" />
        )}
        {(role === "super_admin" || role === "school_admin") && (
          <StatCard title="👥 活跃用户" value={stats.users} gradient="from-fun-sky to-fun-teal" />
        )}
        <StatCard title="📝 试卷数量" value={stats.papers} gradient="from-fun-lavender to-fun-pink" />
        <StatCard title="📊 考试记录" value={stats.records} gradient="from-fun-sunny to-fun-peach" />
        {(role === "super_admin" || role === "school_admin") && (
          <StatCard title="✨ 系统运行" value="正常" gradient="from-fun-mint to-fun-teal" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent papers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 最近试卷
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPapers.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center font-medium">暂无试卷数据</p>
            ) : (
              <div className="space-y-3">
                {recentPapers.map((paper: any) => (
                  <div
                    key={paper.paperId}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 hover:bg-fun-lavender-light/20 rounded-lg px-3 py-2 -mx-1 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{paper.paperTitle}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {paper.teacher?.username || paper.school?.schoolName} · {new Date(paper.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <Badge variant={paper.paperStatus === "published" ? "success" : "default"}>
                      {paper.paperStatus === "published" ? "已发布" : "草稿"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {role === "super_admin" && recentSchools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏰 最近入驻学校
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSchools.map((school: any) => (
                  <div
                    key={school.schoolId}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 hover:bg-fun-sky-light/20 rounded-lg px-3 py-2 -mx-1 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fun-lavender to-fun-pink text-white text-sm font-bold shadow-[0_3px_10px_rgba(151,117,250,0.2)]">
                        {school.schoolName[0]}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{school.schoolName}</span>
                    </div>
                    <Badge variant={school.status === "active" ? "success" : "danger"}>
                      {school.status === "active" ? "正常" : "禁用"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, gradient }: { title: string; value: number | string; gradient: string }) {
  return (
    <Card className="group relative overflow-hidden border-2 border-transparent hover:border-fun-lavender/20 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${gradient} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity`} />
      <CardContent className="p-5 relative">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="text-3xl font-extrabold text-slate-800 mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}
