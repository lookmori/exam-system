"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, AlertTriangle, ChevronLeft, ChevronRight, Flag, EyeOff } from "lucide-react";
import { TitleImages, OptionImages } from "@/components/shared/question-images";
import { CodeEditor } from "@/components/shared/code-editor";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { useAntiCheat } from "@/components/exam/use-anti-cheat";

interface Question { questionId: string; title: string; questionType: string; optionContent?: Record<string, string>; score: number; answer: string; analysis?: string; }
interface Paper { paperId: string; paperTitle: string; examDuration: number; totalScore: number; passScore?: number; questions: { question: Question; sort: number; score: number }[]; }

export default function ExamPage() {
  const router = useRouter();
  const params = useParams<{ recordId: string }>();
  const recordId = params.recordId;
  const { alert: alertDialog } = useConfirm();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastSave, setLastSave] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const saveRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Anti-cheat
  const { flushViolations, stats } = useAntiCheat(recordId, !loading && !!paper);

  // Load exam data
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/exam/${recordId}`);
      const data = await res.json();
      if (data.error) { await alertDialog({ message: data.error, icon: "warning" }); router.push("/student/dashboard"); return; }
      setPaper(data.paper);

      // Restore saved answers
      if (data.record?.answerContent) {
        const saved = data.record.answerContent as Record<string, string>;
        setAnswers(saved);
      }

      // Calculate time left
      const startTime = new Date(data.record.startTime).getTime();
      const durationMs = data.paper.examDuration * 60 * 1000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      setTimeLeft(remaining);

      setLoading(false);
    }
    load();
  }, [recordId, router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft > 0]);

  // Auto-save every 30 seconds
  const saveAnswers = useCallback(async (ans: Record<string, string>) => {
    try {
      await fetch(`/api/exam/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans }),
      });
      flushViolations();
      setLastSave(new Date());
    } catch {}
  }, [recordId, flushViolations]);

  useEffect(() => {
    if (loading) return;
    saveRef.current = setInterval(() => saveAnswers(answersRef.current), 30000);
    return () => { if (saveRef.current) clearInterval(saveRef.current); };
  }, [loading, saveAnswers]); // eslint-disable-line

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !loading && !submitting) {
      handleSubmit();
    }
  }, [timeLeft]); // eslint-disable-line

  function handleAnswer(questionId: string, value: string) {
    setAnswers(a => ({ ...a, [questionId]: value }));
  }

  function toggleMark(idx: number) {
    setMarked(m => { const n = new Set(m); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });
  }

  async function handleSubmit() {
    setSubmitting(true);
    await flushViolations();
    await fetch(`/api/exam/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const res = await fetch(`/api/exam/${recordId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    setShowConfirm(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    router.push(`/student/scores/${recordId}`);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (!paper) return null;

  const questions = paper.questions.sort((a, b) => a.sort - b.sort);
  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isTimeWarning = timeLeft < 300;
  const unansweredQuestions = questions.filter(q => !answers[q.question.questionId]?.trim());
  const answeredCount = questions.length - unansweredQuestions.length;

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-slate-900 max-w-[200px] truncate">{paper.paperTitle}</h1>
          <Badge variant="default">{questions.length} 题 · {paper.totalScore} 分</Badge>
        </div>
        <div className="flex items-center gap-3">
          {lastSave && <span className="text-xs text-slate-400">已自动保存 {lastSave.toLocaleTimeString("zh-CN")}</span>}
          <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${isTimeWarning ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button size="sm" onClick={() => setShowConfirm(true)} disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            交卷
          </Button>
        </div>
      </div>

      {/* Violation warning bar */}
      {stats.total > 0 && (
        <div className="sticky top-[52px] z-20 flex items-center justify-between px-4 py-2 bg-red-50 border-b border-red-200 animate-pop-in">
          <div className="flex items-center gap-3">
            <EyeOff className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">
              异常行为警告
            </span>
            <span className="text-xs text-red-500">
              切屏 {stats.tabSwitches} 次
              {stats.fullscreenExits > 0 && <span className="ml-2">· 退出全屏 {stats.fullscreenExits} 次</span>}
              {stats.clipboardAttempts > 0 && <span className="ml-2">· 复制粘贴尝试 {stats.clipboardAttempts} 次</span>}
              {stats.keyboardShortcuts > 0 && <span className="ml-2">· 快捷键 {stats.keyboardShortcuts} 次</span>}
              {stats.contextMenus > 0 && <span className="ml-2">· 右键 {stats.contextMenus} 次</span>}
            </span>
          </div>
          <span className="text-xs text-red-400 font-medium">
            所有行为均已记录，请诚信考试
          </span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Question sidebar */}
        <div className="w-[240px] bg-white border-r border-slate-200 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-3 border-b border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>答题卡</span>
              <span>{answeredCount}/{totalQuestions}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(answeredCount / totalQuestions) * 100}%` }} />
            </div>
          </div>
          <div className="p-2 grid grid-cols-5 gap-1.5">
            {questions.map((pq, i) => {
              const aid = pq.question.questionId;
              const answered = answers[aid]?.trim();
              return (
                <button key={pq.question.questionId}
                  onClick={() => setCurrentIdx(i)}
                  className={`relative h-9 rounded text-xs font-medium transition-colors
                    ${i === currentIdx ? "ring-2 ring-blue-500 bg-blue-50 text-blue-700" :
                      answered ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                      "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {i + 1}
                  {marked.has(i) && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full" />}
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-100 inline-block" />已答</div>
            <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-100 inline-block" />未答</div>
            <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block ml-0.5" />标记</div>
          </div>
        </div>

        {/* Main question area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6">
                {/* Question header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-sm text-slate-400">
                      第 {currentIdx + 1}/{totalQuestions} 题 · {currentQ.score} 分 · {
                        { single_choice: "单选题", multi_choice: "多选题", true_false: "判断题", programming: "编程题" }[currentQ.question.questionType]
                      }
                    </span>
                    <div className="text-base font-medium text-slate-900 mt-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQ.question.title }} />
                    <TitleImages images={(currentQ.question as any).titleImgs} />
                  </div>
                </div>

                {/* Options */}
                {"single_choice multi_choice true_false".includes(currentQ.question.questionType) && currentQ.question.optionContent && (
                  <div className="space-y-2.5 mt-4">
                    {Object.entries(currentQ.question.optionContent as Record<string, string>).map(([key, text]) => {
                      const isMulti = currentQ.question.questionType === "multi_choice";
                      const selected = isMulti
                        ? (() => { try { return JSON.parse(answers[currentQ.question.questionId] || "[]"); } catch { return []; } })()
                        : answers[currentQ.question.questionId];
                      const isSelected = isMulti ? selected.includes(key) : selected === key;

                      return (
                        <button key={key}
                          onClick={() => {
                            if (isMulti) {
                              const current: string[] = (() => { try { return JSON.parse(answers[currentQ.question.questionId] || "[]"); } catch { return []; } })();
                              const next = current.includes(key) ? current.filter((k: string) => k !== key) : [...current, key];
                              handleAnswer(currentQ.question.questionId, JSON.stringify(next));
                            } else {
                              handleAnswer(currentQ.question.questionId, key);
                            }
                          }}
                          className={`w-full flex flex-col gap-2 p-3.5 rounded-lg border text-left text-sm transition-colors
                            ${isSelected ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                          <div className="flex items-center gap-3">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0
                              ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>{key}</span>
                            <span>{text}</span>
                          </div>
                          <OptionImages images={(currentQ.question as any).optionImgs?.[key]} optionKey={key} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Programming */}
                {currentQ.question.questionType === "programming" && (
                  <div className="mt-4">
                    <CodeEditor
                      value={answers[currentQ.question.questionId] || ""}
                      onChange={val => handleAnswer(currentQ.question.questionId, val)}
                      language="python"
                      height="400px"
                    />
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Bottom navigation */}
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />上一题
              </Button>
              <Button variant="ghost" onClick={() => toggleMark(currentIdx)} className={marked.has(currentIdx) ? "text-amber-600" : ""}>
                <Flag className="h-4 w-4 mr-1" />{marked.has(currentIdx) ? "已标记" : "标记此题"}
              </Button>
              <Button variant="outline" onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} disabled={currentIdx === totalQuestions - 1}>
                下一题<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-center mb-2">确认交卷</h3>
            <div className="text-sm text-slate-500 text-center mb-2">
              已答 <span className="font-medium text-emerald-600">{answeredCount}</span> 题，
              未答 <span className="font-medium text-red-500">{unansweredQuestions.length}</span> 题
            </div>
            {unansweredQuestions.length > 0 && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2 mb-4">
                <p className="font-medium mb-1">以下题目未作答：</p>
                {unansweredQuestions.map((q) => (
                  <button key={q.question.questionId}
                    onClick={() => { setShowConfirm(false); setCurrentIdx(questions.indexOf(q)); }}
                    className="block w-full text-left hover:underline">
                    第{questions.indexOf(q) + 1}题 ({{
                      single_choice: "单选题", multi_choice: "多选题", true_false: "判断题", programming: "编程题"
                    }[q.question.questionType]})
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-center gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>继续检查</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}确认交卷
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Time's up overlay */}
      {timeLeft === 0 && submitting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-red-600/10 backdrop-blur-sm">
          <div className="text-center">
            <Clock className="h-12 w-12 text-red-500 mx-auto mb-2 animate-pulse" />
            <p className="text-lg font-bold text-red-600">考试时间到，正在自动交卷...</p>
          </div>
        </div>
      )}
    </div>
  );
}
