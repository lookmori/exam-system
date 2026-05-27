"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ToggleSchoolButton({ schoolId, currentStatus }: { schoolId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    await fetch(`/api/schools/${schoolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant={currentStatus === "active" ? "danger" : "primary"}
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
      {currentStatus === "active" ? "禁用学校" : "启用学校"}
    </Button>
  );
}
