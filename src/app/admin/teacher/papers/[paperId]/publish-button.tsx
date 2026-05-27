"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";

export function PublishButton({ paperId }: { paperId: string }) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const { confirm, alert: alertDialog } = useConfirm();

  async function handlePublish() {
    const ok = await confirm({ message: "发布后学生即可参加考试，确定发布？", title: "发布试卷", confirmText: "确认发布", variant: "primary" });
    if (!ok) return;
    setPublishing(true);
    const res = await fetch(`/api/papers/${paperId}/publish`, { method: "PATCH" });
    setPublishing(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      await alertDialog({ message: data.error || "发布失败", icon: "warning" });
    }
  }

  return (
    <Button onClick={handlePublish} disabled={publishing}>
      {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
      发布试卷
    </Button>
  );
}
