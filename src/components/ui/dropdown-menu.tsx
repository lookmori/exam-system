"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[180px] rounded-xl border-2 border-slate-100 bg-white py-1.5 shadow-[0_10px_40px_rgba(151,117,250,0.15)] animate-pop-in",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled,
  danger,
  className,
}: DropdownItemProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 rounded-lg mx-1",
        disabled
          ? "cursor-not-allowed opacity-50"
          : danger
            ? "text-red-500 hover:bg-red-50"
            : "text-slate-600 hover:bg-fun-lavender-light hover:text-fun-lavender",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1.5 mx-2 border-t border-slate-100" />;
}
