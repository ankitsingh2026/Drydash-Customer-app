import { oldApiClient } from "@/lib/api/client";

export const getCatalogApi = async (slug: any) => {
  console.log("this is the slug", slug);
  const res = await oldApiClient.get(`/v1/catalog/${slug}?isActive=true`);
  // console.log("this is the response==>>", res);
  return res;
};

export const getAllSearchedActiveItems = async (search: any) => {
  console.log("this is the search===>>", search);

  const res = await oldApiClient.get(
    `/v1/catalog/full?isActive=true&search=${search}`,
  );
  console.log("this is the response===>>", res);
  return res;
};
