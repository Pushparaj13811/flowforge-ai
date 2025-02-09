"use client";

import * as React from "react";
import { useTamboThread, useTamboThreadInput, useIsTamboTokenUpdating } from "@tambo-ai/react";
import { useTamboMcpPrompt } from "@tambo-ai/react/mcp";
import { cn } from "@/lib/utils";
import { TextEditor, type PromptItem } from "../../text-editor";
import { useMessageInputContext } from "../context";
import { useCombinedResourceList, useCombinedPromptList } from "../hooks";
import { MAX_IMAGES, IS_PASTED_IMAGE } from "../constants";
import type { MessageInputTextareaProps } from "../types";

/**
 * Rich-text textarea component for entering message text with @ mention support.
 * Uses the TipTap-based TextEditor which supports:
 * - @ mention autocomplete for interactables plus optional static items and async fetchers
 * - Keyboard navigation (Enter to submit, Shift+Enter for newline)
 * - Image paste handling via the thread input context
 *
 * **Note:** This component uses refs internally to ensure callbacks stay fresh,
 * so consumers can pass updated providers on each render without worrying about
 * closure issues with the TipTap editor.
 *
 * @component MessageInput.Textarea
 * @example
 * ```tsx
 * <MessageInput>
 *   <MessageInput.Textarea
 *     placeholder="Type your message..."
 *     resourceProvider={{
 *       search: async (query) => {
 *         // Return custom resources
 *         return [{ id: "foo", name: "Foo" }];
 *       }
 *     }}
 *   />
 * </MessageInput>
 * ```
 */
export const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  resourceProvider,
  promptProvider,
  onResourceSelect,
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, handleSubmit, editorRef, setImageError } =
    useMessageInputContext();
  const { isIdle } = useTamboThread();
  const { addImage, images } = useTamboThreadInput();
  const isUpdatingToken = useIsTamboTokenUpdating();
  // Resource names are extracted from editor at submit time, no need to track in state
  const setResourceNames = React.useCallback(
    (
      _resourceNames:
        | Record<string, string>
        | ((prev: Record<string, string>) => Record<string, string>),
    ) => {
      // No-op - we extract resource names directly from editor at submit time
    },
    [],
  );

  // Track search state for resources (controlled by TextEditor)
  const [resourceSearch, setResourceSearch] = React.useState("");

  // Track search state for prompts (controlled by TextEditor)
  const [promptSearch, setPromptSearch] = React.useState("");

  // Get combined resource list (MCP + external provider), filtered by search
  const resourceItems = useCombinedResourceList(
    resourceProvider,
    resourceSearch,
  );

  // Get combined prompt list (MCP + external provider), filtered by search
  const promptItems = useCombinedPromptList(promptProvider, promptSearch);

  // State for MCP prompt fetching (since we can't call hooks inside get())
  const [selectedMcpPromptName, setSelectedMcpPromptName] = React.useState<
    string | null
  >(null);
  const { data: selectedMcpPromptData } = useTamboMcpPrompt(
    selectedMcpPromptName ?? "",
  );

  // Handle MCP prompt insertion when data is fetched
  React.useEffect(() => {
    if (selectedMcpPromptData && selectedMcpPromptName) {
      const promptMessages = selectedMcpPromptData?.messages;
      if (promptMessages) {
        const promptText = promptMessages
          .map((msg) => {
            if (msg.content?.type === "text") {
              return msg.content.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");

        const editor = editorRef.current;
        if (editor) {
          editor.setContent(promptText);
          setValue(promptText);
          editor.focus("end");
        }
      }
      setSelectedMcpPromptName(null);
    }
  }, [selectedMcpPromptData, selectedMcpPromptName, editorRef, setValue]);

  // Handle prompt selection - check if it's an MCP prompt
  const handlePromptSelect = React.useCallback((item: PromptItem) => {
    if (item.id.startsWith("mcp-prompt:")) {
      const promptName = item.id.replace("mcp-prompt:", "");
      setSelectedMcpPromptName(promptName);
    }
  }, []);

  // Handle image paste - mark as pasted and add to thread
  const pendingImagesRef = React.useRef(0);

  const handleAddImage = React.useCallback(
    async (file: File) => {
      if (images.length + pendingImagesRef.current >= MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} uploads at a time`);
        return;
      }
      setImageError(null);
      pendingImagesRef.current += 1;
      try {
        file[IS_PASTED_IMAGE] = true;
        await addImage(file);
      } finally {
        pendingImagesRef.current -= 1;
      }
    },
    [addImage, images, setImageError],
  );

  return (
    <div
      className={cn("flex-1", className)}
      data-slot="message-input-textarea"
      {...props}
    >
      <TextEditor
        ref={editorRef}
        value={value}
        onChange={setValue}
        onResourceNamesChange={setResourceNames}
        onSubmit={handleSubmit}
        onAddImage={handleAddImage}
        placeholder={placeholder}
        disabled={!isIdle || isUpdatingToken}
        className="bg-background text-foreground"
        onSearchResources={setResourceSearch}
        resources={resourceItems}
        onSearchPrompts={setPromptSearch}
        prompts={promptItems}
        onResourceSelect={onResourceSelect ?? (() => {})}
        onPromptSelect={handlePromptSelect}
      />
    </div>
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";
