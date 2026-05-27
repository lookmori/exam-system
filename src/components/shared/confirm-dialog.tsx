"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
  icon?: "warning" | "info" | "success";
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: ConfirmOptions) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((v: boolean) => void) | null>(null);
  const [mode, setMode] = useState<"confirm" | "alert">("confirm");

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setMode("confirm");
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const alertFn = useCallback((opts: ConfirmOptions): Promise<void> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setMode("alert");
      setResolveRef(() => (v: boolean) => resolve());
      setOpen(true);
    });
  }, []);

  function handleClose(result: boolean) {
    setOpen(false);
    resolveRef?.(result);
    setResolveRef(null);
  }

  const iconMap = {
    warning: <AlertTriangle className="h-8 w-8 text-amber-400" />,
    info: <Info className="h-8 w-8 text-blue-400" />,
    success: <CheckCircle className="h-8 w-8 text-emerald-400" />,
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert: alertFn }}>
      {children}
      <Dialog open={open} onClose={() => handleClose(false)}>
        <DialogHeader>
          <div className="flex flex-col items-center gap-2">
            {options?.icon ? iconMap[options.icon] : mode === "confirm" ? iconMap["warning"] : null}
            <DialogTitle className="text-center">{options?.title || (mode === "confirm" ? "确认操作" : "提示")}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogContent>
          <DialogDescription className="text-center">{options?.message}</DialogDescription>
        </DialogContent>
        <DialogFooter>
          {mode === "confirm" ? (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                {options?.cancelText || "取消"}
              </Button>
              <Button variant={options?.variant || "danger"} onClick={() => handleClose(true)}>
                {options?.confirmText || "确认"}
              </Button>
            </>
          ) : (
            <Button variant={options?.variant || "primary"} onClick={() => handleClose(true)} className="w-full">
              {options?.confirmText || "知道了"}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
