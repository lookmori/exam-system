import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={<Construction className="h-12 w-12 text-amber-400" />}
        title="功能开发中"
        description="该模块正在开发中，敬请期待..."
      />
    </div>
  );
}
