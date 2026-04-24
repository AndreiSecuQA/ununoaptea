import axios from "axios";
import type {
  OrderCreateRequest,
  OrderCreateResponse,
  OrderStatusResponse,
} from "@/types/calendar.types";

// If VITE_API_URL isn't set at build time, fall back to:
//   - localhost:8000 in dev
//   - the frontend's own origin with `-backend` swapped for `-frontend` in prod
//     (Railway convention when services are named <app>-backend/<app>-frontend).
function resolveApiUrl(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit && explicit.length > 0) return explicit;
  if (import.meta.env.DEV) return "http://localhost:8000";
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Heuristic: if hostname contains "-frontend", swap to "-backend".
    if (host.includes("-frontend")) {
      return `${window.location.protocol}//${host.replace("-frontend", "-backend")}`;
    }
  }
  return "";
}

const API_URL = resolveApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

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
