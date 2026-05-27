"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

export function CreateTeacherForm({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || undefined,
        role: "teacher",
        schoolId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "创建失败");
      setLoading(false);
      return;
    }

    router.push("/admin/school/teachers");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/school/teachers"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <PageHeader title="添加教师" description={schoolName} />
      </div>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>新建教师账号</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-fun-sky-light/50 border-2 border-fun-sky/20 p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-fun-sky shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-semibold mb-1">自动生成账号</p>
                <p>系统将自动生成以 <strong>2</strong> 开头的 <strong>8位数字</strong> 作为教师登录账号，初始密码为 <strong>123456</strong>。</p>
              </div>
            </div>

            <div>
              <Label htmlFor="name">姓名（可选）</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="输入教师姓名" />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/admin/school/teachers"><Button type="button" variant="outline">取消</Button></Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                生成教师账号
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
