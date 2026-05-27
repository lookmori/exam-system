import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SIDEBAR_MENUS } from "@/lib/constants";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as string;
  if (role === "student") redirect("/student/dashboard");

  const menus = SIDEBAR_MENUS[role] || [];

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar menus={menus} role={role} username={session.user.name || "用户"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
