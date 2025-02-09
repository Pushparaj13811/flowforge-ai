"use client";

import * as React from "react";
import { useTamboThreadInput } from "@tambo-ai/react";
import { cn } from "@/lib/utils";
import { IS_PASTED_IMAGE } from "../../constants";
import type { MessageInputStagedImagesProps } from "../../types";
import { ImageContextBadge } from "./ImageContextBadge";

/**
 * Component that displays currently staged images with preview and remove functionality.
 * @component MessageInput.StagedImages
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.StagedImages />
 *   <MessageInput.Textarea />
 * </MessageInput>
 * ```
 */
export const MessageInputStagedImages = React.forwardRef<
  HTMLDivElement,
  MessageInputStagedImagesProps
>(({ className, ...props }, ref) => {
  const { images, removeImage } = useTamboThreadInput();
  const [expandedImageId, setExpandedImageId] = React.useState<string | null>(
    null,
  );

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pb-2 pt-1 border-b border-border",
        className,
      )}
      data-slot="message-input-staged-images"
      {...props}
    >
      {images.map((image, index) => (
        <ImageContextBadge
          key={image.id}
          image={image}
          displayName={
            image.file?.[IS_PASTED_IMAGE] ? `Image ${index + 1}` : image.name
          }
          isExpanded={expandedImageId === image.id}
          onToggle={() =>
            setExpandedImageId(expandedImageId === image.id ? null : image.id)
          }
          onRemove={() => removeImage(image.id)}
        />
      ))}
    </div>
  );
});
MessageInputStagedImages.displayName = "MessageInput.StagedImages";

/**
 * Convenience wrapper that renders staged images as context badges.
 * Keeps API parity with the web app's MessageInputContexts component.
 */
export const MessageInputContexts = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <MessageInputStagedImages
    ref={ref}
    className={cn("pb-2 pt-1 border-b border-border", className)}
    {...props}
  />
));
MessageInputContexts.displayName = "MessageInputContexts";
