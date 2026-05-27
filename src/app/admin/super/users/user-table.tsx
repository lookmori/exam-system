"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserActions } from "./user-actions";
import { ROLE_LABELS, type UserRole } from "@/lib/constants";
import { Trash2, X, Loader2 } from "lucide-react";

interface UserRow {
  userId: string;
  username: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
  school?: { schoolName: string } | null;
  class?: { className: string } | null;
}

export function UserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkResult, setBulkResult] = useState("");

  const deletable = users.filter(u => u.role !== "super_admin");
  const selectable = deletable.map(u => u.userId);
  const allSelected = selectable.length > 0 && selectable.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectable));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleBulkDelete() {
    setDeleting(true);
    setBulkResult("");
    const res = await fetch("/api/users/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [...selected] }),
    });
    const data = await res.json();
    if (res.ok) {
      setBulkResult(`成功删除 ${data.deleted} 个用户${data.skipped > 0 ? `，${data.skipped} 个被跳过（超级管理员或本人）` : ""}`);
    } else {
      setBulkResult(data.error || "操作失败");
    }
    setDeleting(false);
    setShowBulkDelete(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <>
      {/* Bulk action bar */}
      {someSelected && (
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-fun-lavender border-b-2 border-fun-lavender/30 animate-pop-in">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(new Set())} className="text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-white">已选择 {selected.size} 个用户</span>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setShowBulkDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            批量删除
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-4 w-12">
                <Checkbox checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">姓名</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">用户名</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">角色</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">所属学校</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">班级</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">状态</th>
              <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">注册时间</th>
              <th className="text-right p-4 text-xs font-medium text-slate-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-4">
                  {u.role !== "super_admin" && (
                    <Checkbox checked={selected.has(u.userId)} onChange={() => toggleOne(u.userId)} />
                  )}
                </td>
                <td className="p-4 text-sm font-medium text-slate-900">{u.name || "-"}</td>
                <td className="p-4 text-sm text-slate-700">{u.username}</td>
                <td className="p-4">
                  <Badge variant={u.role === "super_admin" ? "danger" : u.role === "school_admin" ? "warning" : u.role === "teacher" ? "primary" : "info"}>
                    {ROLE_LABELS[u.role as UserRole]}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-slate-600">{u.school?.schoolName || "-"}</td>
                <td className="p-4 text-sm text-slate-600">{u.class?.className || "-"}</td>
                <td className="p-4">
                  <Badge variant={u.status === "active" ? "success" : "danger"}>
                    {u.status === "active" ? "正常" : "禁用"}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                <td className="p-4 text-right">
                  <UserActions userId={u.userId} currentStatus={u.status} role={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk delete confirmation dialog */}
      <Dialog open={showBulkDelete} onClose={() => setShowBulkDelete(false)}>
        <DialogHeader>
          <DialogTitle>确认批量删除</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-500">
            确定要删除选中的 {selected.size} 个用户及其所有关联数据吗？此操作不可恢复。
          </p>
          {bulkResult && <p className="text-sm text-slate-600 mt-2">{bulkResult}</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkDelete(false)} disabled={deleting}>取消</Button>
          <Button variant="danger" onClick={handleBulkDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            确认删除 {selected.size} 个用户
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
