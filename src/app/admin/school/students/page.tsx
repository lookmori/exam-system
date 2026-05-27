import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentActions } from "./student-actions";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "school_admin") redirect("/admin/dashboard");

  const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
  const schoolId = admin?.adminSchoolId;
  if (!schoolId) redirect("/admin/dashboard");

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const limit = 20;

  const where: Record<string, unknown> = { schoolId, role: "student" };
  if (search) where.OR = [{ username: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }];

  const [students, total, school] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { userId: true, username: true, name: true, status: true, createdAt: true, class: { select: { className: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.user.count({ where }),
    prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader title="学生管理" description={school?.schoolName || ""}
        actions={<><Link href="/admin/school/students/import"><Button variant="outline"><Upload className="h-4 w-4 mr-1.5" />批量导入</Button></Link>
        <Link href="/admin/school/students/create"><Button><Plus className="h-4 w-4 mr-1.5" />新建学生</Button></Link></>} />
      <Card className="mb-4">
        <CardContent className="p-4">
          <form className="flex gap-3">
            <input name="search" defaultValue={search} placeholder="搜索学生用户名..."
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Button type="submit" variant="outline" size="sm">搜索</Button>
            {search && <Link href="/admin/school/students"><Button variant="ghost" size="sm">清除</Button></Link>}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">暂无学生</p>
          ) : (
            <>
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left p-4 text-xs font-medium text-slate-500">姓名</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">用户名</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">班级</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">状态</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500">加入时间</th>
                  <th className="text-right p-4 text-xs font-medium text-slate-500">操作</th>
                </tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.userId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4 text-sm font-medium text-slate-900">{s.name || "-"}</td>
                      <td className="p-4 text-sm">{s.username}</td>
                      <td className="p-4 text-sm text-slate-500">{s.class?.className || "-"}</td>
                      <td className="p-4"><Badge variant={s.status === "active" ? "success" : "danger"}>{s.status === "active" ? "正常" : "禁用"}</Badge></td>
                      <td className="p-4 text-sm text-slate-500">{new Date(s.createdAt).toLocaleDateString("zh-CN")}</td>
                      <td className="p-4 text-right"><StudentActions userId={s.userId} currentStatus={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-slate-500">共 {total} 人，第 {page}/{totalPages} 页</p>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <Link key={p} href={`/admin/school/students?${new URLSearchParams({ ...(search && { search }), page: String(p) })}`}>
                        <Button variant={p === page ? "primary" : "outline"} size="sm">{p}</Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
