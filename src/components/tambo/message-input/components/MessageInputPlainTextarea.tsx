"use client";

import * as React from "react";
import { useTamboThread, useTamboThreadInput, useIsTamboTokenUpdating } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { getImageItems } from "../../text-editor";
import { useMessageInputContext } from "../context";
import { MAX_IMAGES, IS_PASTED_IMAGE } from "../constants";
import type { MessageInputPlainTextareaProps } from "../types";

/**
 * Legacy textarea-based message input component.
 *
 * This mirrors the previous MessageInput.Textarea implementation using a native
 * `<textarea>` element. It remains available as an opt-in escape hatch for
 * consumers that relied on textarea-specific props or refs.
 */
export const MessageInputPlainTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputPlainTextareaProps) => {
  const { value, setValue, handleSubmit, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  const isPending = !isIdle;
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        await handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const { imageItems, hasText } = getImageItems(e.clipboardData);

    if (imageItems.length === 0) {
      return; // Allow default text paste
    }

    if (!hasText) {
      e.preventDefault(); // Only prevent when image-only paste
    }

    const totalImages = images.length + imageItems.length;
    if (totalImages > MAX_IMAGES) {
      setImageError(`Max ${MAX_IMAGES} uploads at a time`);
      return;
    }
    setImageError(null);

    for (const item of imageItems) {
      try {
        // Mark this image as pasted so we can show "Image 1", "Image 2", etc.
        item[IS_PASTED_IMAGE] = true;
        await addImage(item);
      } catch (error) {
        console.error("Failed to add pasted image:", error);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className={cn(
        "flex-1 p-3 rounded-t-lg bg-background text-foreground resize-none text-sm min-h-[82px] max-h-[40vh] focus:outline-none placeholder:text-muted-foreground/50",
        className,
      )}
      disabled={isPending || isUpdatingToken}
      placeholder={placeholder}
      aria-label="Chat Message Input"
      data-slot="message-input-textarea"
      {...props}
    />
  );
};
MessageInputPlainTextarea.displayName = "MessageInput.PlainTextarea";
