"use client";

import { Extension, type Editor } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionRef, ResourceItem, PromptItem } from "./types";
import { getPositionFromClientRect, checkMentionExists, createSuggestionKeyHandlers } from "./utils";

/**
 * Creates the resource mention configuration for TipTap Mention extension.
 * The items() function triggers the search - actual items come from props via stateRef.
 */
export function createResourceMentionConfig(
  onSearchChange: (query: string) => void,
  onSelect: (item: ResourceItem) => void,
  stateRef: React.MutableRefObject<SuggestionRef<ResourceItem>>,
): Omit<SuggestionOptions, "editor"> {
  return {
    char: "@",
    items: ({ query }) => {
      onSearchChange(query);
      return [];
    },

    render: () => {
      const createWrapCommand =
        (
          editor: Editor,
          tiptapCommand: (attrs: { id: string; label: string }) => void,
        ) =>
        (item: ResourceItem) => {
          if (checkMentionExists(editor, item.name)) return;
          tiptapCommand({ id: item.id, label: item.name });
          onSelect(item);
        };

      return {
        onStart: (props) => {
          stateRef.current.setState({
            isOpen: true,
            selectedIndex: 0,
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
          });
        },
        onUpdate: (props) => {
          stateRef.current.setState({
            position: getPositionFromClientRect(props.clientRect),
            command: createWrapCommand(props.editor, props.command),
            selectedIndex: 0,
          });
        },
        onKeyDown: ({ event }) => {
          const { state, setState } = stateRef.current;
          if (!state.isOpen) return false;

          const handlers = createSuggestionKeyHandlers(state, setState);
          const handler = handlers[event.key];
          if (handler) {
            event.preventDefault();
            return handler();
          }
          return false;
        },
        onExit: () => {
          stateRef.current.setState({ isOpen: false });
        },
      };
    },
  };
}

/**
 * Creates a custom TipTap extension for prompt commands using the Suggestion plugin.
 * The items() function triggers the search - actual items come from props via stateRef.
 */
export function createPromptCommandExtension(
  onSearchChange: (query: string) => void,
  onSelect: (item: PromptItem) => void,
  stateRef: React.MutableRefObject<SuggestionRef<PromptItem>>,
) {
  return Extension.create({
    name: "promptCommand",

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          items: ({ query, editor }) => {
            // Only show prompts when editor is empty (except for the "/" and query)
            const editorValue = editor.getText().replace("/", "").trim();
            if (editorValue.length > 0) {
              stateRef.current.setState({ isOpen: false });
              return [];
            }
            // Trigger search - actual items come from props via stateRef
            onSearchChange(query);
            return [];
          },
          render: () => {
            return {
              onStart: (props) => {
                const createCommand = (item: PromptItem) => {
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                  onSelect(item);
                };
                stateRef.current.setState({
                  isOpen: true,
                  selectedIndex: 0,
                  position: getPositionFromClientRect(props.clientRect),
                  command: createCommand,
                });
              },
              onUpdate: (props) => {
                const createCommand = (item: PromptItem) => {
                  props.editor.commands.deleteRange({
                    from: props.range.from,
                    to: props.range.to,
                  });
                  onSelect(item);
                };
                stateRef.current.setState({
                  position: getPositionFromClientRect(props.clientRect),
                  command: createCommand,
                  selectedIndex: 0,
                });
              },
              onKeyDown: ({ event }) => {
                const { state, setState } = stateRef.current;
                if (!state.isOpen) return false;

                const handlers = createSuggestionKeyHandlers(state, setState);
                const handler = handlers[event.key];
                if (handler) {
                  event.preventDefault();
                  return handler();
                }
                return false;
              },
              onExit: () => {
                stateRef.current.setState({ isOpen: false });
              },
            };
          },
        }),
      ];
    },
  });
}
