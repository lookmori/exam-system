"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  language?: string;
  height?: string;
}

export function CodeEditor({
  value = "",
  onChange,
  readOnly = false,
  language = "python",
  height = "400px",
}: CodeEditorProps) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange?.(val ?? "")}
        theme="vs"
        loading={
          <div className="flex items-center justify-center h-full bg-slate-50">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-slate-400">编辑器加载中...</span>
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          fontSize: 14,
          tabSize: 4,
          automaticLayout: true,
          wordWrap: "on",
          renderLineHighlight: readOnly ? "none" : "line",
          contextmenu: !readOnly,
          quickSuggestions: !readOnly ? { other: true, comments: true, strings: true } : false,
          suggestOnTriggerCharacters: !readOnly,
          parameterHints: { enabled: !readOnly },
          hover: { enabled: !readOnly },
        }}
      />
    </div>
  );
}
