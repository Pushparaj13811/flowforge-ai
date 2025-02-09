"use client";

import { STORAGE_KEY } from "../constants";

export const getStorageKey = (key: string) => `${STORAGE_KEY}.${key}`;

export const storeValueInSessionStorage = (key: string, value?: string) => {
  const storageKey = getStorageKey(key);
  if (value === undefined) {
    sessionStorage.removeItem(storageKey);
    return;
  }

  sessionStorage.setItem(storageKey, JSON.stringify({ rawQuery: value }));
};

export const getValueFromSessionStorage = (key: string): string => {
  const storedValue = sessionStorage.getItem(getStorageKey(key)) ?? "";
  try {
    const parsed = JSON.parse(storedValue);
    return parsed.rawQuery ?? "";
  } catch {
    return "";
  }
};
