import { apiClient } from "@/lib/api/client";

export const sendOtpApi = async (phone: string) => {
  await apiClient.post("/v1/auth/send-otp", { phone });
};

export const verifyOtpApi = async (phone: string, otp: string) => {
  const { data } = await apiClient.post("/v1/auth/verify-otp", {
    phone,
    otp,
  });
  return data;
};

export const updateUserApi = async (payload: {
  firstName: string;
  lastName: string;
  email?: string;
}) => {
  const { data } = await apiClient.patch("/v1/customers/me", payload);
  return data;
};

export const getMeApi = async () => {
  const { data } = await apiClient.get("/v1/customers/me");
  return data;
};
