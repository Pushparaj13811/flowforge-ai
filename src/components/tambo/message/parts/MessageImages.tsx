"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getMessageImages } from "@/lib/thread-hooks";
import { useMessageContext } from "../context";

/**
 * Props for the MessageImages component.
 */
export type MessageImagesProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Displays images from message content horizontally.
 */
export const MessageImages = React.forwardRef<HTMLDivElement, MessageImagesProps>(
  ({ className, ...props }, ref) => {
    const { message } = useMessageContext();
    const images = getMessageImages(message.content);

    if (images.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2 mb-2", className)}
        data-slot="message-images"
        {...props}
      >
        {images.map((imageUrl: string, index: number) => (
          <div
            key={index}
            className="w-32 h-32 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <img
              src={imageUrl}
              alt={`Image ${index + 1}`}
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  },
);
MessageImages.displayName = "MessageImages";
