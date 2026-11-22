"use client";

import { useEffect, useRef } from "react";

/**
 * Run `fn` once after mount and then every `intervalMs`. The first run goes
 * through a zero-delay timer so no state is set synchronously inside the
 * effect body, and the latest `fn` is always used without re-subscribing.
 */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return;
    const run = () => void ref.current();
    const first = setTimeout(run, 0);
    const timer = setInterval(run, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [intervalMs, enabled]);
}
