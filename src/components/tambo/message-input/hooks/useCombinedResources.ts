"use client";

import * as React from "react";
import { AtSign } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useTamboMcpResourceList } from "@tambo-ai/react/mcp";
import type { ResourceItem } from "../../text-editor";
import type { ResourceProvider } from "../types";
import { dedupeResourceItems, filterResourceItems } from "../utils";
import { EXTERNAL_SEARCH_DEBOUNCE_MS } from "../constants";

/**
 * Hook to get a combined resource list that merges MCP resources with an external provider.
 * Returns the combined, filtered resource items.
 *
 * @param externalProvider - Optional external resource provider
 * @param search - Search string to filter resources. For MCP servers, results are filtered locally.
 *                 For registry dynamic sources, the search is passed to listResources(search).
 */
export function useCombinedResourceList(
  externalProvider: ResourceProvider | undefined,
  search: string,
): ResourceItem[] {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const [debouncedSearch] = useDebounce(search, EXTERNAL_SEARCH_DEBOUNCE_MS);

  // Convert MCP resources to ResourceItems
  const mcpItems: ResourceItem[] = React.useMemo(
    () =>
      mcpResources
        ? (
            mcpResources as {
              resource: { uri: string; name?: string };
            }[]
          ).map((entry) => ({
            // Use the full URI (already includes serverKey prefix from MCP hook)
            // When inserted as @{id}, parseResourceReferences will strip serverKey before sending to backend
            id: entry.resource.uri,
            name: entry.resource.name ?? entry.resource.uri,
            icon: React.createElement(AtSign, { className: "w-4 h-4" }),
            componentData: { type: "mcp-resource", data: entry },
          }))
        : [],
    [mcpResources],
  );

  // Track external provider results with state
  const [externalItems, setExternalItems] = React.useState<ResourceItem[]>([]);

  // Fetch external resources when search changes
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
        console.error("Failed to fetch external resources", error);
        if (!cancelled) {
          setExternalItems([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalProvider, debouncedSearch]);

  // Combine and dedupe - MCP resources are already filtered by the hook
  // External items need to be filtered locally
  const combined = React.useMemo(() => {
    const filteredExternal = filterResourceItems(externalItems, search);
    return dedupeResourceItems([...mcpItems, ...filteredExternal]);
  }, [mcpItems, externalItems, search]);

  return combined;
}
