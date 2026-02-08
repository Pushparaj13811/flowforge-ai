"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Paperclip, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SmartInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Type a message...",
  className,
}: SmartInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative glass border border-glass-border rounded-2xl shadow-lg overflow-hidden",
        className
      )}
    >
      <div className="flex items-end gap-2 p-3">
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent border-0 outline-none text-sm",
            "placeholder:text-muted-foreground/60",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[36px] max-h-[200px] py-2"
          )}
        />

        {/* Voice button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={isLoading}
        >
          <Mic className="h-4 w-4" />
        </Button>

        {/* Submit button */}
        <Button
          type="button"
          size="icon"
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className={cn(
            "h-9 w-9 shrink-0 rounded-xl transition-all duration-200",
            value.trim()
              ? "bg-gradient-flow text-white shadow-md hover:shadow-lg"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Character count (optional) */}
      {value.length > 500 && (
        <div className="absolute bottom-1 right-14 text-xs text-muted-foreground">
          {value.length}/2000
        </div>
      )}
    </motion.div>
  );
}
