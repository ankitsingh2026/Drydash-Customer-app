import { oldApiClient } from "@/lib/api/client";
import { LayoutApiResponse, BlogsListApiResponse, BlogDetailApiResponse } from "./content.types";

export const getContentLayoutApi = async (): Promise<LayoutApiResponse> => {
  const res = await oldApiClient.get<LayoutApiResponse>("/v1/content/layout");
  return res.data;
};

export const getAllBlogsApi = async (): Promise<BlogsListApiResponse> => {
  const res = await oldApiClient.get<BlogsListApiResponse>("/v1/content/blogs");
  return res.data;
};

export const getBlogBySlugApi = async (slug: string): Promise<BlogDetailApiResponse> => {
  const res = await oldApiClient.get<BlogDetailApiResponse>(`/v1/content/blogs/${slug}`);
  return res.data;
};