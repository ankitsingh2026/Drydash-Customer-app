import { apiClient } from "@/lib/api/client";
import axios from "axios";

export const sendOtpApi = async (phone: string, hash: string) => {
  await apiClient.post("/v1/auth/send-otp", { phone, hash });
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

export const unActivatedUser = async () => {
  const { data } = await apiClient.patch("/v1/customers/me", {
    isActive: false,
  });

  return data;
};

export const refreshTokenApi = (refreshToken: string) => {
  console.log("i am beign called refresh token api");
  return axios.post("https://live.drydash.in/v1/auth/refresh-tokens", {
    refreshToken,
  });
};
