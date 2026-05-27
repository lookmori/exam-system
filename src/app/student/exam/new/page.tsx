"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewExamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const paperId = searchParams.get("paperId");
    if (!paperId) {
      router.push("/student/dashboard");
      return;
    }

    fetch("/api/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.recordId) {
          router.replace(`/student/exam/${data.recordId}`);
        } else {
          toast.error(data.error || "无法开始考试");
          router.push("/student/dashboard");
        }
      })
      .catch(() => router.push("/student/dashboard"));
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm text-slate-500">正在初始化考试...</p>
      </div>
    </div>
  );
}
