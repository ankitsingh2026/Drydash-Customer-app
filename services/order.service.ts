// services/order.service.ts
import { oldApiClient as api } from "@/lib/api/client";

export const getOrders = () => api.get("/orders");
export const getOrderById = (id: string) => api.get(`/orders/${id}`);
