"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import type { SuggestionItem, SuggestionState } from "../types";

/**
 * Props for the generic suggestion popover.
 */
interface SuggestionPopoverProps<T extends SuggestionItem> {
  state: SuggestionState<T>;
  onClose: () => void;
  defaultIcon: React.ReactNode;
  emptyMessage: string;
  /** Whether to use monospace font for the secondary text (id) */
  monoSecondary?: boolean;
}

/**
 * Generic popover component for suggestions (@resources and /prompts).
 */
export function SuggestionPopover<T extends SuggestionItem>({
  state,
  onClose,
  defaultIcon,
  emptyMessage,
  monoSecondary = false,
}: SuggestionPopoverProps<T>) {
  if (!state.isOpen || !state.position) return null;

  const sideOffset = state.position.lineHeight + 4;

  return (
    <Popover.Root
      open={state.isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <Popover.Anchor asChild>
        <div
          style={{
            position: "fixed",
            top: `${state.position.top}px`,
            left: `${state.position.left}px`,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Popover.Anchor>
      <Popover.Content
        side="bottom"
        align="start"
        sideOffset={sideOffset}
        className="z-50 w-96 rounded-md border bg-popover p-0 shadow-md animate-in fade-in-0 zoom-in-95"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        {state.items.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 p-1">
            {state.items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex items-start gap-2 px-2 py-2 text-sm rounded-md text-left",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  index === state.selectedIndex &&
                    "bg-accent text-accent-foreground",
                )}
                onClick={() => state.command?.(item)}
              >
                {item.icon ?? defaultIcon}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground truncate",
                      monoSecondary && "font-mono",
                    )}
                  >
                    {item.id}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
