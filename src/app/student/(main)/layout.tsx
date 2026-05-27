import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentNavbar } from "@/components/layout/student-navbar";

export default async function MainStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "student") redirect("/admin/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <StudentNavbar username={session.user.name || "学生"} />
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
