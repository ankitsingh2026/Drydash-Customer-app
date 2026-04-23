import { oldApiClient } from "@/lib/api/client";
import { normalizeDigits } from "@/utils/phone";

const normalizePhone = (phone: any) => normalizeDigits(phone);
const isCustomerId = (value: any) => /[a-z]/i.test(String(value ?? ""));

const buildPickupPhoneParams = (phone: any) => {
  const normalizedPhone = normalizePhone(phone);
  const candidates = new Set<string>();

  if (normalizedPhone) {
    candidates.add(normalizedPhone);

    if (normalizedPhone.length === 10) {
      candidates.add(`91${normalizedPhone}`);
    }

    if (normalizedPhone.length > 10 && normalizedPhone.startsWith("91")) {
      const withoutCountryCode = normalizedPhone.slice(2);
      if (withoutCountryCode.length === 10) {
        candidates.add(withoutCountryCode);
      }
    }
  }

  return Array.from(candidates);
};

export const getCustomerPickups = async (phone: any, status?: any) => {
  const params = new URLSearchParams();

  if (isCustomerId(phone)) {
    params.set("customerid", String(phone));
  } else {
    const phoneCandidates = buildPickupPhoneParams(phone);
    let responseData: any = null;

    for (const candidate of phoneCandidates) {
      params.set("phone", candidate);

      if (status) {
        params.set(
          "status",
          Array.isArray(status) ? status.join(",") : String(status),
        );
      }

      console.log("Normalized Phone =>>>:", candidate);

      const { data } = await oldApiClient.get(
        `/app/getCustomerPickups?${params.toString()}`,
      );

      responseData = data;
      if (Array.isArray(responseData?.pickups) && responseData.pickups.length > 0) {
        return responseData;
      }

      params.delete("phone");
      params.delete("status");
    }

    return responseData ?? { pickups: [] };
  }

  if (isCustomerId(phone)) {
    console.log("Customer ID =>>>:", String(phone));
  }

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

export const getCustomerSinglePickupDetails = async (pickupId: string) => {
  try {
    const res = await oldApiClient.get(
      `/app/getCustomerSinglePickupDetails/${pickupId}`
    );
    return res.data;
  } catch (error: any) {
    throw error?.response?.data || error;
  }
};

export const getActivePickupOrOrder = async (phone: string) => {
  try {
    const res = await oldApiClient.get(
      `/app/getActivePickupOrOrder/${phone}`
    );
    return res;
  } catch (error) {
    console.log("Active booking API error", error);
    return null;
  }
};