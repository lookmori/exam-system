"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";

export function PaperActions({ paperId, showPublish = true, showDelete = true }: { paperId: string; showPublish?: boolean; showDelete?: boolean }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, alert: alertDialog } = useConfirm();

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/papers/${paperId}/publish`, { method: "PATCH" });
    if (res.ok) router.refresh();
    else { const d = await res.json(); await alertDialog({ message: d.error, icon: "warning" }); }
    setPublishing(false);
  }

  async function handleDelete() {
    const ok = await confirm({ message: "确定要删除这份试卷吗？", variant: "danger", confirmText: "删除" });
    if (!ok) return;
    setDeleting(true);
    await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <span className="flex items-center gap-1.5">
      {showPublish && (
        <Button variant="ghost" size="sm" onClick={handlePublish} disabled={publishing}>
          {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "发布"}
        </Button>
      )}
      {showDelete && (
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-red-500 hover:text-red-700">
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "删除"}
        </Button>
      )}
    </span>
  );
}
