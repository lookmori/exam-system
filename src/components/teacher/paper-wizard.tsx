"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TitleImages, OptionImages, AnalysisImages } from "@/components/shared/question-images";
import { Loader2, ChevronLeft, ChevronRight, Check, GripVertical, X, Plus, Search } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";

const typeLabels: Record<string, string> = {
  single_choice: "单选题", multi_choice: "多选题", true_false: "判断题", programming: "编程题",
};

interface QuestionItem {
  questionId: string;
  title: string;
  questionType: string;
  optionContent?: Record<string, string>;
  score: number;
}

interface SelectedQuestion {
  questionId: string;
  sort: number;
  score: number;
  question: QuestionItem;
}

export function PaperWizard({ teacherId, schools }: { teacherId: string; schools: { schoolId: string; schoolName: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1-4
  const [saving, setSaving] = useState(false);
  const { alert: alertDialog } = useConfirm();

  // Step 1: Basic info
  const [basicInfo, setBasicInfo] = useState({
    paperTitle: "",
    schoolId: schools[0]?.schoolId || "",
    examDuration: 60,
    totalScore: 100,
    passScore: 60,
    isPublic: false,
    isRetry: false,
    startTime: "",
    endTime: "",
    classIds: [] as string[],
  });

  // Auto-calculate endTime based on startTime + examDuration
  useEffect(() => {
    if (basicInfo.startTime && basicInfo.examDuration > 0) {
      const start = new Date(basicInfo.startTime);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + basicInfo.examDuration * 60 * 1000);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
        setBasicInfo(f => ({ ...f, endTime: endStr }));
      }
    }
  }, [basicInfo.startTime, basicInfo.examDuration]);

  // Fetch classes when school changes
  const [classes, setClasses] = useState<{ classId: string; className: string }[]>([]);
  useEffect(() => {
    if (!basicInfo.schoolId) return;
    fetch(`/api/classes?schoolId=${basicInfo.schoolId}`).then(r => r.json())
      .then(data => setClasses(data.classes || [])).catch(() => setClasses([]));
  }, [basicInfo.schoolId]);

  // Step 2: Question selection
  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadQuestions = useCallback(async () => {
    if (!basicInfo.schoolId) return;
    setLoadingQuestions(true);
    const params = new URLSearchParams({ schoolId: basicInfo.schoolId, pageSize: "100" });
    if (keyword) params.set("keyword", keyword);
    if (typeFilter !== "all") params.set("type", typeFilter);
    const res = await fetch(`/api/questions?${params}`);
    const data = await res.json();
    setAvailableQuestions(data.questions || []);
    setLoadingQuestions(false);
  }, [basicInfo.schoolId, keyword, typeFilter]);

  useEffect(() => {
    if (step === 2) loadQuestions();
  }, [step, loadQuestions]);

  function addQuestion(q: QuestionItem) {
    if (selectedQuestions.find(sq => sq.questionId === q.questionId)) return;
    setSelectedQuestions(prev => [...prev, {
      questionId: q.questionId,
      sort: prev.length,
      score: q.score,
      question: q,
    }]);
  }

  function removeQuestion(questionId: string) {
    setSelectedQuestions(prev => prev.filter(q => q.questionId !== questionId));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const next = [...selectedQuestions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSelectedQuestions(next.map((q, i) => ({ ...q, sort: i })));
  }

  function updateQuestionScore(questionId: string, score: number) {
    setSelectedQuestions(prev => prev.map(q => q.questionId === questionId ? { ...q, score } : q));
  }

  async function handleCreate() {
    setSaving(true);

    const totalScore = selectedQuestions.reduce((sum, q) => sum + q.score, 0);
    const body = {
      paperTitle: basicInfo.paperTitle,
      schoolId: basicInfo.schoolId,
      examDuration: basicInfo.examDuration,
      totalScore,
      passScore: basicInfo.passScore || null,
      isPublic: basicInfo.isPublic,
      isRetry: basicInfo.isRetry,
      startTime: basicInfo.startTime || undefined,
      endTime: basicInfo.endTime || undefined,
      classIds: basicInfo.classIds,
      questions: selectedQuestions.map((q, i) => ({
        questionId: q.questionId,
        sort: i,
        score: q.score,
      })),
    };

    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/teacher/papers/${data.paper.paperId}`);
      router.refresh();
    } else {
      const data = await res.json();
      await alertDialog({ message: data.error || "创建失败", icon: "warning" });
    }
  }

  function canProceedFromStep1() {
    if (!basicInfo.paperTitle.trim()) return false;
    if (!basicInfo.startTime) return false;
    if (basicInfo.examDuration <= 0) return false;
    if (basicInfo.classIds.length === 0) return false;
    return true;
  }

  function handleNext() {
    if (step === 1 && !canProceedFromStep1()) {
      const missing: string[] = [];
      if (!basicInfo.paperTitle.trim()) missing.push("试卷标题");
      if (!basicInfo.startTime) missing.push("开始时间");
      if (basicInfo.examDuration <= 0) missing.push("考试时长");
      if (basicInfo.classIds.length === 0) missing.push("参与班级");
      alertDialog({ message: `请填写：${missing.join("、")}`, icon: "warning" });
      return;
    }
    setStep(s => s + 1);
  }

  // Step content
  return (
    <div>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["基本信息", "选题组卷", "调整确认", "预览发布"].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              step === i + 1 ? "bg-blue-100 text-blue-700" : step > i + 1 ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            }`}>
              {step > i + 1 ? <Check className="h-4 w-4" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-xs">{i + 1}</span>}
              {label}
            </div>
            {i < 3 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic info */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">试卷标题</Label>
              <Input id="title" value={basicInfo.paperTitle}
                onChange={e => setBasicInfo(f => ({ ...f, paperTitle: e.target.value }))}
                placeholder="输入试卷标题" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">所属学校</Label>
                <Select id="school" value={basicInfo.schoolId}
                  onChange={val => setBasicInfo(f => ({ ...f, schoolId: val }))}
                  options={schools.map(s => ({ value: s.schoolId, label: s.schoolName }))} />
              </div>
              <div>
                <Label htmlFor="duration">考试时长 (分钟)</Label>
                <Input id="duration" type="number" value={basicInfo.examDuration}
                  onChange={e => setBasicInfo(f => ({ ...f, examDuration: Number(e.target.value) || 0 }))} min={1} />
              </div>
              <div>
                <Label htmlFor="passScore">及格分数</Label>
                <Input id="passScore" type="number" value={basicInfo.passScore}
                  onChange={e => setBasicInfo(f => ({ ...f, passScore: Number(e.target.value) || 0 }))} min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">开始时间</Label>
                <Input id="startTime" type="datetime-local" value={basicInfo.startTime}
                  onChange={e => setBasicInfo(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="endTime">结束时间</Label>
                <Input id="endTime" type="datetime-local" value={basicInfo.endTime}
                  onChange={e => setBasicInfo(f => ({ ...f, endTime: e.target.value }))} />
                <p className="text-xs text-slate-400 mt-1">根据开始时间和考试时长自动计算（北京时间），可手动修改</p>
              </div>
            </div>
            <div>
              <Label>参与班级</Label>
              {classes.length === 0 ? (
                <p className="text-xs text-slate-400 mt-1">该学校暂无班级</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {classes.map(c => {
                    const selected = basicInfo.classIds.includes(c.classId);
                    return (
                      <button type="button" key={c.classId}
                        onClick={() => {
                          setBasicInfo(f => ({
                            ...f,
                            classIds: selected
                              ? f.classIds.filter(id => id !== c.classId)
                              : [...f.classIds, c.classId],
                          }));
                        }}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors ${selected ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        {c.className}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={basicInfo.isPublic} onChange={e => setBasicInfo(f => ({ ...f, isPublic: e.target.checked }))} className="rounded" />
                公开试卷
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={basicInfo.isRetry} onChange={e => setBasicInfo(f => ({ ...f, isRetry: e.target.checked }))} className="rounded" />
                允许重考
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select questions */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Available questions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">题库</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <Input value={keyword} onChange={e => setKeyword(e.target.value)}
                      placeholder="搜索题目..." className="pl-8" />
                  </div>
                  <Select value={typeFilter} onChange={val => setTypeFilter(val)}
                    options={[{ value: "all", label: "全部类型" }, ...Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))]} />
                </div>
              </CardHeader>
              <CardContent>
                {loadingQuestions ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {availableQuestions.filter(q => !selectedQuestions.find(sq => sq.questionId === q.questionId)).map(q => (
                      <div key={q.questionId} className="flex items-start justify-between gap-2 p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="default" className="text-[10px]">{typeLabels[q.questionType]}</Badge>
                            <span className="text-xs text-slate-400">{q.score} 分</span>
                          </div>
                          <div className="text-sm text-slate-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.title }} />
                        </div>
                        <button onClick={() => addQuestion(q)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 shrink-0">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {availableQuestions.length === 0 && (
                      <p className="text-sm text-slate-400 py-8 text-center">题库中没有可用题目</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected questions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">已选题目 ({selectedQuestions.length})</CardTitle>
                <p className="text-xs text-slate-500 mt-1">总分：{selectedQuestions.reduce((s, q) => s + q.score, 0)} 分</p>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {selectedQuestions.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">从左侧题库中选择题目</p>
                ) : (
                  <div className="space-y-2">
                    {selectedQuestions.map((q, i) => (
                      <div key={q.questionId} className="p-2 rounded-md bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge variant="default" className="text-[10px]">{i + 1}</Badge>
                          <span className="text-xs text-slate-500 line-clamp-1">{typeLabels[q.question.questionType]}</span>
                          <button onClick={() => removeQuestion(q.questionId)} className="ml-auto p-0.5 text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="text-xs text-slate-700 line-clamp-1" dangerouslySetInnerHTML={{ __html: q.question.title }} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Reorder & adjust scores */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>调整顺序和分值</CardTitle>
            <p className="text-xs text-slate-500 mt-1">总分：{selectedQuestions.reduce((s, q) => s + q.score, 0)} 分</p>
          </CardHeader>
          <CardContent>
            {selectedQuestions.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">请先在选题步骤中添加题目</p>
            ) : (
              <div className="space-y-2">
                {selectedQuestions.map((q, i) => (
                  <div key={q.questionId} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={() => moveQuestion(i, 1)} disabled={i === selectedQuestions.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-medium text-slate-500 w-6 text-center">{i + 1}</span>
                    </div>
                    <Badge variant="default" className="text-[10px]">{typeLabels[q.question.questionType]}</Badge>
                    <div className="flex-1 text-sm text-slate-700 line-clamp-1" dangerouslySetInnerHTML={{ __html: q.question.title }} />
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs">分</Label>
                      <Input type="number" value={q.score}
                        onChange={e => updateQuestionScore(q.questionId, Number(e.target.value) || 0)}
                        min={0} className="w-16 text-center" />
                    </div>
                    <button onClick={() => removeQuestion(q.questionId)} className="p-1 text-red-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>试卷预览</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1 mb-6 text-sm text-slate-600">
              <p>标题：<span className="font-medium text-slate-900">{basicInfo.paperTitle}</span></p>
              <p>时长：{basicInfo.examDuration} 分钟 · 总分：{selectedQuestions.reduce((s, q) => s + q.score, 0)} 分 · 及格线：{basicInfo.passScore || "无"}</p>
              <p>公开：{basicInfo.isPublic ? "是" : "否"} · 重考：{basicInfo.isRetry ? "允许" : "不允许"}</p>
            </div>

            <div className="space-y-4">
              {selectedQuestions.map((q, i) => (
                <div key={q.questionId} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-500">{i + 1}.</span>
                    <Badge variant="default">{typeLabels[q.question.questionType]}</Badge>
                    <span className="text-xs text-slate-400">{q.score} 分</span>
                  </div>
                  <div className="text-sm text-slate-800 mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question.title }} />
                  <TitleImages images={(q.question as any).titleImgs} />
                  {q.question.optionContent && (
                    <div className="ml-4 space-y-1">
                      {Object.entries(q.question.optionContent).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-sm text-slate-600">{k}. {v}</p>
                          <OptionImages images={(q.question as any).optionImgs?.[k]} optionKey={k} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : router.push("/admin/teacher/papers")}>
          <ChevronLeft className="h-4 w-4 mr-1" />{step === 1 ? "返回" : "上一步"}
        </Button>

        <div className="flex items-center gap-3">
          {step < 4 ? (
            <Button onClick={handleNext}>
              下一步<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              创建试卷
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
