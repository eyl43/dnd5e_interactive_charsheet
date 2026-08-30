import { useCallback, useEffect, useState } from "react";

// Everything the sheet tracks between sessions lives in localStorage under this
// namespace. Bump the version segment if a future change makes old saves unreadable.
const PREFIX = "lucien-harrow/v1/";

// Sets don't survive JSON on their own, and the sheet uses them for toggles.
const replacer = (_key, value) =>
  value instanceof Set ? { __type: "Set", values: [...value] } : value;

const reviver = (_key, value) =>
  value && typeof value === "object" && value.__type === "Set"
    ? new Set(value.values)
    : value;

export const serialize = (value) => JSON.stringify(value, replacer);

export const deserialize = (raw, fallback) => {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw, reviver);
  } catch {
    return fallback;
  }
};

// localStorage throws in private mode and when the quota is full. A sheet that
// can't save is still a usable sheet, so every access degrades to a no-op.
const readRaw = (key) => {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
};

const writeRaw = (key, raw) => {
  try {
    window.localStorage.setItem(PREFIX + key, raw);
    return true;
  } catch {
    return false;
  }
};

const saveListeners = new Set();

/** Subscribe to writes so the UI can show when the sheet was last saved. */
export const onSave = (fn) => {
  saveListeners.add(fn);
  return () => saveListeners.delete(fn);
};

/**
 * useState that persists to localStorage. Reads once on mount, writes on change.
 */
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => deserialize(readRaw(key), initialValue));

  useEffect(() => {
    const raw = serialize(value);
    // Skip the write when nothing actually changed, so hydrating on page load
    // doesn't report a save that never happened.
    if (raw === readRaw(key)) return;
    if (!writeRaw(key, raw)) return;
    const now = Date.now();
    for (const fn of saveListeners) fn(now);
  }, [key, value]);

  return [value, setValue];
}

/** Timestamp of the most recent save, or null if nothing has been saved yet. */
export function useLastSaved() {
  const [lastSaved, setLastSaved] = useState(null);
  useEffect(() => onSave(setLastSaved), []);
  return lastSaved;
}

const namespacedKeys = () => {
  const keys = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys;
};

/** The whole saved sheet as a plain object, ready to be written to a file. */
export function exportSheet() {
  const data = {};
  for (const key of namespacedKeys()) {
    data[key.slice(PREFIX.length)] = window.localStorage.getItem(key);
  }
  return { format: "dnd5e-charsheet", version: 1, savedAt: new Date().toISOString(), data };
}

/**
 * Replace the saved sheet with a previously exported payload.
 * Throws if the payload isn't one of our exports.
 */
export function importSheet(payload) {
  if (!payload || payload.format !== "dnd5e-charsheet" || typeof payload.data !== "object") {
    throw new Error("That file isn't a character sheet export.");
  }
  clearSheet();
  for (const [key, raw] of Object.entries(payload.data)) {
    if (typeof raw === "string") writeRaw(key, raw);
  }
}

/** Wipe every saved value, returning the sheet to its starting state. */
export function clearSheet() {
  for (const key of namespacedKeys()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing we can do */
    }
  }
}

/** Save the current sheet to a JSON file the player can stash or move between browsers. */
export function useDownloadSheet(characterName) {
  return useCallback(() => {
    const blob = new Blob([JSON.stringify(exportSheet(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${characterName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [characterName]);
}
