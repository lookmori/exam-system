"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";

export function StudentActions({ userId, currentStatus }: { userId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function toggle() {
    setLoading(true);
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: currentStatus === "active" ? "disabled" : "active" }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error || "删除失败");
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setShowDelete(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" onClick={toggle} disabled={loading || deleting}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {currentStatus === "active" ? "禁用" : "启用"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => { setShowDelete(true); setDeleteError(""); }} disabled={deleting || loading}>
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-red-500" />}
      </Button>

      <Dialog open={showDelete} onClose={() => setShowDelete(false)}>
        <DialogHeader>
          <DialogTitle>确认删除学生</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-500">此操作将永久删除该学生及其所有关联数据，不可恢复。确定要继续吗？</p>
          {deleteError && <p className="text-sm text-red-500 mt-2">{deleteError}</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>取消</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            确认删除
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
