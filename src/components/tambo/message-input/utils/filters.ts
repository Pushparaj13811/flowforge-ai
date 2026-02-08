"use client";

import type { ResourceItem, PromptItem } from "../../text-editor";

/**
 * Removes duplicate resource items based on ID.
 */
export const dedupeResourceItems = (resourceItems: ResourceItem[]) => {
  const seen = new Set<string>();
  return resourceItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/**
 * Filters resource items by query string.
 * Empty query returns all items.
 */
export const filterResourceItems = (
  resourceItems: ResourceItem[],
  query: string,
): ResourceItem[] => {
  if (query === "") return resourceItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return resourceItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};

/**
 * Filters prompt items by query string.
 * Empty query returns all items.
 */
export const filterPromptItems = (
  promptItems: PromptItem[],
  query: string,
): PromptItem[] => {
  if (query === "") return promptItems;

  const normalizedQuery = query.toLocaleLowerCase();
  return promptItems.filter((item) =>
    item.name.toLocaleLowerCase().includes(normalizedQuery),
  );
};
