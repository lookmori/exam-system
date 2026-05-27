import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserTable } from "./user-table";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { Plus, Search, Upload } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ search?: string; role?: string; page?: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "super_admin") redirect("/admin/dashboard");

  const params = await searchParams;
  const search = params.search || "";
  const role = params.role || "";
  const page = parseInt(params.page || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [{ username: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }];
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        userId: true, username: true, name: true, role: true, status: true,
        createdAt: true,
        school: { select: { schoolName: true } },
        class: { select: { className: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <PageHeader title="用户管理" description="管理全平台用户账号"
        actions={<div className="flex gap-2"><Link href="/admin/super/users/import"><Button variant="outline"><Upload className="h-4 w-4 mr-1.5" />批量导入</Button></Link><Link href="/admin/super/users/create"><Button><Plus className="h-4 w-4 mr-1.5" />新建用户</Button></Link></div>} />

      <Card className="mb-4">
        <CardContent className="p-4">
          <form className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              <Input name="search" defaultValue={search} placeholder="搜索用户名..."
                className="pl-9" />
            </div>
            <Select name="role" defaultValue={role}
              options={[{ value: "", label: "全部角色" }, ...Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))]} />
            <Button type="submit" variant="outline" size="sm">筛选</Button>
            {(search || role) && (
              <Link href="/admin/super/users">
                <Button variant="ghost" size="sm">清除筛选</Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">暂无用户数据</p>
          ) : (
            <>
              <UserTable users={JSON.parse(JSON.stringify(users))} />
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <p className="text-sm text-slate-500">共 {total} 个用户，第 {page}/{totalPages} 页</p>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Link key={p} href={`/admin/super/users?${new URLSearchParams({ ...(search && { search }), ...(role && { role }), page: String(p) })}`}>
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
