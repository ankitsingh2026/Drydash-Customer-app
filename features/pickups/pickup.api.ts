import { oldApiClient } from "@/lib/api/client";

export const getCustomerPickups = async (phone: any, status: any) => {
  const { data } = await oldApiClient.get(
    `/app/getCustomerPickups?phone=91${phone}&status=${status}`,
  );

  return data;
};
