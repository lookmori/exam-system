import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateTeacherForm } from "./form";

export default async function CreateTeacherPage() {
  const session = await auth();
  if (session?.user?.role !== "school_admin") redirect("/admin/dashboard");

  const admin = await prisma.user.findUnique({ where: { userId: session.user.id } });
  const schoolId = admin?.adminSchoolId;
  if (!schoolId) redirect("/admin/dashboard");

  const school = await prisma.school.findUnique({ where: { schoolId }, select: { schoolName: true } });

  return <CreateTeacherForm schoolId={schoolId} schoolName={school.schoolName} />;
}
