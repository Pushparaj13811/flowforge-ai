"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useTamboMcpPromptList } from "@tambo-ai/react/mcp";
import type { PromptItem } from "../../text-editor";
import type { PromptProvider } from "../types";
import { filterPromptItems } from "../utils";
import { EXTERNAL_SEARCH_DEBOUNCE_MS } from "../constants";

/**
 * Hook to get a combined prompt list that merges MCP prompts with an external provider.
 * Returns the combined, filtered prompt items.
 *
 * @param externalProvider - Optional external prompt provider
 * @param search - Search string to filter prompts by name. MCP prompts are filtered via the hook.
 */
export function useCombinedPromptList(
  externalProvider: PromptProvider | undefined,
  search: string,
): PromptItem[] {
  // Pass search to MCP hook for filtering
  const { data: mcpPrompts } = useTamboMcpPromptList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP prompts to PromptItems (mark with mcp-prompt: prefix for special handling)
  const mcpItems: PromptItem[] = React.useMemo(
    () =>
      mcpPrompts
        ? (mcpPrompts as { prompt: { name: string } }[]).map((entry) => ({
            id: `mcp-prompt:${entry.prompt.name}`,
            name: entry.prompt.name,
            icon: React.createElement(FileText, { className: "w-4 h-4" }),
            text: "", // Text will be fetched when selected via useTamboMcpPrompt
          }))
        : [],
    [mcpPrompts],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<PromptItem[]>([]);

  // Fetch external prompts when search changes
  React.useEffect(() => {
    if (!externalProvider) {
      setExternalItems([]);
      return;
    }

    let cancelled = false;
    externalProvider
      .search(debouncedSearch)
      .then((items) => {
        if (!cancelled) {
          setExternalItems(items);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch external prompts", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine - MCP prompts are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterPromptItems(externalItems, search);
    return [...mcpItems, ...filteredExternal];
  }, [mcpItems, externalItems, search]);

  return combined;
}
