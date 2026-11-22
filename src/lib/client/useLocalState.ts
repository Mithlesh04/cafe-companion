"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * useState persisted to Web Storage, built on useSyncExternalStore so the
 * server render and first client render agree (no hydration mismatch) and no
 * setState runs inside an effect.
 */
type Kind = "local" | "session";

const listeners = new Map<string, Set<() => void>>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();
const initials = new Map<string, unknown>();

function storage(kind: Kind): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function read<T>(kind: Kind, key: string, initial: T): T {
  const store = storage(kind);
  let raw: string | null = null;
  try {
    raw = store?.getItem(key) ?? null;
  } catch {
    raw = null;
  }
  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value: T = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

const noop = () => () => {};

/** True after hydration; false during SSR and the hydration render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function useStoredState<T>(key: string, initial: T, kind: Kind = "local"): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  if (!initials.has(key)) initials.set(key, initial);
  const stableInitial = initials.get(key) as T;

  const subscribe = useCallback(
    (cb: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.get(key)?.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => read(kind, key, stableInitial),
    () => stableInitial,
  );
  const hydrated = useHydrated();

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prev = read(kind, key, stableInitial);
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      const raw = JSON.stringify(next);
      try {
        storage(kind)?.setItem(key, raw);
      } catch {
        /* quota or private mode: keep in-memory snapshot only */
      }
      snapshots.set(key, { raw, value: next });
      notify(key);
    },
    [kind, key, stableInitial],
  );

  return [value, set, hydrated];
}

export function useLocalState<T>(key: string, initial: T) {
  return useStoredState<T>(key, initial, "local");
}
