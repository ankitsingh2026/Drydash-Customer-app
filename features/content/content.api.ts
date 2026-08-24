import { oldApiClient } from "@/lib/api/client";
import { LayoutApiResponse } from "./content.types";

export const getContentLayoutApi = async (): Promise<LayoutApiResponse> => {
  const res = await oldApiClient.get<LayoutApiResponse>("/v1/content/layout");
  return res.data;
};