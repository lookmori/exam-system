"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id || (label ? `cb-${label}` : undefined);
    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "inline-flex items-center gap-2.5 cursor-pointer select-none",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <div className="h-5 w-5 rounded-lg border-2 border-slate-300 bg-white peer-checked:bg-gradient-to-br peer-checked:from-fun-lavender peer-checked:to-fun-sky peer-checked:border-transparent transition-all duration-200 flex items-center justify-center shadow-sm">
            <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
