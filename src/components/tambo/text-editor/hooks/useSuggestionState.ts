"use client";

import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import type { SuggestionItem, SuggestionState, SuggestionRef } from "../types";

/**
 * Hook to create suggestion state with a ref for TipTap access.
 */
export function useSuggestionState<T extends SuggestionItem>(
  externalItems?: T[],
): [SuggestionState<T>, React.MutableRefObject<SuggestionRef<T>>] {
  const [state, setStateInternal] = useState<SuggestionState<T>>({
    isOpen: false,
    items: externalItems ?? [],
    selectedIndex: 0,
    position: null,
    command: null,
  });

  const setState = useCallback((update: Partial<SuggestionState<T>>) => {
    setStateInternal((prev) => ({ ...prev, ...update }));
  }, []);

  const stateRef = useRef<SuggestionRef<T>>({ state, setState });

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = { state, setState };
  }, [state, setState]);

  // Sync external items when provided
  useEffect(() => {
    if (externalItems !== undefined) {
      setStateInternal((prev) => {
        if (prev.items === externalItems) {
          return prev;
        }

        const previousMaxIndex = Math.max(prev.items.length - 1, 0);
        const safePrevIndex = Math.min(
          Math.max(prev.selectedIndex, 0),
          previousMaxIndex,
        );

        const selectedItem = prev.items[safePrevIndex];
        const matchedIndex = selectedItem
          ? externalItems.findIndex((item) => item.id === selectedItem.id)
          : -1;

        const maxIndex = Math.max(externalItems.length - 1, 0);
        const nextSelectedIndex =
          matchedIndex >= 0 ? matchedIndex : Math.min(safePrevIndex, maxIndex);

        return {
          ...prev,
          items: externalItems,
          selectedIndex: nextSelectedIndex,
        };
      });
    }
  }, [externalItems]);

  return [state, stateRef];
}
