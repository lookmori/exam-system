"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Loader2, Download, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface ImportResult { success: number; failed: number; created?: { name: string | null; username: string }[]; }

function exportAccounts(created: { name: string | null; username: string }[]) {
  const data = created.map(c => ({ "姓名": c.name || c.username, "登录账号": c.username, "初始密码": "123456" }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "账号列表");
  XLSX.writeFile(wb, "学生账号.xlsx");
}

export default function ClassImportStudentsPage() {
  const router = useRouter();
  const params = useParams<{ classId: string }>();
  const classId = params.classId;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleParse() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/users/import/parse", { method: "POST", body: formData });
    const data = await res.json();
    // Force student role and add classId context
    setPreview((data.rows || []).map((r: any) => ({ ...r, role: "student" })));
    setLoading(false);
  }

  async function handleImport() {
    setImporting(true);
    const validRows = preview.filter((r: any) => !r.error).map((r: any) => ({ ...r, classId }));
    const res = await fetch("/api/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: validRows }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
  }

  const validCount = preview.filter((r: any) => !r.error).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/school/classes/${classId}`}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-2xl font-bold text-slate-900">批量导入学生</h1>
      </div>

      {result ? (
        <Card><CardContent className="py-12 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">导入完成</h3>
          <p className="text-sm text-slate-500 mb-6">成功 {result.success} 个，失败 {result.failed} 个</p>
          <div className="flex justify-center gap-3">
            <Link href={`/admin/school/classes/${classId}`}><Button variant="outline">返回班级</Button></Link>
            {result.created && result.created.length > 0 && (
              <Button onClick={() => exportAccounts(result.created!)} variant="success">
                <Download className="h-4 w-4 mr-1.5" />导出账号 ({result.created.length})
              </Button>
            )}
            <Button onClick={() => { setResult(null); setPreview([]); setFile(null); }}>继续导入</Button>
          </div>
        </CardContent></Card>
      ) : preview.length > 0 ? (
        <Card><CardContent className="p-0">
          <div className="p-4 border-b"><span className="text-sm font-medium">数据预览</span><span className="ml-2 text-xs text-slate-500">({validCount} 条有效，将导入到此班级)</span></div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3 text-left">姓名</th><th className="p-3 text-left">用户名</th><th className="p-3 text-left">状态</th></tr></thead>
              <tbody>{preview.slice(0, 50).map((row: any, i: number) => (
                <tr key={i} className="border-b last:border-0"><td className="p-3">{row.name || "-"}</td><td className="p-3">{row.username}</td><td className="p-3">{row.error ? <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle className="h-3 w-3" />{row.error}</span> : <CheckCircle className="h-4 w-4 text-emerald-500" />}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 p-4 border-t"><Button variant="outline" onClick={() => { setPreview([]); setFile(null); }}>重新上传</Button><Button onClick={handleImport} disabled={importing || validCount === 0}>{importing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}确认导入 {validCount} 人</Button></div>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="py-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">上传Excel文件</h3>
          <p className="text-sm text-slate-500 mb-6">列：name（姓名，可选）、username（留空自动生成）、password（留空默认123456）。学生将自动导入到此班级。</p>
          <input type="file" accept=".xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)}
            className="block mx-auto mb-3 text-sm file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700" />
          {file && <Button onClick={handleParse} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}解析文件</Button>}
        </CardContent></Card>
      )}
    </div>
  );
}
