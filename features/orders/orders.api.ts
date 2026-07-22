import { apiClient, oldApiClient } from "@/lib/api/client";

import { CreatePickupRequest } from "./orders.types";

export const convertSlotTimeFormat = (slotTime: string): string => {
  if (!slotTime) return slotTime;
  
  const match = slotTime.match(/(\d+):\d+\s*(AM|PM)\s*-\s*(\d+):\d+\s*(AM|PM)/i);
  
  if (match) {
    const startHour = match[1];
    const startPeriod = match[2].toUpperCase();
    const endHour = match[3];
    const endPeriod = match[4].toUpperCase();
    return `${startHour}${startPeriod} - ${endHour}${endPeriod}`;
  }
  
  return slotTime;
};

export interface BookingCustomerDetails {
  appCustomerId: string;
  name: string;
  phone: string;
}

export interface CreateBookingPayload {
  zoneId: string;
  slotTime: string;
  customerDetails: BookingCustomerDetails;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: {
      bookingId: string;
      zoneId: string;
      date: string;
      slotTime: string;
      customerDetails: BookingCustomerDetails;
      status: string;
      createdAt: string;
    };
    availability: {
      totalCapacity: number;
      bookedCount: number;
      availableCapacity: number;
    };
  };
}

export const createBookingApi = async (payload: CreateBookingPayload): Promise<BookingResponse> => {
  console.log("Creating booking with payload=======>>>>:", payload);
  const { data } = await oldApiClient.post(
    "/v1/bookings/create",
    payload,
  );
  return data;
};

const isCustomerId = (value: any) => /[a-z]/i.test(String(value ?? ""));

export const createOrderApi = async (orderDetails: CreatePickupRequest) => {
  console.log("Creating order with details=======>>>>:", orderDetails);
  const { data } = await oldApiClient.post(
    "/v1/addPickupThroughApp",
    orderDetails,
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

export const updateAddressApi = async (id: any, payload: any) => {
  console.log("this is the payload of the api===>", payload);
  const { data } = await apiClient.patch(`/v1/addresses/${id}`, payload);
  console.log("this is the data===>>", data);
  return data;
};
export const deleteAddressApi = async (id: any) => {
  console.log("deleting address with id:", id);
  const { data } = await apiClient.delete(`/v1/addresses/${id}`);
  return data;
}

export const getOrdersApi = async (phoneNumber: any) => {
  // Only send phone number with +91 prefix (nothing else).
  const normalized = String(phoneNumber ?? "").trim();
  const digitsOnly = normalized.replace(/\D/g, "");

  // If user already provided 91xxxx..., keep last 10 digits; otherwise use as-is.
  const phoneWith91 = digitsOnly.length > 10 ? `91${digitsOnly.slice(-10)}` : `91${digitsOnly}`;
  // Backend expects phone in format: 91XXXXXXXXXX (NO leading +)
  const candidate = `91${digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly}`;

  console.log("getOrdersApi phone candidate:", candidate);
  const response = await oldApiClient.get(`/app/getCustomerOrders/${candidate}`);
  return response.data;
};

export const getSingleOrderDetailsApi = async (orderId: any) => {
  console.log("orderId for single order details orderid=======>", orderId);
  const { data } = await oldApiClient.get(
    `/app/getCustomerSingleOrderDetails/${orderId}`,
  );
  return data;
};

export const removeDeliveredOrderApi = async (id: string) => {
  console.log("Archiving delivered order id:", id);
  const { data } = await oldApiClient.patch(`/app/removeDeliveredOrder/${id}`);
  console.log("Archive response:", data); 
  return data;
};

export const generateInvoiceApi = async (orderId: string) => {
  const { data } = await oldApiClient.get(`/v1/generateInvoice/${orderId}`);
  console.log("Invoice generation response====>:", data);
  return data;
};
