"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, X } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";
import Link from "next/link";

interface PaperData {
  paperId: string;
  paperTitle: string;
  examDuration: number;
  totalScore: number;
  passScore: number | null;
  isPublic: boolean;
  isRetry: boolean;
  classIds: string[];
  paperQuestions: {
    questionId: string;
    sort: number;
    score: number;
    question: { questionId: string; title: string; questionType: string; score: number };
  }[];
}

export function EditPaperForm({ paper }: { paper: PaperData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { alert: alertDialog } = useConfirm();
  const [form, setForm] = useState({
    paperTitle: paper.paperTitle,
    examDuration: paper.examDuration,
    passScore: paper.passScore || 0,
    isPublic: paper.isPublic,
    isRetry: paper.isRetry,
    questions: paper.paperQuestions.map(pq => ({
      questionId: pq.questionId,
      score: pq.score,
      sort: pq.sort,
      title: pq.question.title,
      questionType: pq.question.questionType,
    })),
  });

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/papers/${paper.paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperTitle: form.paperTitle,
        examDuration: form.examDuration,
        passScore: form.passScore || null,
        isPublic: form.isPublic,
        isRetry: form.isRetry,
        totalScore: form.questions.reduce((s, q) => s + q.score, 0),
        questions: form.questions.map((q, i) => ({
          questionId: q.questionId,
          sort: i,
          score: q.score,
        })),
      }),
    });

    setSaving(false);

    if (res.ok) {
      router.push(`/admin/teacher/papers/${paper.paperId}`);
      router.refresh();
    } else {
      const data = await res.json();
      await alertDialog({ message: data.error || "保存失败", icon: "warning" });
    }
  }

  function removeQuestion(questionId: string) {
    setForm(f => ({ ...f, questions: f.questions.filter(q => q.questionId !== questionId) }));
  }

  function updateScore(questionId: string, score: number) {
    setForm(f => ({
      ...f,
      questions: f.questions.map(q => q.questionId === questionId ? { ...q, score } : q),
    }));
  }

  const totalScore = form.questions.reduce((s, q) => s + q.score, 0);

  return (
    <div>
      <div className="mb-4">
        <Link href={`/admin/teacher/papers/${paper.paperId}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />返回试卷详情
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>编辑试卷</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">试卷标题</Label>
            <Input id="title" value={form.paperTitle}
              onChange={e => setForm(f => ({ ...f, paperTitle: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">考试时长 (分钟)</Label>
              <Input id="duration" type="number" value={form.examDuration}
                onChange={e => setForm(f => ({ ...f, examDuration: Number(e.target.value) || 0 }))} />
            </div>
            <div>
              <Label htmlFor="passScore">及格分数</Label>
              <Input id="passScore" type="number" value={form.passScore}
                onChange={e => setForm(f => ({ ...f, passScore: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} />
              公开试卷
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isRetry} onChange={e => setForm(f => ({ ...f, isRetry: e.target.checked }))} />
              允许重考
            </label>
          </div>

          <div>
            <Label>题目列表 (总分: {totalScore})</Label>
            <div className="space-y-2 mt-2">
              {form.questions.map((q, i) => (
                <div key={q.questionId} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                  <span className="text-sm font-medium text-slate-500">{i + 1}.</span>
                  <div className="flex-1 text-sm text-slate-700 line-clamp-1" dangerouslySetInnerHTML={{ __html: q.title }} />
                  <Input type="number" value={q.score}
                    onChange={e => updateScore(q.questionId, Number(e.target.value) || 0)}
                    min={0} className="w-16 text-center" />
                  <span className="text-xs text-slate-400">分</span>
                  <button onClick={() => removeQuestion(q.questionId)} className="p-1 text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {form.questions.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">无题目</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}保存修改
            </Button>
            <Link href={`/admin/teacher/papers/${paper.paperId}`}>
              <Button variant="outline" type="button">取消</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
