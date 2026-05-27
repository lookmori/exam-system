import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLE_HOME } from "@/lib/constants";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as keyof typeof ROLE_HOME;
  redirect(ROLE_HOME[role]);
}
