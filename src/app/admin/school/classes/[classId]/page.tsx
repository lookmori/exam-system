"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, ArrowLeft, Plus, Upload, Download, Trash2, X, Loader2 } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface StudentRow {
  userId: string;
  username: string;
  name: string | null;
  status: string;
  createdAt: string;
}

interface ClassData {
  classId: string;
  className: string;
  school: { schoolId: string; schoolName: string };
  users: StudentRow[];
}

function exportStudents(cls: ClassData) {
  const data = cls.users.map(u => ({
    "姓名": u.name || u.username,
    "用户名": u.username,
    "状态": u.status === "active" ? "正常" : "禁用",
    "加入时间": new Date(u.createdAt).toLocaleDateString("zh-CN"),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "学生列表");
  XLSX.writeFile(wb, `${cls.className}-学生名单.xlsx`);
}

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [cls, setCls] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showDeleteClass, setShowDeleteClass] = useState(false);
  const [deleteClassError, setDeleteClassError] = useState("");
  const [deletingClass, setDeletingClass] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/classes/${classId}`);
    const data = await res.json();
    setCls(data);
    setLoading(false);
  }, [classId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSelected = cls && cls.users.length > 0 && cls.users.every(u => selected.has(u.userId));
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else if (cls) {
      setSelected(new Set(cls.users.map(u => u.userId)));
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
    await fetch("/api/users/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [...selected] }),
    });
    setDeleting(false);
    setShowBulkDelete(false);
    setSelected(new Set());
    fetchData();
  }

  async function handleDeleteClass() {
    setDeletingClass(true);
    setDeleteClassError("");
    const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteClassError(data.error || "删除失败");
      setDeletingClass(false);
      return;
    }
    setDeletingClass(false);
    setShowDeleteClass(false);
    router.push("/admin/school/classes");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">班级不存在</p>
        <Link href="/admin/school/classes"><Button variant="outline" className="mt-4">返回班级列表</Button></Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/school/classes"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <PageHeader title={cls.className} description={cls.school.schoolName}
          actions={<>
            <Button variant="outline" onClick={() => exportStudents(cls)}>
              <Download className="h-4 w-4 mr-1.5" />导出名单
            </Button>
            <Link href={`/admin/school/classes/${classId}/import`}><Button variant="outline"><Upload className="h-4 w-4 mr-1.5" />批量导入</Button></Link>
            <Link href={`/admin/school/students/create?classId=${classId}`}><Button><Plus className="h-4 w-4 mr-1.5" />添加学生</Button></Link>
            <Button variant="danger" onClick={() => { setShowDeleteClass(true); setDeleteClassError(""); }}>
              <Trash2 className="h-4 w-4 mr-1.5" />删除班级
            </Button>
          </>} />
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 mb-4 bg-fun-lavender border-b-2 border-fun-lavender/30 rounded-xl animate-pop-in">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(new Set())} className="text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-white">已选择 {selected.size} 个学生</span>
          </div>
          <Button size="sm" variant="danger" onClick={() => setShowBulkDelete(true)}>
            <Trash2 className="h-4 w-4 mr-1" />批量删除
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />学生列表 ({cls.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cls.users.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">暂无学生</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="p-4 w-12">
                      <Checkbox checked={allSelected || false} onChange={toggleAll} />
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">姓名</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">用户名</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">状态</th>
                    <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">加入时间</th>
                  </tr>
                </thead>
                <tbody>
                  {cls.users.map((u) => (
                    <tr key={u.userId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4">
                        <Checkbox checked={selected.has(u.userId)} onChange={() => toggleOne(u.userId)} />
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-900">{u.name || "-"}</td>
                      <td className="p-4 text-sm text-slate-700">{u.username}</td>
                      <td className="p-4">
                        <Badge variant={u.status === "active" ? "success" : "danger"}>{u.status === "active" ? "正常" : "禁用"}</Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk delete dialog */}
      <Dialog open={showBulkDelete} onClose={() => setShowBulkDelete(false)}>
        <DialogHeader>
          <DialogTitle>确认批量删除学生</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-500">
            确定要删除选中的 {selected.size} 个学生及其所有关联数据吗？此操作不可恢复。
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowBulkDelete(false)} disabled={deleting}>取消</Button>
          <Button variant="danger" onClick={handleBulkDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            确认删除 {selected.size} 个学生
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete class dialog */}
      <Dialog open={showDeleteClass} onClose={() => setShowDeleteClass(false)}>
        <DialogHeader>
          <DialogTitle>确认删除班级</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-500">
            此操作将永久删除班级「{cls.className}」及其所有学生关联数据，不可恢复。确定要继续吗？
          </p>
          {deleteClassError && <p className="text-sm text-red-500 mt-2">{deleteClassError}</p>}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteClass(false)} disabled={deletingClass}>取消</Button>
          <Button variant="danger" onClick={handleDeleteClass} disabled={deletingClass}>
            {deletingClass ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            确认删除班级
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
