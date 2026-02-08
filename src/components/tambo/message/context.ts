"use client";

import * as React from "react";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type { VariantProps } from "class-variance-authority";
import type { messageVariants } from "./utils";

/**
 * @typedef MessageContextValue
 * @property {"user" | "assistant"} role - The role of the message sender.
 * @property {VariantProps<typeof messageVariants>["variant"]} [variant] - Optional styling variant for the message container.
 * @property {TamboThreadMessage} message - The full Tambo thread message object.
 * @property {boolean} [isLoading] - Optional flag to indicate if the message is in a loading state.
 */
export interface MessageContextValue {
  role: "user" | "assistant";
  variant?: VariantProps<typeof messageVariants>["variant"];
  message: TamboThreadMessage;
  isLoading?: boolean;
}

/**
 * React Context for sharing message data and settings among sub-components.
 * @internal
 */
export const MessageContext = React.createContext<MessageContextValue | null>(null);

/**
 * Hook to access the message context.
 * Throws an error if used outside of a Message component.
 * @returns {MessageContextValue} The message context value.
 * @throws {Error} If used outside of Message.
 * @internal
 */
export const useMessageContext = () => {
  const context = React.useContext(MessageContext);
  if (!context) {
    throw new Error("Message sub-components must be used within a Message");
  }
  return context;
};
