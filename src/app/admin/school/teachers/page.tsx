import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "school_admin") redirect("/admin/dashboard");

  const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
  const schoolId = admin?.adminSchoolId;
  if (!schoolId) redirect("/admin/dashboard");

  const params = await searchParams;
  const search = params.search || "";

  const teachers = await prisma.teacherSchool.findMany({
    where: {
      schoolId,
      ...(search && { teacher: { OR: [{ username: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] } }),
    },
    include: {
      teacher: { select: { userId: true, username: true, name: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const school = await prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } });

  return (
    <div>
      <PageHeader title="教师管理" description={school?.schoolName || ""}
        actions={<>
          <Link href="/admin/school/teachers/import"><Button variant="outline"><Upload className="h-4 w-4 mr-1.5" />批量导入</Button></Link>
          <Link href="/admin/school/teachers/create"><Button><Plus className="h-4 w-4 mr-1.5" />添加教师</Button></Link>
        </>} />

      <Card>
        <CardContent className="p-4">
          <form className="flex gap-3">
            <input name="search" defaultValue={search} placeholder="搜索教师姓名或用户名…"
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            <Button type="submit" variant="outline" size="sm">搜索</Button>
            {search && <Link href="/admin/school/teachers"><Button variant="ghost" size="sm">清除</Button></Link>}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-0">
          {teachers.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">暂无教师</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 text-xs font-medium text-slate-500">姓名</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500">用户名</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500">状态</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500">加入时间</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((ts) => (
                    <tr key={ts.teacher.userId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4 text-sm font-medium text-slate-900">{ts.teacher.name || "-"}</td>
                      <td className="p-4 text-sm text-slate-700">{ts.teacher.username}</td>
                      <td className="p-4">
                        <Badge variant={ts.teacher.status === "active" ? "success" : "danger"}>
                          {ts.teacher.status === "active" ? "正常" : "禁用"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{new Date(ts.teacher.createdAt).toLocaleDateString("zh-CN")}</td>
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
