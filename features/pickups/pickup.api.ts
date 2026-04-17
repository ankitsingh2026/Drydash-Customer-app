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
