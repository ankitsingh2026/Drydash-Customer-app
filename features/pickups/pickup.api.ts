import { oldApiClient } from "@/lib/api/client";

const normalizePhone = (phone: any) => String(phone ?? "").replace(/\D/g, "");

export const getCustomerPickups = async (phone: any, status?: any) => {
  const normalizedPhone = normalizePhone(phone);
  const params = new URLSearchParams();

  if (normalizedPhone) {
    params.set("phone", normalizedPhone);
  }
  console.log("Normalized Phone =>>>>:", normalizedPhone);

  if (status) {
    params.set(
      "status",
      Array.isArray(status) ? status.join(",") : String(status),
    );
  }

  const { data } = await oldApiClient.get(
    `/app/getCustomerPickups?${params.toString()}`,
  );

  return data;
};

export const cancelPickupApi = async (id: string) => {
  const { data } = await oldApiClient.put(`/v1/rider/deletePickup/${id}`);
  return data;
};

export const reschedulePickupApi = async (id: string, newDate: string) => {
  const { data } = await oldApiClient.put(`/v1/rider/reschedulePickup/${id}`, {
    newDate,
  });
  return data;
};
