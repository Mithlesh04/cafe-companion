import { env } from "../env";
import { MemoryStore } from "./memory";
import type { Store } from "./types";

export type { Store } from "./types";

declare global {
  var __cafeStore: Store | undefined;
}

/**
 * Process-wide store singleton. Kept on globalThis so Next.js hot reloads in
 * dev do not wipe pilot data every time a file is saved.
 */
export async function getStore(): Promise<Store> {
  if (globalThis.__cafeStore) return globalThis.__cafeStore;
  const e = env();
  if (e.FIRESTORE_ENABLED === "true") {
    const { FirestoreStore } = await import("./firestore");
    globalThis.__cafeStore = new FirestoreStore(e.GOOGLE_CLOUD_PROJECT);
  } else {
    globalThis.__cafeStore = new MemoryStore();
  }
  return globalThis.__cafeStore;
}

/** Test hook. */
export function setStore(store: Store | undefined) {
  globalThis.__cafeStore = store;
}
