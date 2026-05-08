import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-code-border bg-code-bg">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-code-border">
        <span className="text-[11px] font-mono text-text-muted uppercase">{language || "code"}</span>
        <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-bg-hover">
          {copied ? <><Check size={12} className="text-status-success" /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="text-sm font-mono leading-relaxed"><code>{value}</code></pre>
      </div>
    </div>
  );
}
