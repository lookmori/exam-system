"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled, className, label }, ref) => {
    return (
      <label className={cn("inline-flex items-center gap-2.5 cursor-pointer", disabled && "cursor-not-allowed opacity-50", className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-10 shrink-0 rounded-full border-2 border-transparent transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-fun-lavender/30 focus:ring-offset-1",
            checked
              ? "bg-gradient-to-r from-fun-lavender to-fun-sky"
              : "bg-slate-300"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200",
              checked ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
