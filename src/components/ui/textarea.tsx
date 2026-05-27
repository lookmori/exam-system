import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border-2 bg-white/90 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-fun-lavender/40 focus:border-fun-lavender",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
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
Textarea.displayName = "Textarea";

export { Textarea };
