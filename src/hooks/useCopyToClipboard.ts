"use client";

import * as React from "react";

interface UseCopyToClipboardOptions {
  resetDelay?: number;
}

type CopyStatus = "idle" | "copied" | "error";

export const useCopyToClipboard = ({ resetDelay = 2000 }: UseCopyToClipboardOptions = {}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<CopyStatus>("idle");
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearPending = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const reset = React.useCallback(() => {
    setCopiedId(null);
    setStatus("idle");
    clearPending();
  }, []);

  const copyToClipboard = React.useCallback(
    async (text: string, id?: string): Promise<boolean> => {
      clearPending();
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id ?? "default");
        setStatus("copied");
        timeoutRef.current = setTimeout(() => {
          setCopiedId(null);
          setStatus("idle");
        }, resetDelay);
        return true;
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        setCopiedId(id ?? "default");
        setStatus("error");
        timeoutRef.current = setTimeout(() => {
          setCopiedId(null);
          setStatus("idle");
        }, resetDelay);
        return false;
      }
    },
    [resetDelay]
  );

  React.useEffect(() => clearPending, []);

  return { copiedId, status, copyToClipboard, reset };
};
