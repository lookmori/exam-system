import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDuration } from "@/lib/utils";
import { Clock, Award, User, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const student = await prisma.user.findUnique({
    where: { userId },
    select: { schoolId: true, classId: true },
  });

  if (!student?.schoolId || !student?.classId) {
    return (
      <div>
        <PageHeader title="我的考试" description="参与在线考试，挑战自我" />
        <EmptyState
          title="账号信息不完整"
          description="请先联系管理员完善你的学校和班级信息哦~"
        />
      </div>
    );
  }

  const now = new Date();

  const availablePapers = await prisma.examPaper.findMany({
    where: {
      schoolId: student.schoolId,
      OR: [
        { isPublic: true },
        { classIds: { has: student.classId } },
      ],
      paperStatus: "published",
      startTime: { lte: now },
      endTime: { gte: now },
    },
    include: {
      teacher: { select: { username: true } },
    },
    orderBy: { startTime: "asc" },
  });

  const existingRecords = await prisma.examRecord.findMany({
    where: { studentId: userId, paperId: { in: availablePapers.map((p) => p.paperId) } },
    select: { paperId: true, status: true, recordId: true },
  });
  const recordMap = new Map(existingRecords.map((r) => [r.paperId, r]));

  const pastPapers = await prisma.examPaper.findMany({
    where: {
      schoolId: student.schoolId,
      OR: [
        { isPublic: true },
        { classIds: { has: student.classId } },
      ],
      paperStatus: "published",
      endTime: { lt: now },
    },
    include: { teacher: { select: { username: true } } },
    orderBy: { endTime: "desc" },
    take: 10,
  });

  const pastRecords = await prisma.examRecord.findMany({
    where: { studentId: userId, paperId: { in: pastPapers.map((p) => p.paperId) } },
    select: { paperId: true, status: true, score: true, recordId: true, gradedAt: true },
  });
  const pastRecordMap = new Map(pastRecords.map((r) => [r.paperId, r]));

  return (
    <div>
      <PageHeader
        title="我的考试"
        description="加油！今天的挑战正在等着你 🌟"
      />

      <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-6 rounded-full bg-gradient-to-b from-fun-coral to-fun-peach" />
        进行中的考试
      </h2>

      {availablePapers.length === 0 ? (
        <EmptyState
          title="暂无可用考试"
          description="当前没有进行中的考试，休息一下吧~"
          className="mb-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {availablePapers.map((paper) => {
            const record = recordMap.get(paper.paperId);
            const isSubmitted = record?.status === "submitted" || record?.status === "graded";
            return (
              <Card key={paper.paperId} className="group border-2 border-transparent hover:border-fun-sky/20 hover:shadow-[0_8px_30px_rgba(77,171,247,0.15)] transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2 group-hover:text-fun-sky transition-colors">
                      {paper.paperTitle}
                    </CardTitle>
                    <Badge variant="info" className="shrink-0">进行中</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-fun-lavender" />{paper.teacher?.username}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-fun-coral" />{new Date(paper.startTime).toLocaleString("zh-CN")} — {new Date(paper.endTime).toLocaleString("zh-CN")}</div>
                    <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-fun-peach" />{formatDuration(paper.examDuration)}</div>
                    <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-fun-sunny" />{paper.totalScore} 分{paper.passScore && ` (及格: ${paper.passScore}分)`}</div>
                  </div>
                  <div className="mt-5">
                    {isSubmitted ? (
                      <Link href={`/student/scores/${record.recordId}`}>
                        <Button variant="outline" className="w-full rounded-xl" size="sm">查看成绩</Button>
                      </Link>
                    ) : record ? (
                      <Link href={`/student/exam/${record.recordId}`}>
                        <Button className="w-full rounded-xl" size="sm">继续考试</Button>
                      </Link>
                    ) : (
                      <Link href={`/student/exam/new?paperId=${paper.paperId}`}>
                        <Button className="w-full rounded-xl" size="sm">🚀 进入考试</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-6 rounded-full bg-gradient-to-b from-fun-lavender to-fun-pink" />
        已结束的考试
      </h2>

      {pastPapers.length === 0 ? (
        <EmptyState
          title="暂无已结束考试"
          description="你还没有参加过任何考试，去挑战一下吧！"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastPapers.map((paper) => {
            const record = pastRecordMap.get(paper.paperId);
            return (
              <Card
                key={paper.paperId}
                className={
                  record?.status === "graded"
                    ? "border-2 border-fun-mint/40 bg-gradient-to-br from-emerald-50/50 to-teal-50/30"
                    : "border-2 border-transparent hover:border-fun-lavender/15 hover:shadow-[0_8px_30px_rgba(151,117,250,0.1)] transition-all duration-300"
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{paper.paperTitle}</CardTitle>
                    {record?.status === "graded" && (
                      <Badge variant="success" className="shrink-0">
                        <Sparkles className="h-3 w-3 mr-0.5" /> 已批阅
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-fun-lavender" />{paper.teacher?.username}</div>
                    <div className="flex items-center gap-2"><Award className="h-3.5 w-3.5 text-fun-sunny" />{paper.totalScore} 分</div>
                    {record?.gradedAt && (
                      <p className="text-xs text-emerald-600 font-medium">
                        批阅时间：{new Date(record.gradedAt).toLocaleString("zh-CN")}
                      </p>
                    )}
                  </div>
                  {record ? (
                    <Link href={`/student/scores/${record.recordId}`}>
                      <Button
                        variant={record.status === "graded" ? "success" : "outline"}
                        className="w-full rounded-xl"
                        size="sm"
                      >
                        {record.status === "graded" ? `🎉 查看成绩 (${record.score}分)` : "查看详情"}
                      </Button>
                    </Link>
                  ) : (
                    <Badge variant="default" className="w-full justify-center py-2.5 rounded-lg text-sm">
                      😴 未参加
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
