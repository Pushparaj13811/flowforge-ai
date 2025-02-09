"use client";

import * as React from "react";
import type { MessageInputContextValue } from "./types";

/**
 * React Context for sharing message input data and functions among sub-components.
 * @internal
 */
export const MessageInputContext = React.createContext<MessageInputContextValue | null>(null);

/**
 * Hook to access the message input context.
 * Throws an error if used outside of a MessageInput component.
 * @returns {MessageInputContextValue} The message input context value.
 * @throws {Error} If used outside of MessageInput.
 * @internal
 */
export const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};
