import { useEffect, useState } from "react";
import { fetchOrderStatus } from "@/services/api";
import type { OrderStatusResponse } from "@/types/calendar.types";

const POLL_MS = 3000;
const MAX_POLLS = (2 * 60_000) / POLL_MS; // 2 minutes

export function useOrderStatus(orderId: string | undefined) {
  const [status, setStatus] = useState<OrderStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polls, setPolls] = useState(0);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (!orderId || stopped) return;
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const s = await fetchOrderStatus(orderId!);
        if (cancelled) return;
        setStatus(s);
        setError(null);
        if (s.status === "ready" || s.status === "failed" || s.status === "deleted") {
          setStopped(true);
          return;
        }
        setPolls((p) => p + 1);
        if (polls >= MAX_POLLS) {
          setStopped(true);
          return;
        }
        timer = window.setTimeout(tick, POLL_MS);
      } catch (e) {
        if (cancelled) return;
        setError((e as Error).message);
        timer = window.setTimeout(tick, POLL_MS * 2);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId, polls, stopped]);

  return { status, error, stopped };
}
