"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface Violation {
  type: string;
  timestamp: number;
}

export interface ViolationStats {
  tabSwitches: number;
  fullscreenExits: number;
  clipboardAttempts: number;
  contextMenus: number;
  keyboardShortcuts: number;
  total: number;
  latestType: string | null;
}

const BLOCKED_KEYS = new Set(["c", "v", "x", "p", "f", "u", "s", "a", "h", "j", "g"]);
const BLOCKED_F_KEYS = new Set(["F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"]);

export function useAntiCheat(recordId: string, enabled: boolean) {
  const violationsRef = useRef<Violation[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fullscreenRef = useRef(false);
  const [stats, setStats] = useState<ViolationStats>({
    tabSwitches: 0, fullscreenExits: 0, clipboardAttempts: 0,
    contextMenus: 0, keyboardShortcuts: 0, total: 0, latestType: null,
  });

  function updateStats(type: string) {
    setStats(s => {
      const next = { ...s, total: s.total + 1, latestType: type };
      if (type === "tab_hidden") next.tabSwitches = s.tabSwitches + 1;
      else if (type === "fullscreen_exit") next.fullscreenExits = s.fullscreenExits + 1;
      else if (type.endsWith("_attempt")) next.clipboardAttempts = s.clipboardAttempts + 1;
      else if (type === "context_menu") next.contextMenus = s.contextMenus + 1;
      else if (type.startsWith("keyboard_shortcut")) next.keyboardShortcuts = s.keyboardShortcuts + 1;
      return next;
    });
  }

  const flushViolations = useCallback(async () => {
    const v = violationsRef.current;
    if (v.length === 0) return;
    try {
      await fetch(`/api/exam/${recordId}/violations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violations: v }),
      });
      violationsRef.current = [];
    } catch {}
  }, [recordId]);

  const recordViolation = useCallback((type: string) => {
    violationsRef.current.push({ type, timestamp: Date.now() });
    updateStats(type);
    if (violationsRef.current.length >= 5) {
      flushViolations();
    } else {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(flushViolations, 3000);
    }
  }, [flushViolations]);

  useEffect(() => {
    if (!enabled) return;

    // --- Fullscreen ---
    function requestFullscreen() {
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        }
      } catch {}
    }

    function handleFullscreenChange() {
      fullscreenRef.current = !!document.fullscreenElement;
      if (!document.fullscreenElement) {
        recordViolation("fullscreen_exit");
      }
    }

    requestFullscreen();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // Re-request fullscreen on click (user gesture required in some browsers)
    const clickFullscreen = () => {
      if (!document.fullscreenElement) requestFullscreen();
    };
    document.addEventListener("click", clickFullscreen);

    // --- Visibility change (tab switch / minimize) ---
    function handleVisibilityChange() {
      if (document.hidden) {
        recordViolation("tab_hidden");
      } else {
        recordViolation("tab_visible");
        if (!document.fullscreenElement) requestFullscreen();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // --- Copy/Paste/Cut blocking ---
    function blockClipboard(e: ClipboardEvent) {
      e.preventDefault();
      recordViolation(`${e.type}_attempt`);
    }
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("paste", blockClipboard);
    document.addEventListener("cut", blockClipboard);

    // --- Right-click blocking ---
    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
      recordViolation("context_menu");
    }
    document.addEventListener("contextmenu", blockContextMenu);

    // --- Keyboard shortcut blocking ---
    function blockKeys(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      const alt = e.altKey;

      // Block Ctrl+key combinations (copy, paste, find, save, etc.)
      if (ctrl && BLOCKED_KEYS.has(e.key.toLowerCase())) {
        e.preventDefault();
        recordViolation(`keyboard_shortcut_ctrl_${e.key.toLowerCase()}`);
        return;
      }

      // Block Alt+Tab style shortcuts
      if (alt && e.key === "Tab") {
        e.preventDefault();
        recordViolation("keyboard_shortcut_alt_tab");
        return;
      }

      // Block F-keys (dev tools)
      if (BLOCKED_F_KEYS.has(e.key)) {
        e.preventDefault();
        recordViolation(`keyboard_shortcut_${e.key.toLowerCase()}`);
        return;
      }

      // Block Print Screen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        recordViolation("keyboard_shortcut_print_screen");
        return;
      }
    }
    document.addEventListener("keydown", blockKeys);

    // --- Navigation warning ---
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      recordViolation("navigation_attempt");
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("click", clickFullscreen);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      flushViolations();
    };
  }, [enabled, recordViolation, flushViolations]);

  return { flushViolations, stats };
}
