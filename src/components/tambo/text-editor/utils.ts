import type { Editor } from "@tiptap/react";
import type { ImageItems, SuggestionItem, SuggestionState } from "./types";

/**
 * Returns images array and hasText bool from clipboard data.
 * @param clipboardData - The clipboard data from a paste event
 * @returns Object containing extracted images array and whether text was present
 */
export function getImageItems(
  clipboardData: DataTransfer | null | undefined,
): ImageItems {
  const items = Array.from(clipboardData?.items ?? []);
  const imageItems: File[] = [];

  for (const item of items) {
    if (!item.type.startsWith("image/")) {
      continue;
    }

    const image = item.getAsFile();
    if (image) {
      imageItems.push(image);
    }
  }

  const text = clipboardData?.getData("text/plain") ?? "";

  return {
    imageItems,
    hasText: text.length > 0,
  };
}

/**
 * Utility function to convert TipTap clientRect to position coordinates.
 * Includes line height for proper spacing when popup flips above cursor.
 */
export function getPositionFromClientRect(
  clientRect?: (() => DOMRect | null) | null,
): { top: number; left: number; lineHeight: number } | null {
  if (!clientRect) return null;
  const rect = clientRect();
  if (!rect) return null;
  const lineHeight = rect.height || 20; // Fallback to 20px if height not available
  return { top: rect.bottom, left: rect.left, lineHeight };
}

/**
 * Internal helper to check if a mention exists in a raw TipTap Editor.
 */
export function checkMentionExists(editor: Editor, label: string): boolean {
  if (!editor.state?.doc) return false;
  let exists = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const mentionLabel = node.attrs.label as string;
      if (mentionLabel === label) {
        exists = true;
        return false;
      }
    }
    return true;
  });
  return exists;
}

/**
 * Custom text extraction that serializes mention nodes with their ID (resource URI).
 */
export function getTextWithResourceURIs(editor: Editor | null): {
  text: string;
  resourceNames: Record<string, string>;
} {
  if (!editor?.state?.doc) return { text: "", resourceNames: {} };

  let text = "";
  const resourceNames: Record<string, string> = {};

  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      const id = node.attrs.id ?? "";
      const label = node.attrs.label ?? "";
      text += `@${id}`;
      if (label && id) {
        resourceNames[id] = label;
      }
    } else if (node.type.name === "hardBreak") {
      text += "\n";
    } else if (node.isText) {
      text += node.text;
    }
    return true;
  });

  return { text, resourceNames };
}

/**
 * Create keyboard handlers for suggestion navigation.
 */
export function createSuggestionKeyHandlers<T extends SuggestionItem>(
  state: SuggestionState<T>,
  setState: (update: Partial<SuggestionState<T>>) => void
): Record<string, () => boolean> {
  return {
    ArrowUp: () => {
      if (state.items.length === 0) return false;
      setState({
        selectedIndex: (state.selectedIndex - 1 + state.items.length) % state.items.length,
      });
      return true;
    },
    ArrowDown: () => {
      if (state.items.length === 0) return false;
      setState({
        selectedIndex: (state.selectedIndex + 1) % state.items.length,
      });
      return true;
    },
    Enter: () => {
      const item = state.items[state.selectedIndex];
      if (item && state.command) {
        state.command(item);
        return true;
      }
      return false;
    },
    Escape: () => {
      setState({ isOpen: false });
      return true;
    },
  };
}
