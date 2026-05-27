import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ToggleSchoolButton } from "./toggle-button";
import { Users, BookOpen, FileText, ArrowLeft, School } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function SchoolDetailPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "super_admin") redirect("/admin/dashboard");

  const { schoolId } = await params;
  const school = await prisma.school.findUnique({
    where: { schoolId },
    include: {
      _count: { select: { users: true, classes: true, examPapers: true, questions: true } },
      users: { where: { role: "school_admin" }, select: { userId: true, username: true, name: true, status: true } },
    },
  });
  if (!school) notFound();

  const stats = [
    { label: "总用户", value: school._count.users, icon: <Users className="h-4 w-4" />, color: "blue" },
    { label: "班级", value: school._count.classes, icon: <BookOpen className="h-4 w-4" />, color: "green" },
    { label: "试卷", value: school._count.examPapers, icon: <FileText className="h-4 w-4" />, color: "purple" },
    { label: "题库", value: school._count.questions, icon: <School className="h-4 w-4" />, color: "amber" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/super/schools">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <PageHeader title={school.schoolName} description={`ID: ${school.schoolId}`} />
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={school.status === "active" ? "success" : "danger"}>
            {school.status === "active" ? "运营中" : "已禁用"}
          </Badge>
          <ToggleSchoolButton schoolId={school.schoolId} currentStatus={school.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                {s.icon}
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>学校管理员</CardTitle></CardHeader>
        <CardContent>
          {school.users.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="暂无管理员" description="该学校还没有学校管理员" />
          ) : (
            <div className="divide-y">
              {school.users.map((u) => (
                <div key={u.userId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <span className="text-sm font-medium">{u.name || u.username}</span>
                    {u.name && <span className="text-xs text-slate-400 ml-2">{u.username}</span>}
                  </div>
                  <Badge variant={u.status === "active" ? "success" : "danger"}>
                    {u.status === "active" ? "正常" : "禁用"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
