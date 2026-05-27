import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ExamLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "student") redirect("/admin/dashboard");

  return <>{children}</>;
}
