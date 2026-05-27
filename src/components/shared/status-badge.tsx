import { Badge } from "@/components/ui/badge";

const statusVariantMap: Record<string, "success" | "warning" | "danger" | "default" | "info" | "coral" | "teal" | "pink"> = {
  draft: "default",
  published: "success",
  ended: "default",
  removed: "danger",
  active: "success",
  disabled: "danger",
  in_progress: "info",
  submitted: "warning",
  graded: "success",
};

const statusLabelMap: Record<string, string> = {
  draft: "草稿",
  published: "已发布",
  ended: "已结束",
  removed: "已下架",
  active: "正常",
  disabled: "已禁用",
  in_progress: "进行中",
  submitted: "待阅卷",
  graded: "已批阅",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = statusVariantMap[status] || "default";
  const displayLabel = label || statusLabelMap[status] || status;

  return <Badge variant={variant as "success" | "warning" | "danger" | "default" | "info"}>{displayLabel}</Badge>;
}
