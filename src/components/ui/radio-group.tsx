"use client";

import { cn } from "@/lib/utils";
import { createContext, useContext, InputHTMLAttributes, forwardRef } from "react";

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function RadioGroup({ name, value, onChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name, value, onChange }}>
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  label?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, value: radioValue, id, ...props }, ref) => {
    const ctx = useContext(RadioGroupContext);
    if (!ctx) throw new Error("Radio must be used within RadioGroup");

    const radioId = id || `${ctx.name}-${radioValue}`;
    const checked = ctx.value === radioValue;

    return (
      <label
        htmlFor={radioId}
        className={cn(
          "inline-flex items-center gap-2.5 cursor-pointer select-none",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="relative">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={ctx.name}
            value={radioValue}
            checked={checked}
            onChange={() => ctx.onChange(radioValue)}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            "h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
            checked
              ? "border-fun-lavender bg-fun-lavender"
              : "border-slate-300"
          )}>
            <div className={cn(
              "h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform duration-200",
              checked ? "scale-100" : "scale-0"
            )} />
          </div>
        </div>
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      </label>
    );
  }
);
Radio.displayName = "Radio";

export { RadioGroup, Radio };
