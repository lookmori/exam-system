"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AssignPaperDialog } from "@/components/teacher/assign-paper-dialog";
import { Download } from "lucide-react";

interface PaperData {
  paperId: string;
  paperTitle: string;
  totalScore: number;
  examDuration: number;
  school: { schoolName: string };
  teacher: { name: string | null };
  _count: { paperQuestions: number };
}

interface School {
  schoolId: string;
  schoolName: string;
}

export function BrowseActions({
  paper,
  schools,
}: {
  paper: PaperData;
  schools: School[];
}) {
  const [showAssign, setShowAssign] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setShowAssign(true)} className="w-full">
        <Download className="h-3.5 w-3.5 mr-1" />
        布置给我的学生
      </Button>
      <AssignPaperDialog
        open={showAssign}
        onClose={() => setShowAssign(false)}
        paper={paper}
        schools={schools}
      />
    </>
  );
}
