"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Loader2, Info } from "lucide-react";
import Link from "next/link";

interface Props { schoolId: string; classes: { classId: string; className: string }[]; defaultClassId?: string; }

export function CreateStudentForm({ schoolId, classes, defaultClassId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(defaultClassId || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || undefined,
        role: "student",
        schoolId,
        ...(classId && { classId }),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "创建失败");
      setLoading(false);
      return;
    }
    router.push(defaultClassId ? `/admin/school/classes/${defaultClassId}` : "/admin/school/students");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-fun-sky-light/50 border-2 border-fun-sky/20 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-fun-sky shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600">
          <p className="font-semibold mb-1">自动生成账号</p>
          <p>系统将自动生成以 <strong>1</strong> 开头的 <strong>8位数字</strong> 作为学生登录账号，初始密码为 <strong>123456</strong>。</p>
        </div>
      </div>

      <div>
        <Label htmlFor="name">姓名（可选）</Label>
        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="输入学生姓名" />
      </div>

      {classes.length > 0 && (
        <div>
          <Label htmlFor="class">班级</Label>
          <Select id="class" value={classId}
            onChange={val => setClassId(val)}
            options={[{ value: "", label: "请选择班级（可选）" }, ...classes.map(c => ({ value: c.classId, label: c.className }))]} />
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Link href={defaultClassId ? `/admin/school/classes/${defaultClassId}` : "/admin/school/students"}>
          <Button type="button" variant="outline">取消</Button>
        </Link>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
          生成学生账号
        </Button>
      </div>
    </form>
  );
}
