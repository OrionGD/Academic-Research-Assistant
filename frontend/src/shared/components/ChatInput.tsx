import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onAttach,
  disabled = false,
  placeholder = 'Ask anything...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    if (file && onAttach) {
      onAttach(file);
      setFile(null);
    }

    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, file, disabled, onSend, onAttach]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
      <div
        className={cn(
          'relative flex items-end gap-2 bg-bg-elevated border border-border-light rounded-2xl px-4 py-3',
          'focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/10 transition-all'
        )}
      >
        {/* Attach Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="bb-btn-icon mb-0.5 shrink-0"
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-text-primary text-[15px] placeholder:text-text-dim resize-none outline-none min-h-[24px] max-h-[200px] py-0.5',
            disabled && 'opacity-50'
          )}
        />

        {/* File Chip */}
        {file && (
          <div className="absolute left-12 -top-8 bg-bg-surface border border-border-light rounded-lg px-2.5 py-1 text-xs text-text-secondary flex items-center gap-1.5 shadow-lg">
            <Paperclip size={10} />
            <span className="truncate max-w-[120px]">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="text-text-muted hover:text-text-primary ml-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'shrink-0 p-2 rounded-xl transition-all duration-200 mb-0.5',
            value.trim() && !disabled
              ? 'bg-accent text-white hover:bg-accent-light shadow-lg shadow-accent-glow'
              : 'text-text-dim cursor-default'
          )}
        >
          {disabled ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      <p className="text-center text-[10px] text-text-dim mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
