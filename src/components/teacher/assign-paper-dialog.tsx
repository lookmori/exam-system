"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface School {
  schoolId: string;
  schoolName: string;
}

interface ClassItem {
  classId: string;
  className: string;
}

interface PaperSummary {
  paperId: string;
  paperTitle: string;
  totalScore: number;
  examDuration: number;
  school: { schoolName: string };
  teacher: { name: string | null };
  _count: { paperQuestions: number };
}

export function AssignPaperDialog({
  open,
  onClose,
  paper,
  schools,
}: {
  open: boolean;
  onClose: () => void;
  paper: PaperSummary | null;
  schools: School[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [schoolId, setSchoolId] = useState(schools[0]?.schoolId || "");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [examDuration, setExamDuration] = useState(paper?.examDuration || 60);
  const [isPublic, setIsPublic] = useState(false);
  const [isRetry, setIsRetry] = useState(false);
  const [passScore, setPassScore] = useState(paper?.totalScore ? Math.round(paper.totalScore * 0.6) : 60);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && paper) {
      setSchoolId(schools[0]?.schoolId || "");
      setClassIds([]);
      setStartTime("");
      setEndTime("");
      setExamDuration(paper.examDuration);
      setIsPublic(false);
      setIsRetry(false);
      setPassScore(paper.totalScore ? Math.round(paper.totalScore * 0.6) : 60);
    }
  }, [open, paper, schools]);

  // Load classes when school changes
  useEffect(() => {
    if (!schoolId) return;
    setLoadingClasses(true);
    setClassIds([]);
    fetch(`/api/classes?schoolId=${schoolId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.classes) setClasses(data.classes);
      })
      .catch(() => toast.error("加载班级失败"))
      .finally(() => setLoadingClasses(false));
  }, [schoolId]);

  // Auto-set endTime based on startTime + duration
  useEffect(() => {
    if (startTime && examDuration) {
      const start = new Date(startTime);
      start.setMinutes(start.getMinutes() + Number(examDuration));
      const y = start.getFullYear();
      const mo = String(start.getMonth() + 1).padStart(2, "0");
      const d = String(start.getDate()).padStart(2, "0");
      const h = String(start.getHours()).padStart(2, "0");
      const mi = String(start.getMinutes()).padStart(2, "0");
      setEndTime(`${y}-${mo}-${d}T${h}:${mi}`);
    }
  }, [startTime, examDuration]);

  function toggleClass(classId: string) {
    setClassIds((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    );
  }

  async function handleSubmit() {
    if (!paper) return;
    if (!schoolId || classIds.length === 0 || !startTime || !examDuration) {
      toast.error("请填写所有必填项");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/papers/${paper.paperId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          startTime,
          endTime,
          examDuration: Number(examDuration),
          classIds,
          isPublic,
          isRetry,
          passScore: passScore || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "布置失败");
      }

      const data = await res.json();
      toast.success("布置成功！试卷已保存为草稿，可前往试卷管理发布");
      onClose();
      router.push(`/admin/teacher/papers/${data.paper.paperId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "布置失败");
    } finally {
      setLoading(false);
    }
  }

  const schoolOptions = schools.map((s) => ({ value: s.schoolId, label: s.schoolName }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>布置公开试卷</DialogTitle>
        <DialogDescription>
          {paper ? `"${paper.paperTitle}" — ${paper.school.schoolName} · ${paper.teacher.name}` : ""}
        </DialogDescription>
      </DialogHeader>

      <DialogContent>
        <div className="space-y-4">
          {/* School */}
          <div>
            <Label htmlFor="assign-school">目标学校</Label>
            <Select
              id="assign-school"
              options={schoolOptions}
              value={schoolId}
              onChange={setSchoolId}
            />
          </div>

          {/* Classes */}
          <div>
            <Label>目标班级 <span className="text-red-400">*</span></Label>
            {loadingClasses ? (
              <p className="text-sm text-slate-400 mt-1">加载中...</p>
            ) : classes.length === 0 ? (
              <p className="text-sm text-slate-400 mt-1">该学校暂无班级</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {classes.map((c) => (
                  <button
                    key={c.classId}
                    type="button"
                    onClick={() => toggleClass(c.classId)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                      classIds.includes(c.classId)
                        ? "bg-purple-100 text-purple-700 border-purple-300"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {c.className}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Start Time */}
          <div>
            <Label htmlFor="assign-start">考试开始时间 <span className="text-red-400">*</span></Label>
            <Input
              id="assign-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="assign-duration">考试时长（分钟） <span className="text-red-400">*</span></Label>
            <Input
              id="assign-duration"
              type="number"
              min={1}
              value={examDuration}
              onChange={(e) => setExamDuration(Number(e.target.value))}
            />
          </div>

          {/* End Time (auto-calculated) */}
          <div>
            <Label htmlFor="assign-end">考试结束时间（自动计算）</Label>
            <Input
              id="assign-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Pass Score */}
          <div>
            <Label htmlFor="assign-pass">及格分</Label>
            <Input
              id="assign-pass"
              type="number"
              min={0}
              value={passScore}
              onChange={(e) => setPassScore(Number(e.target.value))}
            />
          </div>

          {/* isPublic & isRetry */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
              />
              <span className="text-sm text-slate-600">本校公开</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRetry}
                onChange={(e) => setIsRetry(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-400"
              />
              <span className="text-sm text-slate-600">允许重考</span>
            </label>
          </div>
        </div>
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          确认布置
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
