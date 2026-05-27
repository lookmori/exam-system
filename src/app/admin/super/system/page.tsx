import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Database, Clock, Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SystemConfigPage() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") redirect("/admin/dashboard");

  const [userCount, schoolCount, paperCount, classCount] = await Promise.all([
    prisma.user.count(),
    prisma.school.count(),
    prisma.examPaper.count(),
    prisma.class.count(),
  ]);

  return (
    <div>
      <PageHeader title="系统配置" description="系统状态与配置管理" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>服务器和数据库运行状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">数据记录</span>
                </div>
                <span className="text-sm text-slate-700">{userCount} 用户 · {schoolCount} 学校 · {classCount} 班级 · {paperCount} 试卷</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">服务器时间</span>
                </div>
                <span className="text-sm font-mono text-slate-700">{new Date().toLocaleString("zh-CN")}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">运行状态</span>
                </div>
                <Badge variant="success">正常运行</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>基本设置</CardTitle>
            <CardDescription>平台基本参数配置</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">平台名称</label>
                <Input defaultValue="在线考试管理系统" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">默认考试时长（分钟）</label>
                <Input type="number" defaultValue="120" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">及格分数线</label>
                <Input type="number" defaultValue="60" />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit">保存设置</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
