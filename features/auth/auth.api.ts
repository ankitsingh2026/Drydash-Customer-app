import { apiClient } from "@/lib/api/client";
import { AuthResponse, RegisterPayload } from "./auth.types";

export const registerApi = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/register", payload);
  return data;
};
