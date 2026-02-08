"use client";

/**
 * Message Input Component
 *
 * This file re-exports from the modular message-input/ directory structure.
 * All implementation has been moved to separate files for better maintainability.
 */

// Main component
export { MessageInput } from "./message-input/MessageInput";

// Sub-components
export {
  MessageInputTextarea,
  MessageInputPlainTextarea,
  MessageInputToolbar,
  MessageInputError,
  DictationButton,
  // Buttons
  MessageInputSubmitButton,
  MessageInputFileButton,
  MessageInputMcpConfigButton,
  MessageInputMcpPromptButton,
  MessageInputMcpResourceButton,
  // Images
  MessageInputStagedImages,
  MessageInputContexts,
} from "./message-input/components";

// Constants
export { messageInputVariants } from "./message-input/constants";

// Types
export type {
  ResourceProvider,
  PromptProvider,
  MessageInputProps,
  MessageInputTextareaProps,
  MessageInputPlainTextareaProps,
  MessageInputSubmitButtonProps,
  MessageInputErrorProps,
  MessageInputFileButtonProps,
  MessageInputMcpPromptButtonProps,
  MessageInputMcpResourceButtonProps,
  MessageInputStagedImagesProps,
} from "./message-input/types";

// Re-export types from text-editor for convenience
export type { PromptItem, ResourceItem } from "./text-editor";
