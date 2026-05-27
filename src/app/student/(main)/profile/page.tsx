"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import { User, Shield } from "lucide-react";

export default function StudentProfile() {
  const { data: session } = useSession();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("两次密码不一致"); return; }
    if (newPw.length < 6) { toast.error("新密码至少6个字符"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "修改失败"); }
      toast.success("密码修改成功");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="个人中心" description="管理您的个人信息和密码" />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">用户名：</span>
            <span className="font-medium text-slate-900">{session?.user?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">角色：</span>
            <span className="font-medium text-slate-900">学生</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">修改密码</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old">原密码</Label>
              <Input id="old" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="请输入原密码" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">新密码</Label>
              <Input id="new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="至少6个字符" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">确认新密码</Label>
              <Input id="confirm" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="再次输入新密码" required />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "修改中..." : "修改密码"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
