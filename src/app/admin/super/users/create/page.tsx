"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

const rolePrefixHint: Record<string, string> = {
  student: "学生账号以 1 开头，如 10012345",
  teacher: "教师账号以 2 开头，如 20012345",
  school_admin: "学校管理员账号以 3 开头，如 30012345",
  super_admin: "超级管理员账号以 9 开头，如 90012345",
};

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState<{ schoolId: string; schoolName: string }[]>([]);
  const [classes, setClasses] = useState<{ classId: string; className: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    role: "student" as UserRole,
    schoolId: "", classId: "",
  });

  useEffect(() => {
    fetch("/api/schools").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSchools(data);
    }).catch(() => {});
  }, []);

  async function onSchoolChange(schoolId: string) {
    setForm(f => ({ ...f, schoolId, classId: "" }));
    if (schoolId) {
      const res = await fetch(`/api/schools/${schoolId}/classes`);
      const data = await res.json();
      if (Array.isArray(data)) setClasses(data);
    } else {
      setClasses([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || undefined,
        role: form.role,
        ...(form.schoolId && { schoolId: form.schoolId }),
        ...(form.classId && { classId: form.classId }),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "创建失败");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/admin/super/users?created=${data.username}`);
    router.refresh();
  }

  const needsSchool = form.role === "school_admin" || form.role === "teacher" || form.role === "student";
  const needsClass = form.role === "student";

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/super/users"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <PageHeader title="创建用户" description="系统将自动生成8位数字账号" />
      </div>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>用户信息</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-fun-sky-light/50 border-2 border-fun-sky/20 p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-fun-sky shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-semibold mb-1">自动生成账号说明</p>
                <p>系统将根据角色自动生成 <strong>8位数字</strong> 作为登录账号，初始密码统一为 <strong>123456</strong>。</p>
                <p className="mt-1 text-xs text-slate-500">{rolePrefixHint[form.role]}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="name">姓名（可选）</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="输入姓名" />
            </div>

            <div>
              <Label htmlFor="role">角色</Label>
              <Select id="role" value={form.role}
                onChange={val => setForm(f => ({ ...f, role: val as UserRole, schoolId: "", classId: "" }))}
                options={Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
            </div>
            {needsSchool && (
              <div>
                <Label htmlFor="school">所属学校</Label>
                <Select id="school" value={form.schoolId}
                  onChange={val => onSchoolChange(val)}
                  options={[{ value: "", label: "请选择学校" }, ...schools.map(s => ({ value: s.schoolId, label: s.schoolName }))]} />
              </div>
            )}
            {needsClass && form.schoolId && (
              <div>
                <Label htmlFor="class">所属班级</Label>
                <Select id="class" value={form.classId}
                  onChange={val => setForm(f => ({ ...f, classId: val }))}
                  options={[{ value: "", label: "请选择班级" }, ...classes.map(c => ({ value: c.classId, label: c.className }))]} />
              </div>
            )}
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Link href="/admin/super/users"><Button type="button" variant="outline">取消</Button></Link>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                创建用户
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
