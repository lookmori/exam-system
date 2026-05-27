"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import { CodeEditor } from "@/components/shared/code-editor";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";
import Link from "next/link";

const questionTypes = [
  { value: "single_choice", label: "单选题" },
  { value: "multi_choice", label: "多选题" },
  { value: "true_false", label: "判断题" },
  { value: "programming", label: "编程题" },
];

const optionLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface QuestionFormData {
  questionId?: string;
  title: string;
  questionType: string;
  optionContent?: Record<string, string>;
  score: number;
  answer: string;
  analysis?: string;
  titleImgs?: string[];
  optionImgs?: Record<string, string[]>;
  analysisImgs?: string[];
}

export function QuestionForm({ schoolId, initialData }: { schoolId: string; initialData?: QuestionFormData }) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { alert: alertDialog } = useConfirm();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    questionType: initialData?.questionType || "single_choice",
    title: initialData?.title || "",
    score: initialData?.score || 1,
    answer: initialData?.answer || "",
    analysis: initialData?.analysis || "",
    options: initialData?.optionContent
      ? Object.entries(initialData.optionContent).map(([key, value]) => ({ key, value }))
      : [{ key: "A", value: "" }, { key: "B", value: "" }],
    titleImgs: initialData?.titleImgs || [] as string[],
    optionImgs: initialData?.optionImgs || {} as Record<string, string[]>,
    analysisImgs: initialData?.analysisImgs || [] as string[],
  });

  useEffect(() => {
    if (form.questionType === "programming") {
      setForm(f => ({ ...f, options: [], optionImgs: {} }));
    } else if (form.questionType === "true_false") {
      setForm(f => ({
        ...f,
        options: f.options.length === 2 ? f.options : [{ key: "正确", value: "正确" }, { key: "错误", value: "错误" }],
        answer: f.answer === "正确" || f.answer === "错误" ? f.answer : "正确",
      }));
    } else if (["single_choice", "multi_choice"].includes(form.questionType) && form.options.length === 0) {
      setForm(f => ({ ...f, options: [{ key: "A", value: "" }, { key: "B", value: "" }] }));
    }
  }, [form.questionType]);

  function addOption() {
    const nextKey = optionLabels[form.options.length];
    if (nextKey) setForm(f => ({ ...f, options: [...f.options, { key: nextKey, value: "" }] }));
  }

  function removeOption(index: number) {
    setForm(f => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
    }));
  }

  function updateOptionImage(key: string, urls: string[]) {
    setForm(f => ({
      ...f,
      optionImgs: { ...f.optionImgs, [key]: urls },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const optionContent = form.options.length > 0
      ? Object.fromEntries(form.options.map(o => [o.key, o.value]))
      : undefined;

    const body = {
      schoolId,
      questionType: form.questionType,
      title: form.title,
      titleImgs: form.titleImgs,
      score: form.score,
      answer: form.answer,
      analysis: form.analysis || undefined,
      analysisImgs: form.analysisImgs,
      optionContent,
      optionImgs: Object.keys(form.optionImgs).length > 0 ? form.optionImgs : undefined,
    };

    const url = isEdit ? `/api/questions/${initialData.questionId}` : "/api/questions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      router.push("/admin/teacher/questions");
      router.refresh();
    } else {
      const data = await res.json();
      await alertDialog({ message: data.error || "保存失败", icon: "warning" });
    }
  }

  const needsOptions = ["single_choice", "multi_choice", "true_false"].includes(form.questionType);

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/teacher/questions" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />返回题库
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "编辑题目" : "新建题目"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="type">题型</Label>
              <Select id="type" value={form.questionType}
                onChange={val => setForm(f => ({ ...f, questionType: val }))}
                options={questionTypes} />
            </div>

            <div>
              <Label htmlFor="title">题目内容 (支持HTML)</Label>
              <Textarea id="title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="输入题目内容..." rows={4} />
              <div className="mt-2">
                <Label className="text-xs text-slate-400 mb-1 block">题目配图</Label>
                <ImageUpload images={form.titleImgs} onChange={urls => setForm(f => ({ ...f, titleImgs: urls }))} />
              </div>
            </div>

            {needsOptions && (
              <div>
                <Label>选项</Label>
                <div className="space-y-3 mt-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 shrink-0">{opt.key}</span>
                        <Input value={opt.value}
                          onChange={e => {
                            const next = [...form.options];
                            next[i] = { ...next[i], value: e.target.value };
                            setForm(f => ({ ...f, options: next }));
                          }}
                          placeholder={`选项 ${opt.key} 的内容`} />
                        {form.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(i)} className="p-1.5 text-red-400 hover:text-red-600 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="ml-10">
                        <Label className="text-xs text-slate-400 mb-1 block">选项 {opt.key} 配图</Label>
                        <ImageUpload
                          images={form.optionImgs[opt.key] || []}
                          onChange={urls => updateOptionImage(opt.key, urls)}
                          max={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {form.options.length < 8 && (
                  <button type="button" onClick={addOption}
                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                    <Plus className="h-3.5 w-3.5" />添加选项
                  </button>
                )}
              </div>
            )}

            <div>
              <Label>正确答案</Label>
              {form.questionType === "programming" ? (
                <div className="mt-1">
                  <p className="text-xs text-slate-400 mb-1">参考代码</p>
                  <CodeEditor
                    value={form.answer}
                    onChange={val => setForm(f => ({ ...f, answer: val }))}
                    language="python"
                    height="300px"
                  />
                </div>
              ) : form.questionType === "multi_choice" ? (
                <div className="space-y-1.5 mt-1">
                  {form.options.map(opt => {
                    const selected: string[] = (() => { try { return JSON.parse(form.answer || "[]"); } catch { return []; } })();
                    const isChecked = selected.includes(opt.key);
                    return (
                      <label key={opt.key} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${isChecked ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 hover:border-slate-300"}`}>
                        <input type="checkbox" checked={isChecked}
                          onChange={() => {
                            const next = isChecked ? selected.filter(k => k !== opt.key) : [...selected, opt.key];
                            setForm(f => ({ ...f, answer: JSON.stringify(next) }));
                          }}
                          className="rounded" />
                        <span className="text-sm">{opt.key}. {opt.value || "(空)"}</span>
                      </label>
                    );
                  })}
                  <p className="text-xs text-slate-400 mt-1">勾选所有正确的选项</p>
                </div>
              ) : (
                <div className="space-y-1.5 mt-1">
                  {form.options.map(opt => (
                    <label key={opt.key} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${form.answer === opt.key ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" name="answer" checked={form.answer === opt.key}
                        onChange={() => setForm(f => ({ ...f, answer: opt.key }))}
                        className="text-blue-600" />
                      <span className="text-sm">{opt.key}. {opt.value || "(空)"}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="score">分值</Label>
              <Input id="score" type="number" value={form.score}
                onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) || 0 }))}
                min={0} />
            </div>

            <div>
              <Label htmlFor="analysis">解析 (可选)</Label>
              <Textarea id="analysis" value={form.analysis}
                onChange={e => setForm(f => ({ ...f, analysis: e.target.value }))}
                placeholder="输入题目解析..." rows={3} />
              <div className="mt-2">
                <Label className="text-xs text-slate-400 mb-1 block">解析配图</Label>
                <ImageUpload images={form.analysisImgs} onChange={urls => setForm(f => ({ ...f, analysisImgs: urls }))} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {isEdit ? "保存修改" : "创建题目"}
              </Button>
              <Link href="/admin/teacher/questions">
                <Button variant="outline" type="button">取消</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
