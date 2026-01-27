import { apiClient } from "@/lib/api/client";
import { order_details } from "./orders.types";

export const createOrderApi = async (order_details: order_details) => {
  const { data } = await apiClient.post("/v1/orders", order_details);
  return data;
};

export const getAddressApi = async () => {
  const { data } = await apiClient.get("/v1/addresses");
  return data;
};

export const saveAddressApi = async (payload: any) => {
  const { data } = await apiClient.post("/v1/addresses", payload);
  return data;
};

export const getOrdersApi = async () => {
  const { data } = await apiClient.post("/v1/orders");
  return data;
};
