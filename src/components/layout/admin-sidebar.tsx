"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  BookOpen,
  UserCheck,
  Clipboard,
  TrendingUp,
  Library,
  FileText,
  CheckCircle,
  Award,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ReactNode> = {
  "bar-chart": <LayoutDashboard className="h-5 w-5" />,
  school: <School className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  "book-open": <BookOpen className="h-5 w-5" />,
  "user-check": <UserCheck className="h-5 w-5" />,
  clipboard: <Clipboard className="h-5 w-5" />,
  "trending-up": <TrendingUp className="h-5 w-5" />,
  library: <Library className="h-5 w-5" />,
  "file-text": <FileText className="h-5 w-5" />,
  "check-circle": <CheckCircle className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
};

interface SidebarMenu {
  label: string;
  href: string;
  icon: string;
}

interface AdminSidebarProps {
  menus: SidebarMenu[];
  role: string;
  username: string;
}

export function AdminSidebar({ menus, role, username }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabels: Record<string, string> = {
    super_admin: "超级管理员",
    school_admin: "学校管理员",
    teacher: "教师",
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed left-3 top-3 z-50 rounded-xl border-2 border-white/60 bg-white/90 backdrop-blur-sm p-2 shadow-lg lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-purple-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full flex-col border-r-2 border-slate-100 bg-white/90 backdrop-blur-md transition-all duration-300",
          "lg:sticky lg:top-0 shadow-[4px_0_24px_rgba(151,117,250,0.08)]",
          collapsed ? "w-[68px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-14 items-center border-b-2 border-fun-lavender-light/50 px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fun-coral via-fun-peach to-fun-sunny text-white font-bold text-sm shadow-[0_4px_12px_rgba(255,107,107,0.3)] animate-float">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-800 text-sm">
                奇幻课堂
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fun-coral via-fun-peach to-fun-sunny text-white font-bold text-sm shadow-[0_4px_12px_rgba(255,107,107,0.3)]">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="border-b border-fun-lavender-light/30 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fun-lavender to-fun-pink text-white text-sm font-bold shadow-[0_4px_12px_rgba(151,117,250,0.3)]">
                {username[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {username}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {roleLabels[role] || role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
          {menus.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-fun-lavender-light to-fun-pink-light text-fun-lavender shadow-[0_2px_10px_rgba(151,117,250,0.15)]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className={cn(isActive && "animate-bounce-gentle")}>
                  {iconMap[item.icon] || (
                    <LayoutDashboard className="h-5 w-5" />
                  )}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t-2 border-fun-lavender-light/30 px-4 py-3">
            <p className="text-xs text-slate-400 font-medium">
              ✨ 让学习充满乐趣
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
