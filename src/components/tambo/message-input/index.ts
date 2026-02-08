// Main component
export { MessageInput } from "./MessageInput";

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
} from "./components";

// Constants
export { messageInputVariants } from "./constants";

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
} from "./types";

// Re-export types from text-editor for convenience
export type { PromptItem, ResourceItem } from "../text-editor";
