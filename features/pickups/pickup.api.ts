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
  // Only call using phone number in format: 91XXXXXXXXXX (NO leading +)
  // and call this API only ONCE.
  const normalized = String(phone ?? "").trim();
  const digitsOnly = normalized.replace(/\D/g, "");

  const phoneWith91 = digitsOnly.length > 10 ? `91${digitsOnly.slice(-10)}` : `91${digitsOnly}`;

  const params = new URLSearchParams();
  params.set("phone", phoneWith91);

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
  try {
    const { data } = await oldApiClient.put(`/v1/rider/deletePickup/${id}`);
  return data;
  } catch (error) {
    console.log("this is the error in cancel api==>>",error)
  }
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

export const updatePickupThroughApp = async (
  pickupId: string,
  items: { itemId: string; quantity: number }[],
  specialInstructions?: string,
  isHeavy?: boolean,
  couponCode?: string,
) => {
  console.log("this is pickupid and cart items ss: >>>>", pickupId, items, specialInstructions, isHeavy, couponCode);
  const body: any = { items };
  if (specialInstructions !== undefined) body.specialInstructions = specialInstructions;
  if (isHeavy !== undefined) body.isHeavy = isHeavy;
  if (couponCode !== undefined) body.couponCode = couponCode;
  const { data } = await oldApiClient.patch(
    `/v1/updatePickupThroughApp/${pickupId}`,
    body,
  );
  return data;
};
