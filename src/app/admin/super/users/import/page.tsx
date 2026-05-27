"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Loader2, Download, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface PreviewRow { name?: string; username: string; password: string; role: string; schoolName?: string; className?: string; error?: string; }
interface ImportResult { success: number; failed: number; created?: { name: string | null; username: string }[]; }

function exportAccounts(created: { name: string | null; username: string }[]) {
  const data = created.map(c => ({ "姓名": c.name || c.username, "登录账号": c.username, "初始密码": "123456" }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 12 }, { wch: 15 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "账号列表");
  XLSX.writeFile(wb, "导入账号.xlsx");
}

export default function ImportUsersPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleParse() {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/users/import/parse", { method: "POST", body: formData });
    const data = await res.json();
    setPreview(data.rows || []);
    setLoading(false);
  }

  async function handleImport() {
    setImporting(true);
    const res = await fetch("/api/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview.filter(r => !r.error) }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
  }

  const validCount = preview.filter(r => !r.error).length;
  const errorCount = preview.filter(r => r.error).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/super/users"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <PageHeader title="批量导入用户" description="通过Excel文件批量导入用户账号" />
      </div>

      {result ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-slate-900 mb-1">导入完成</h3>
            <p className="text-sm text-slate-500 mb-6">
              成功导入 {result.success} 个用户{result.failed > 0 ? `，${result.failed} 个失败` : ""}
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/admin/super/users"><Button variant="outline">返回列表</Button></Link>
              {result.created && result.created.length > 0 && (
                <Button onClick={() => exportAccounts(result.created!)} variant="success">
                  <Download className="h-4 w-4 mr-1.5" />导出账号 ({result.created.length})
                </Button>
              )}
              <Button onClick={() => { setResult(null); setPreview([]); setFile(null); }}>继续导入</Button>
            </div>
          </CardContent>
        </Card>
      ) : preview.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>数据预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Badge variant="success">有效 {validCount} 行</Badge>
              {errorCount > 0 && <Badge variant="danger">错误 {errorCount} 行</Badge>}
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="p-3 text-left font-medium">姓名</th>
                    <th className="p-3 text-left font-medium">用户名</th>
                    <th className="p-3 text-left font-medium">密码</th>
                    <th className="p-3 text-left font-medium">角色</th>
                    <th className="p-3 text-left font-medium">学校</th>
                    <th className="p-3 text-left font-medium">班级</th>
                    <th className="p-3 text-left font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3">{row.name || "-"}</td>
                      <td className="p-3">{row.username}</td>
                      <td className="p-3 text-slate-400">******</td>
                      <td className="p-3">{row.role}</td>
                      <td className="p-3 text-slate-500">{row.schoolName || "-"}</td>
                      <td className="p-3 text-slate-500">{row.className || "-"}</td>
                      <td className="p-3">
                        {row.error ? (
                          <span className="flex items-center gap-1 text-red-500 text-xs">
                            <XCircle className="h-3 w-3" />{row.error}
                          </span>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => { setPreview([]); setFile(null); }}>重新上传</Button>
              <Button onClick={handleImport} disabled={importing || validCount === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                确认导入 {validCount} 个用户
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="max-w-md mx-auto text-center">
              <Upload className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">上传Excel文件</h3>
              <p className="text-sm text-slate-500 mb-6">
                文件列：name（姓名，可选）、role（角色，必填）、username（用户名，留空自动生成8位数字）、password（密码，留空默认123456）、schoolName（学校，可选）、className（班级，可选）
              </p>
              <div className="flex flex-col items-center gap-3">
                <input type="file" accept=".xlsx,.xls"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <Button onClick={handleParse} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    解析文件
                  </Button>
                )}
              </div>
              <div className="mt-6 pt-6 border-t">
                <a href="/api/templates/user-import" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
                  <Download className="h-3.5 w-3.5" />下载导入模板
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
