"use client";

import * as React from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageContextBadgeProps } from "../../types";

/**
 * ContextBadge component that displays a staged image with expandable preview.
 * Shows a compact badge with icon and name by default, expands to show image preview on click.
 *
 * @component
 * @example
 * ```tsx
 * <ImageContextBadge
 *   image={stagedImage}
 *   displayName="Image"
 *   isExpanded={false}
 *   onToggle={() => setExpanded(!expanded)}
 *   onRemove={() => removeImage(image.id)}
 * />
 * ```
 */
export const ImageContextBadge: React.FC<ImageContextBadgeProps> = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group flex-shrink-0">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        "relative flex items-center rounded-lg border overflow-hidden",
        "border-border bg-background hover:bg-muted cursor-pointer",
        "transition-[width,height,padding] duration-200 ease-in-out",
        isExpanded ? "w-40 h-28 p-0" : "w-32 h-9 pl-3 pr-8 gap-2",
      )}
    >
      {isExpanded && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150",
            "opacity-100 delay-100",
          )}
        >
          <div className="relative w-full h-full">
            <img
              src={image.dataUrl}
              alt={displayName}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-1 left-2 right-2 text-white text-xs font-medium truncate">
              {displayName}
            </div>
          </div>
        </div>
      )}
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm text-foreground truncate leading-none transition-opacity duration-150",
          isExpanded ? "opacity-0" : "opacity-100 delay-100",
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{displayName}</span>
      </span>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="absolute -top-1 -right-1 w-5 h-5 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-muted hover:text-foreground transition-colors shadow-sm z-10"
      aria-label={`Remove ${displayName}`}
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);
