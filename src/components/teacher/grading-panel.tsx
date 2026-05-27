"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TitleImages, AnalysisImages } from "@/components/shared/question-images";
import { CodeEditor } from "@/components/shared/code-editor";
import { ImageUpload } from "@/components/shared/image-upload";
import { Loader2 } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-dialog";

interface QuestionInfo {
  question: {
    questionId: string;
    title: string;
    titleImgs: string[];
    questionType: string;
    optionContent: Record<string, string> | null;
    optionImgs: Record<string, string[]> | null;
    score: number;
    answer: string;
    analysis: string | null;
    analysisImgs: string[];
  };
  sort: number;
  score: number;
}


interface GradingPanelProps {
  recordId: string;
  totalScore: number;
  currentScore: number | null;
  objectiveScore: number;
  status: string;
  existingComments: Record<string, string>;
  existingCommentImgs: Record<string, string[]>;
  questions: QuestionInfo[];
  answers: Record<string, string>;
}

export function GradingPanel({ recordId, totalScore, currentScore, objectiveScore, status, existingComments, existingCommentImgs, questions, answers }: GradingPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { alert: alertDialog } = useConfirm();

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    questions.forEach(pq => {
      init[pq.question.questionId] = Math.max(0, (currentScore ?? 0) - objectiveScore);
    });
    return init;
  });

  const [comments, setComments] = useState<Record<string, string>>(existingComments || {});
  const [commentImgs, setCommentImgs] = useState<Record<string, string[]>>(existingCommentImgs || {});

  function calcTotal(): number {
    let programmingTotal = 0;
    questions.forEach(pq => {
      programmingTotal += scores[pq.question.questionId] || 0;
    });
    return objectiveScore + programmingTotal;
  }

  async function handleSubmit() {
    setSaving(true);
    const progScores: Record<string, number> = {};
    questions.forEach(pq => {
      progScores[pq.question.questionId] = scores[pq.question.questionId] || 0;
    });

    const res = await fetch(`/api/grading/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores: progScores, comments, commentImgs }),
    });
    setSaving(false);

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      await alertDialog({ message: data.error || "提交失败", icon: "warning" });
    }
  }

  return (
    <div>
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-700">
          编程题阅卷 ({questions.length} 题) · 客观题自动得分：{objectiveScore} 分
        </h3>
        {questions.map((pq, i) => {
          const studentAnswer = answers[pq.question.questionId] || "";
          const correctAnswer = pq.question.answer;

          return (
            <Card key={pq.question.questionId}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-500">第 {i + 1} 题</span>
                      <Badge variant="default">编程题</Badge>
                      <span className="text-xs text-slate-400">{pq.score} 分</span>
                    </div>
                    <div className="text-sm text-slate-800 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: pq.question.title }} />
                    <TitleImages images={pq.question.titleImgs} />
                  </div>
                </div>

                {/* Student code */}
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-1">学生代码</p>
                  <CodeEditor value={studentAnswer || "# 未作答"} readOnly language="python" height="200px" />
                </div>

                {/* Reference code + scoring + comment */}
                <div className="space-y-3 mb-3">
                  <div>
                    <p className="text-xs text-blue-500 mb-1">参考代码</p>
                    <CodeEditor value={correctAnswer || ""} readOnly language="python" height="150px" />
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-slate-600">得分</Label>
                      <Input type="number" value={scores[pq.question.questionId] ?? 0}
                        onChange={e => setScores(s => ({ ...s, [pq.question.questionId]: Number(e.target.value) || 0 }))}
                        min={0} max={pq.score} className="w-20 text-center" />
                      <span className="text-sm text-slate-400">/ {pq.score}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 mb-1 block">评语 (可选)</Label>
                    <textarea
                      value={comments[pq.question.questionId] || ""}
                      onChange={e => setComments(c => ({ ...c, [pq.question.questionId]: e.target.value }))}
                      placeholder="对代码的评语，学生可见..."
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                    />
                    <div className="mt-2">
                      <Label className="text-xs text-slate-400 mb-1 block">评语配图 (可选)</Label>
                      <ImageUpload
                        images={commentImgs[pq.question.questionId] || []}
                        onChange={urls => setCommentImgs(c => ({ ...c, [pq.question.questionId]: urls }))}
                        max={3}
                      />
                    </div>
                  </div>
                </div>

                {pq.question.analysis && (
                  <div className="p-2.5 bg-amber-50 rounded-md text-xs text-amber-800">
                    <span className="font-medium">解析：</span>
                    <span dangerouslySetInnerHTML={{ __html: pq.question.analysis }} />
                    <AnalysisImages images={pq.question.analysisImgs} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4 sticky bottom-4 shadow-lg">
        <div>
          <p className="text-sm text-slate-600">
            当前状态：<span className="font-medium">{status === "graded" ? "已阅卷" : "待阅卷"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            客观题：<span className="font-bold text-slate-700">{objectiveScore}</span> + 编程题：<span className="font-bold text-slate-700">{
              questions.reduce((s, pq) => s + (scores[pq.question.questionId] || 0), 0)
            }</span> = 总分：<span className="font-bold text-slate-700">{calcTotal()}</span> / {totalScore}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {status === "graded" ? "重新评分" : "提交评分"}
          </Button>
        </div>
      </div>
    </div>
  );
}
