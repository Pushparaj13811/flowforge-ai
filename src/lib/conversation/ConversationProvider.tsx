/**
 * @file ConversationProvider.tsx
 * @description React context provider for conversation state
 */

"use client";

import * as React from "react";

interface ConversationContextValue {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

const ConversationContext = React.createContext<ConversationContextValue>({
  conversationId: null,
  setConversationId: () => {},
});

export function useConversationContext() {
  return React.useContext(ConversationContext);
}

interface ConversationProviderProps {
  children: React.ReactNode;
  initialConversationId?: string;
  workflowId?: string;
}

export function ConversationProvider({
  children,
  initialConversationId,
  workflowId: _workflowId,
}: ConversationProviderProps) {
  const [conversationId, setConversationId] = React.useState<string | null>(
    initialConversationId ?? null
  );

  const value = React.useMemo(
    () => ({
      conversationId,
      setConversationId,
    }),
    [conversationId]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}
