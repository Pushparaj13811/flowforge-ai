"use client";

import * as React from "react";

const readFromStorage = <T>(key: string, initialValue: T): T => {
  if (typeof window === "undefined") return initialValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch {
    return initialValue;
  }
};

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [storedValue, setStoredValue] = React.useState<T>(() =>
    readFromStorage(key, initialValue)
  );

  const setValue = React.useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch {
          // Storage full or access denied
        }
        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
};

export const useLocalStorageString = (
  key: string,
  initialValue: string
): [string, (value: string) => void] => {
  const [storedValue, setStoredValue] = React.useState<string>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      return window.localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = React.useCallback(
    (value: string) => {
      setStoredValue(value);
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Storage full or access denied
      }
    },
    [key]
  );

  return [storedValue, setValue];
};
