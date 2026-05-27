"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";

export function QuestionActions({ questionId, questionType }: { questionId: string; questionType: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm } = useConfirm();

  async function handleDelete() {
    const ok = await confirm({ message: "确定要删除这道题目吗？", variant: "danger", confirmText: "删除" });
    if (!ok) return;
    setDeleting(true);
    await fetch(`/api/questions/${questionId}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-slate-100 transition-colors">
        <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-28 bg-white rounded-md shadow-lg border border-slate-200 py-1">
            <button onClick={() => { router.push(`/admin/teacher/questions/${questionId}/edit`); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              <Edit className="h-3.5 w-3.5" />编辑
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />删除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
