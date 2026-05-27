import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary:
    "bg-gradient-to-r from-fun-coral to-fun-peach text-white hover:from-[#ff5252] hover:to-[#ff8c2d] active:scale-[0.97] shadow-[0_4px_14px_rgba(255,107,107,0.35)]",
  secondary:
    "bg-white border-2 border-slate-200 text-slate-700 hover:border-fun-lavender hover:text-fun-lavender active:scale-[0.97] shadow-sm hover:shadow-md",
  danger:
    "bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600 active:scale-[0.97] shadow-[0_4px_14px_rgba(239,68,68,0.35)]",
  warning:
    "bg-gradient-to-r from-amber-400 to-orange-400 text-white hover:from-amber-500 hover:to-orange-500 active:scale-[0.97] shadow-[0_4px_14px_rgba(251,146,60,0.35)]",
  success:
    "bg-gradient-to-r from-fun-mint to-fun-teal text-white hover:from-[#40c057] hover:to-[#2fb380] active:scale-[0.97] shadow-[0_4px_14px_rgba(81,207,102,0.35)]",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200",
  outline:
    "border-2 border-fun-coral text-fun-coral hover:bg-red-50 active:bg-red-100 active:scale-[0.97]",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  default: "h-10 px-5 py-2 text-sm gap-2 rounded-xl",
  lg: "h-12 px-7 text-base gap-2.5 rounded-xl",
  icon: "h-10 w-10 p-0 justify-center rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-fun-coral/40 focus:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
