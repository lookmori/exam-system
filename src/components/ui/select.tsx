"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function Select({
  options,
  placeholder,
  error,
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  className,
  id,
  disabled,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selected = options.find(o => o.value === value);
  const displayText = selected?.label || placeholder || "请选择";

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target) &&
          dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(val: string) {
    if (controlledValue === undefined) setInternalValue(val);
    setOpen(false);
    onChange?.(val);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => { updatePosition(); setOpen(!open); }}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border-2 bg-white/90 px-4 py-2.5 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-fun-lavender/40 focus:border-fun-lavender",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          "transition-all duration-200",
          error
            ? "border-red-300 focus:ring-red-300/40"
            : "border-slate-200 hover:border-slate-300",
          !selected ? "text-slate-400" : "text-slate-800"
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={cn(
          "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ml-2",
          open && "rotate-180"
        )} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-xl border-2 border-slate-100 bg-white py-1.5 shadow-[0_10px_40px_rgba(151,117,250,0.15)] animate-pop-in overflow-y-auto max-h-60"
          style={{ top: pos.top, left: pos.left, minWidth: pos.width || 180 }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-sm font-medium transition-all duration-150",
                opt.value === value
                  ? "bg-fun-lavender-light text-fun-lavender"
                  : "text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => select(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export type { SelectOption };
