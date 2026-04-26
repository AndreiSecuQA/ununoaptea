import axios from "axios";
import type {
  OrderCreateRequest,
  OrderCreateResponse,
  OrderStatusResponse,
} from "@/types/calendar.types";

// If VITE_API_URL isn't set at build time, fall back to:
//   - localhost:8000 in dev
//   - the frontend's own origin with `-frontend` swapped for `-backend` in prod
//     (Railway convention when services are named <app>-frontend/<app>-backend
//     and also handles `<app>-frontend-production`/`<app>-backend-production`).
function resolveApiUrl(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit && explicit.length > 0) return explicit.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "http://localhost:8000";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("-frontend")) {
      return `${window.location.protocol}//${host.replace("-frontend", "-backend")}`;
    }
  }
  return "";
}

export const API_URL = resolveApiUrl();

// Log the resolved API URL on startup so users can debug a mis-set or
// missing VITE_API_URL by checking DevTools → Console.
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.info("[Unu Noaptea] API URL:", API_URL || "(unresolved)");
}

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Probe `/api/v1/health` to confirm the backend is reachable and CORS-clean.
 * Returns null on success, or a human-friendly Romanian error string.
 * Used before mutating requests (order create) so the user sees a precise
 * diagnostic instead of an opaque "Network Error".
 */
export async function checkBackendHealth(): Promise<string | null> {
  if (!API_URL) {
    return "Nu am putut determina URL-ul backend-ului. Setează VITE_API_URL pe deploy și redeployează frontend-ul.";
  }
  try {
    const res = await fetch(`${API_URL}/api/v1/health`, {
      method: "GET",
      mode: "cors",
    });
    if (!res.ok) {
      return `Backend-ul a răspuns ${res.status} la ${API_URL}/api/v1/health. Verifică log-urile serviciului backend.`;
    }
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return `Nu reușesc să contactez backend-ul la ${API_URL}. Verifică pe Railway că serviciul backend e pornit și că VITE_API_URL pe frontend îl indică corect. Detaliu tehnic: ${msg}`;
  }
}

export async function createOrder(
  payload: OrderCreateRequest
): Promise<OrderCreateResponse> {
  const { data } = await api.post<OrderCreateResponse>("/orders/create", payload);
  return data;
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const { data } = await api.get<OrderStatusResponse>(`/orders/${orderId}/status`);
  return data;
}

export function buildDownloadUrl(orderId: string, token: string): string {
  return `${API_URL}/api/v1/orders/${orderId}/download?token=${encodeURIComponent(token)}`;
}

export async function requestDataDeletion(email: string, orderId?: string) {
  const { data } = await api.post("/gdpr/delete-my-data", {
    email,
    order_id: orderId ?? null,
  });
  return data;
}

export async function fetchLegal(page: "privacy" | "terms" | "cookies"): Promise<string> {
  const { data } = await api.get<string>(`/legal/${page}`, {
    responseType: "text",
  });
  return data;
}
