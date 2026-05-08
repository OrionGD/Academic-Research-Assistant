import { useCallback } from "react";
import { User, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import MarkdownRenderer from "./MarkdownRenderer";
import type { ChatMessage } from "../../types/api";

interface Props {
  message: ChatMessage;
  isLast?: boolean;
}

export default function MessageBubble({ message, isLast }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex px-4 py-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${isUser ? "bg-accent border-accent-dark" : "bg-bg-elevated border-border-light"}`}>
          {isUser ? <User size={14} className="text-white" /> : <Sparkles size={14} className="text-accent-light" />}
        </div>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? "bg-accent text-white rounded-tr-sm" : "bg-bg-elevated border border-border-light text-text-primary rounded-tl-sm"}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-light/50">
              <p className="text-[10px] font-medium text-text-muted mb-1.5">Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {message.citations.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md text-[10px] text-accent-light">
                    <Sparkles size={8} /> {c.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
