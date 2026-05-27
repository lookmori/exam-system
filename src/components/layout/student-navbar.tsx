"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Award,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "我的考试", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "我的成绩", href: "/student/scores", icon: Award },
  { label: "个人中心", href: "/student/profile", icon: User },
];

export function StudentNavbar({ username }: { username: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-fun-lavender-light/30 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/student/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fun-coral via-fun-peach to-fun-sunny text-white shadow-[0_4px_12px_rgba(255,107,107,0.3)] animate-float">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-800 text-base hidden sm:inline">
              奇幻课堂
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-fun-lavender-light to-fun-pink-light text-fun-lavender shadow-[0_2px_10px_rgba(151,117,250,0.15)]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fun-sky to-fun-mint text-white text-xs font-bold shadow-[0_3px_10px_rgba(77,171,247,0.2)]">
              {username[0]?.toUpperCase() || "U"}
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {username}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">退出</span>
          </Button>

          {/* Mobile menu button */}
          <button
            className="rounded-xl p-1.5 text-slate-500 hover:bg-fun-lavender-light/30 transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t-2 border-fun-lavender-light/30 bg-white/95 backdrop-blur-md px-4 py-3 md:hidden space-y-1 animate-slide-up">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-fun-lavender-light to-fun-pink-light text-fun-lavender"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
