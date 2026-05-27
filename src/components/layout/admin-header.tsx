"use client";

import { LogOut, Bell, Sun } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

const roleGradients: Record<string, string> = {
  super_admin: "from-fun-coral to-fun-peach",
  school_admin: "from-fun-sky to-fun-teal",
  teacher: "from-fun-lavender to-fun-pink",
};

const roleColors: Record<string, string> = {
  super_admin: "text-fun-coral",
  school_admin: "text-fun-sky",
  teacher: "text-fun-lavender",
};

export function AdminHeader() {
  const { data: session } = useSession();
  const role = (session?.user?.role as string) || "";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-fun-lavender-light/30 bg-white/90 backdrop-blur-md px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="text-sm font-semibold text-fun-lavender hover:text-fun-pink transition-colors lg:hidden"
        >
          首页
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu
          trigger={
            <button className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm text-slate-600 hover:bg-fun-lavender-light/30 transition-all duration-200">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white text-xs font-bold shadow-[0_3px_10px_rgba(151,117,250,0.2)]",
                roleGradients[role] || "from-fun-lavender to-fun-pink"
              )}>
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="hidden sm:inline font-semibold">
                {session?.user?.name || "用户"}
              </span>
            </button>
          }
        >
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-slate-800">
              {session?.user?.name}
            </p>
            <p className={cn("text-xs font-medium mt-0.5", roleColors[role])}>
              {session?.user?.role
                ? {
                    super_admin: "超级管理员",
                    school_admin: "学校管理员",
                    teacher: "教师",
                  }[session.user.role]
                : ""}
            </p>
          </div>
          <DropdownSeparator />
          <DropdownItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            danger
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </DropdownItem>
        </DropdownMenu>
      </div>
    </header>
  );
}

function cn(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}
