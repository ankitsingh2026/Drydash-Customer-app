import { oldApiClient } from "@/lib/api/client";

export const createOrderPaymentApi = async (paymentObj: any) => {
  const { data } = await oldApiClient.post("/v1/payments/initiate", paymentObj);
  return data;
};
