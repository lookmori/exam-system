import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateSchoolDialog } from "./create-dialog";
import { School, Users, BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SchoolsPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") redirect("/admin/dashboard");

  const schools = await prisma.school.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, classes: true, examPapers: true } },
    },
  });

  return (
    <div>
      <PageHeader title="学校管理" description="管理所有入驻学校"
        actions={<CreateSchoolDialog />} />

      {schools.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <School className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm">暂无学校数据</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <Link key={school.schoolId} href={`/admin/super/schools/${school.schoolId}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-blue-300">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-lg font-bold">
                        {school.schoolName[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {school.schoolName}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(school.createdAt).toLocaleDateString("zh-CN")} 入驻
                        </p>
                      </div>
                    </div>
                    <Badge variant={school.status === "active" ? "success" : "danger"}>
                      {school.status === "active" ? "正常" : "已禁用"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {school._count.users}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">用户</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {school._count.classes}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">班级</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {school._count.examPapers}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">试卷</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
