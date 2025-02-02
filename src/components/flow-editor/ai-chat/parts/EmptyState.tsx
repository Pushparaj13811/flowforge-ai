"use client";

import * as React from "react";
import { Bot } from "lucide-react";
import { SUGGESTIONS } from "../utils";

interface EmptyStateProps {
  onSelectSuggestion: (suggestion: string) => void;
}

export function EmptyState({ onSelectSuggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-medium mb-1">AI Workflow Assistant</p>
      <p className="text-xs text-muted-foreground mb-4">
        Ask me to modify the workflow, add nodes, or configure integrations.
      </p>
      <div className="space-y-2 w-full">
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion(suggestion)}
            className="w-full text-left px-3 py-2 text-xs bg-muted/50 hover:bg-muted rounded-lg transition-colors"
          >
            &ldquo;{suggestion}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}
