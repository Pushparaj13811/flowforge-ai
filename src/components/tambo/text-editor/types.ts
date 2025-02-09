import * as React from "react";

/**
 * Result of extracting images from clipboard data.
 */
export interface ImageItems {
  imageItems: File[];
  hasText: boolean;
}

/**
 * Minimal editor interface exposed to parent components.
 * Hides TipTap implementation details and exposes only necessary operations.
 */
export interface TamboEditor {
  /** Focus the editor at a specific position */
  focus(position?: "start" | "end"): void;
  /** Set the editor content */
  setContent(content: string): void;
  /** Append text to the end of the editor content */
  appendText(text: string): void;
  /** Get the text and resource names */
  getTextWithResourceURIs(): {
    text: string;
    resourceNames: Record<string, string>;
  };
  /** Check if a mention with the given id exists */
  hasMention(id: string): boolean;
  /** Insert a mention node with a following space */
  insertMention(id: string, label: string): void;
  /** Set whether the editor is editable */
  setEditable(editable: boolean): void;
}

/**
 * Base interface for suggestion items (resources and prompts).
 */
export interface SuggestionItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

/**
 * Represents a resource item that appears in the "@" mention dropdown.
 * Resources are referenced by ID/URI and appear as visual mention nodes in the editor.
 */
export interface ResourceItem extends SuggestionItem {
  componentData?: unknown;
}

/**
 * Represents a prompt item that appears in the "/" command dropdown.
 * Prompts contain text that gets inserted into the editor.
 */
export interface PromptItem extends SuggestionItem {
  /** The actual prompt text to insert into the editor */
  text: string;
}

/**
 * State for a suggestion popover.
 */
export interface SuggestionState<T extends SuggestionItem> {
  isOpen: boolean;
  items: T[];
  selectedIndex: number;
  position: { top: number; left: number; lineHeight: number } | null;
  command: ((item: T) => void) | null;
}

/**
 * Ref value for accessing suggestion state from TipTap callbacks.
 */
export interface SuggestionRef<T extends SuggestionItem> {
  state: SuggestionState<T>;
  setState: (update: Partial<SuggestionState<T>>) => void;
}

export interface TextEditorProps {
  value: string;
  onChange: (text: string) => void;
  onResourceNamesChange: (
    resourceNames:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Submit handler for Enter key behavior */
  onSubmit: (e: React.FormEvent) => Promise<void>;
  /** Called when an image is pasted into the editor */
  onAddImage: (file: File) => Promise<void>;
  /** Called when resource search query changes (for "@" mentions) - parent should update `resources` prop */
  onSearchResources: (query: string) => void;
  /** Current list of resources to show in the "@" suggestion menu (controlled) */
  resources: ResourceItem[];
  /** Called when prompt search query changes (for "/" commands) - parent should update `prompts` prop */
  onSearchPrompts: (query: string) => void;
  /** Current list of prompts to show in the "/" suggestion menu (controlled) */
  prompts: PromptItem[];
  /** Called when a resource is selected from the "@" menu */
  onResourceSelect: (item: ResourceItem) => void;
  /** Called when a prompt is selected from the "/" menu */
  onPromptSelect: (item: PromptItem) => void;
}
