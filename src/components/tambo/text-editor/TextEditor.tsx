"use client";

import * as React from "react";
import { useImperativeHandle, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Document from "@tiptap/extension-document";
import HardBreak from "@tiptap/extension-hard-break";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import { Cuboid, FileText } from "lucide-react";

import type { TamboEditor, TextEditorProps, ResourceItem, PromptItem } from "./types";
import { getImageItems, getTextWithResourceURIs } from "./utils";
import { createResourceMentionConfig, createPromptCommandExtension } from "./extensions";
import { useSuggestionState } from "./hooks";
import { SuggestionPopover } from "./parts";

/**
 * Text editor component with resource ("@") and prompt ("/") support.
 */
export const TextEditor = React.forwardRef<TamboEditor, TextEditorProps>(
  (
    {
      value,
      onChange,
      onResourceNamesChange,
      onKeyDown,
      placeholder = "What do you want to do?",
      disabled = false,
      className,
      onSubmit,
      onAddImage,
      onSearchResources,
      resources,
      onSearchPrompts,
      prompts,
      onResourceSelect,
      onPromptSelect,
    },
    ref,
  ) => {
    // Suggestion states with refs for TipTap access
    const [resourceState, resourceRef] = useSuggestionState<ResourceItem>(resources);
    const [promptState, promptRef] = useSuggestionState<PromptItem>(prompts);

    // Consolidated ref for callbacks that TipTap needs to access
    const callbacksRef = useRef({
      onSearchResources,
      onResourceSelect,
      onSearchPrompts,
      onPromptSelect,
    });

    useEffect(() => {
      callbacksRef.current = {
        onSearchResources,
        onResourceSelect,
        onSearchPrompts,
        onPromptSelect,
      };
    }, [onSearchResources, onResourceSelect, onSearchPrompts, onPromptSelect]);

    // Stable callbacks for TipTap
    const stableSearchResources = useCallback(
      (query: string) => callbacksRef.current.onSearchResources(query),
      [],
    );

    const stableSearchPrompts = useCallback(
      (query: string) => callbacksRef.current.onSearchPrompts(query),
      [],
    );

    const handleResourceSelect = useCallback(
      (item: ResourceItem) => callbacksRef.current.onResourceSelect(item),
      [],
    );

    const handlePromptSelect = useCallback(
      (item: PromptItem) => callbacksRef.current.onPromptSelect(item),
      [],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey && value.trim()) {
          e.preventDefault();
          void onSubmit(e as React.FormEvent);
          return;
        }
        onKeyDown?.(e);
      },
      [onSubmit, value, onKeyDown],
    );

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        Document,
        Paragraph,
        Text,
        HardBreak,
        Placeholder.configure({ placeholder }),
        Mention.configure({
          HTMLAttributes: {
            class:
              "mention resource inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          },
          suggestion: createResourceMentionConfig(
            stableSearchResources,
            handleResourceSelect,
            resourceRef,
          ),
          renderLabel: ({ node }) => `@${(node.attrs.label as string) ?? ""}`,
        }),
        createPromptCommandExtension(
          stableSearchPrompts,
          handlePromptSelect,
          promptRef,
        ),
      ],
      content: value,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        const { text, resourceNames } = getTextWithResourceURIs(editor);
        if (text !== value) {
          onChange(text);
        }
        if (onResourceNamesChange) {
          onResourceNamesChange((prev) => ({ ...prev, ...resourceNames }));
        }
      },
      editorProps: {
        attributes: {
          class: cn(
            "tiptap",
            "prose prose-sm max-w-none focus:outline-none",
            "p-3 rounded-t-lg bg-transparent text-sm leading-relaxed",
            "min-h-[82px] max-h-[40vh] overflow-y-auto",
            "break-words whitespace-pre-wrap",
            className,
          ),
        },
        handlePaste: (_view, event) => {
          const { imageItems, hasText } = getImageItems(event.clipboardData);

          if (imageItems.length === 0) return false;

          if (!hasText) {
            event.preventDefault();
          }

          void (async () => {
            for (const item of imageItems) {
              try {
                await onAddImage(item);
              } catch (error) {
                console.error("Failed to add pasted image:", error);
              }
            }
          })();

          return !hasText;
        },
        handleKeyDown: (_view, event) => {
          const anyMenuOpen = resourceState.isOpen || promptState.isOpen;

          if (anyMenuOpen) return false;

          if (event.key === "Enter" && !event.shiftKey && editor) {
            const reactEvent = event as unknown as React.KeyboardEvent;
            handleKeyDown(reactEvent);
            return reactEvent.defaultPrevented;
          }

          return false;
        },
      },
    });

    useImperativeHandle(ref, () => {
      if (!editor) {
        return {
          focus: () => {},
          setContent: () => {},
          appendText: () => {},
          getTextWithResourceURIs: () => ({ text: "", resourceNames: {} }),
          hasMention: () => false,
          insertMention: () => {},
          setEditable: () => {},
        };
      }

      return {
        focus: (position?: "start" | "end") => {
          if (position) {
            editor.commands.focus(position);
          } else {
            editor.commands.focus();
          }
        },
        setContent: (content: string) => {
          editor.commands.setContent(content);
        },
        appendText: (text: string) => {
          editor.chain().focus("end").insertContent(text).run();
        },
        getTextWithResourceURIs: () => getTextWithResourceURIs(editor),
        hasMention: (id: string) => {
          if (!editor.state?.doc) return false;
          let exists = false;
          editor.state.doc.descendants((node) => {
            if (node.type.name === "mention") {
              const mentionId = node.attrs.id as string;
              if (mentionId === id) {
                exists = true;
                return false;
              }
            }
            return true;
          });
          return exists;
        },
        insertMention: (id: string, label: string) => {
          editor
            .chain()
            .focus()
            .insertContent([
              { type: "mention", attrs: { id, label } },
              { type: "text", text: " " },
            ])
            .run();
        },
        setEditable: (editable: boolean) => {
          editor.setEditable(editable);
        },
      };
    }, [editor]);

    const lastSyncedValueRef = useRef<string>(value);

    useEffect(() => {
      if (!editor) return;

      const { text: currentText } = getTextWithResourceURIs(editor);

      if (value !== currentText && value !== lastSyncedValueRef.current) {
        editor.commands.setContent(value);
        lastSyncedValueRef.current = value;
      } else if (value === currentText) {
        lastSyncedValueRef.current = value;
      }

      editor.setEditable(!disabled);
    }, [editor, value, disabled]);

    return (
      <div className="w-full">
        <SuggestionPopover
          state={resourceState}
          onClose={() => resourceRef.current.setState({ isOpen: false })}
          defaultIcon={<Cuboid className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          emptyMessage="No results found"
          monoSecondary
        />
        <SuggestionPopover
          state={promptState}
          onClose={() => promptRef.current.setState({ isOpen: false })}
          defaultIcon={<FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          emptyMessage="No prompts found"
        />
        <EditorContent editor={editor} />
      </div>
    );
  },
);

TextEditor.displayName = "TextEditor";
