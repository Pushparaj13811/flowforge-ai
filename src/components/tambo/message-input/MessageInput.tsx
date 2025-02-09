"use client";

import * as React from "react";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import {
  useTamboElicitationContext,
  type TamboElicitationResponse,
} from "@tambo-ai/react/mcp";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/tambo/suggestions-tooltip";
import { ElicitationUI } from "@/components/tambo/elicitation-ui";
import type { TamboEditor } from "../text-editor";
import { MessageInputContext } from "./context";
import { messageInputVariants, MAX_IMAGES } from "./constants";
import { storeValueInSessionStorage, getValueFromSessionStorage } from "./hooks";
import { MessageInputStagedImages } from "./components/images/StagedImages";
import type { MessageInputProps, MessageInputContextValue } from "./types";

/**
 * Internal MessageInput component that uses the TamboThreadInput context
 */
const MessageInputInternal = React.forwardRef<
  HTMLFormElement,
  MessageInputProps
>(({ children, className, variant, inputRef, ...props }, ref) => {
  const {
    value,
    setValue,
    submit,
    isPending,
    error,
    images,
    addImages,
    removeImage,
  } = useTamboThreadInput();
  const { cancel, thread } = useTamboThread();
  const [displayValue, setDisplayValue] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const editorRef = React.useRef<TamboEditor>(null!);
  const dragCounter = React.useRef(0);

  // Use elicitation context (optional)
  const { elicitation, resolveElicitation } = useTamboElicitationContext();

  React.useEffect(() => {
    // On mount, load any stored draft value, but only if current value is empty
    const storedValue = getValueFromSessionStorage(thread.id);
    if (!storedValue) return;
    setValue((value) => value ?? storedValue);
  }, [setValue, thread.id]);

  React.useEffect(() => {
    setDisplayValue(value);
    storeValueInSessionStorage(thread.id, value);
    if (value && editorRef.current) {
      editorRef.current.focus();
    }
  }, [value, thread.id]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if ((!value.trim() && images.length === 0) || isSubmitting) return;

      // Clear any previous errors
      setSubmitError(null);
      setImageError(null);
      setDisplayValue("");
      storeValueInSessionStorage(thread.id);
      setIsSubmitting(true);

      // Extract resource names directly from editor at submit time to ensure we have the latest
      let latestResourceNames: Record<string, string> = {};
      const editor = editorRef.current;
      if (editor) {
        const extracted = editor.getTextWithResourceURIs();
        latestResourceNames = extracted.resourceNames;
      }

      const imageIdsAtSubmitTime = images.map((image) => image.id);

      try {
        await submit({
          streamResponse: true,
          resourceNames: latestResourceNames,
        });
        setValue("");
        // Clear only the images that were staged when submission started so
        // any images added while the request was in-flight are preserved.
        if (imageIdsAtSubmitTime.length > 0) {
          imageIdsAtSubmitTime.forEach((id) => removeImage(id));
        }
        // Refocus the editor after a successful submission
        setTimeout(() => {
          editorRef.current?.focus();
        }, 0);
      } catch (error) {
        console.error("Failed to submit message:", error);
        setDisplayValue(value);
        // On submit failure, also clear image error
        setImageError(null);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to send message. Please try again.",
        );

        // Cancel the thread to reset loading state
        await cancel();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      value,
      submit,
      setValue,
      setDisplayValue,
      setSubmitError,
      cancel,
      isSubmitting,
      images,
      removeImage,
      editorRef,
      thread.id,
    ],
  );

  const handleDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasImages = Array.from(e.dataTransfer.items).some((item) =>
        item.type.startsWith("image/"),
      );
      if (hasImages) {
        setIsDragging(true);
      }
    }
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        const totalImages = images.length + files.length;
        if (totalImages > MAX_IMAGES) {
          setImageError(`Max ${MAX_IMAGES} uploads at a time`);
          return;
        }
        setImageError(null); // Clear previous error
        try {
          await addImages(files);
        } catch (error) {
          console.error("Failed to add dropped images:", error);
          setImageError(
            error instanceof Error
              ? error.message
              : "Failed to add images. Please try again.",
          );
        }
      }
    },
    [addImages, images, setImageError],
  );

  const handleElicitationResponse = React.useCallback(
    (response: TamboElicitationResponse) => {
      // Calling resolveElicitation automatically clears the elicitation state
      if (resolveElicitation) {
        resolveElicitation(response);
      }
    },
    [resolveElicitation],
  );

  const contextValue = React.useMemo(
    () => ({
      value: displayValue,
      setValue: (newValue: string) => {
        setValue(newValue);
        setDisplayValue(newValue);
      },
      submit,
      handleSubmit,
      isPending: isPending ?? isSubmitting,
      error,
      editorRef: inputRef ?? editorRef,
      submitError,
      setSubmitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    }),
    [
      displayValue,
      setValue,
      submit,
      handleSubmit,
      isPending,
      isSubmitting,
      error,
      inputRef,
      editorRef,
      submitError,
      imageError,
      setImageError,
      elicitation,
      resolveElicitation,
    ],
  );
  return (
    <MessageInputContext.Provider
      value={contextValue as MessageInputContextValue}
    >
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        data-slot="message-input-form"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        {...props}
      >
        <div
          className={cn(
            "relative flex flex-col rounded-xl bg-background shadow-md p-2 px-3",
            isDragging
              ? "border border-dashed border-emerald-400"
              : "border border-border",
          )}
        >
          {isDragging && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 flex items-center justify-center pointer-events-none z-20">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                Drop files here to add to conversation
              </p>
            </div>
          )}
          {elicitation ? (
            <ElicitationUI
              request={elicitation}
              onResponse={handleElicitationResponse}
            />
          ) : (
            <>
              <MessageInputStagedImages />
              {children}
            </>
          )}
        </div>
      </form>
    </MessageInputContext.Provider>
  );
});
MessageInputInternal.displayName = "MessageInputInternal";

/**
 * The root container for a message input component.
 * It establishes the context for its children and handles the form submission.
 * @component MessageInput
 * @example
 * ```tsx
 * <MessageInput variant="solid">
 *   <MessageInput.Textarea />
 *   <MessageInput.SubmitButton />
 *   <MessageInput.Error />
 * </MessageInput>
 * ```
 */
export const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <MessageInputInternal
        ref={ref}
        className={className}
        variant={variant}
        {...props}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </MessageInputInternal>
    );
  },
);
MessageInput.displayName = "MessageInput";
