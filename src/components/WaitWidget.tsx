"use client";

import { Clock3, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "@/lib/client/api";
import { usePolling } from "@/lib/client/usePolling";
import type { WaitPrediction } from "@/lib/types";
import { Badge, ModeBadge, Spinner } from "./ui";

export function WaitWidget({ refreshMs = 30_000 }: { refreshMs?: number }) {
  const [data, setData] = useState<WaitPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<WaitPrediction>("/api/waits"));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  usePolling(load, refreshMs);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return <Spinner label="Reading the queue" />;

  const tone = data.estimatedMinutes <= 5 ? "good" : data.estimatedMinutes <= 12 ? "warn" : "bad";
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-mocha">Estimated wait</p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {data.estimatedMinutes}
            <span className="text-lg font-medium text-mocha"> min</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone={tone}>
            <Clock3 size={11} aria-hidden /> {data.activeOrders} ahead
          </Badge>
          <Badge>{data.confidence} confidence</Badge>
        </div>
      </div>
      <p className="text-sm text-espresso-2">{data.explanation}</p>
      <div className="flex items-center justify-between text-xs text-mocha">
        <span>{data.bestTimeToVisit}</span>
        <span className="flex items-center gap-2">
          <ModeBadge mode={data.mode} />
          <button onClick={load} className="rounded-full p-1 hover:bg-cream-2" aria-label="Refresh wait time">
            <RefreshCw size={13} />
          </button>
        </span>
      </div>
    </div>
  );
}
