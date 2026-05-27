import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-xl border-2 bg-white/90 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-fun-lavender/40 focus:border-fun-lavender",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "transition-all duration-200",
          error
            ? "border-red-300 focus:ring-red-300/40 focus:border-red-400"
            : "border-slate-200 hover:border-slate-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
