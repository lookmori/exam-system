import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const variants = {
  default: "bg-slate-100 text-slate-600",
  primary: "bg-fun-sky-light text-fun-sky border border-fun-sky/20",
  success: "bg-fun-mint-light text-emerald-700 border border-fun-mint/20",
  warning: "bg-fun-sunny-light text-amber-700 border border-fun-sunny/20",
  danger: "bg-fun-coral-light text-red-600 border border-fun-coral/20",
  info: "bg-fun-lavender-light text-fun-lavender border border-fun-lavender/20",
  coral: "bg-fun-coral-light text-fun-coral border border-fun-coral/20",
  peach: "bg-fun-peach-light text-fun-peach border border-fun-peach/20",
  pink: "bg-fun-pink-light text-fun-pink border border-fun-pink/20",
  teal: "bg-fun-teal-light text-teal-600 border border-fun-teal/20",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
