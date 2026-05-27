"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, BookOpen, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface ClassRow {
  classId: string;
  className: string;
  createdAt: string;
  _count: { users: number };
}

export function ClassCardGrid({ classes }: { classes: ClassRow[] }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/classes/${deleteTarget.classId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error || "删除失败");
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.classId} className="group relative cursor-pointer transition-all hover:shadow-md hover:border-blue-300">
            <Link href={`/admin/school/classes/${cls.classId}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700 text-lg font-bold">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{cls.className}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(cls.createdAt).toLocaleDateString("zh-CN")} 创建
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{cls._count.users}</span>
                  <span className="text-xs text-slate-400">名学生</span>
                </div>
              </CardContent>
            </Link>
            <button
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10"
              onClick={(e) => { e.preventDefault(); setDeleteTarget(cls); setDeleteError(""); }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Card>
        ))}
      </div>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogHeader>
          <DialogTitle>确认删除班级</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-500">
            此操作将永久删除班级「{deleteTarget?.className}」，学生将失去班级关联。确定要继续吗？
          </p>
          {deleteError && <p className="text-sm text-red-500 mt-2">{deleteError}</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>取消</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            确认删除
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
