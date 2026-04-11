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
  console.log("i am calleddddd--->>", id);
  const { data } = await apiClient.get(`/v1/addresses?customerid=${id}`);
  console.log("this is the dataa--->>>>>", data);
  return data;
};

export const saveAddressApi = async (payload: any) => {
  const { data } = await apiClient.post("/v1/addresses", payload);
  return data;
};

export const updateAddressApi = async (payload: any) => {
  console.log("this is the payload of the api===>", payload);
  const { data } = await apiClient.patch("/v1/addressupdate", payload);
  console.log("this is the data===>>", data);
  return data;
};

export const getOrdersApi = async (phoneNumber: any) => {
  console.log("phoneNumber", phoneNumber);
  const { data } = await oldApiClient.get(
    `/app/getCustomerOrders/${phoneNumber}`,
  );
  console.log("thi is the all data: : : ", data);
  return data;
};

export const getSingleOrderDetailssApi = async (phoneNumber: any) => {
  const { data } = await oldApiClient.get(
    `/app/getCustomerSingleOrderDetails/${phoneNumber}`,
  );
  return data;
};
