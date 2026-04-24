import axios from "axios";
import type {
  OrderCreateRequest,
  OrderCreateResponse,
  OrderStatusResponse,
} from "@/types/calendar.types";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

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
