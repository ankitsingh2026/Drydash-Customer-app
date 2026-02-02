import { apiClient, oldApiClient } from "@/lib/api/client";
import { order_details } from "./orders.types";

export const createOrderApi = async (order_details: order_details) => {
  const { data } = await oldApiClient.post(
    "/v1/addPickupThroughApp",
    order_details,
  );
  return data;
};

export const getAddressApi = async (id: any) => {
  const { data } = await apiClient.get(`/v1/addresses?customerid=${id}`);
  return data;
};

export const saveAddressApi = async (payload: any) => {
  const { data } = await apiClient.post("/v1/addresses", payload);
  return data;
};

export const getOrdersApi = async (phoneNumber: any) => {
  const { data } = await oldApiClient.get(
    `/app/getCustomerOrders/${phoneNumber}`,
  );
  return data;
};

export const getSingleOrderDetailssApi = async (phoneNumber: any) => {
  const { data } = await oldApiClient.get(
    `/app/getCustomerSingleOrderDetails/${phoneNumber}`,
  );
  return data;
};
