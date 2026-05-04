import { oldApiClient } from "@/lib/api/client";

export const fetchAllValidCoupons = async (cartAmount: any, category: any) => {
  try {
    console.log("i am called ---->>>", cartAmount, category);
    const res = await oldApiClient.get("/v1/customercoupons", {
      params: {
        cartAmount,
        category,
      },
    });

    console.log("this is the dataaaa====>>>>>>>>>", res?.data);
    return res?.data;
  } catch (error) {
    console.log("this is the error==>>", error);
    throw error;
  }
};

export const applyCouponApi = async (data: {
  orderId: string;
  code: string;
  userId: string;
}) => {
  try {
    console.log("this is the data==>", data);
    const res = await oldApiClient.post("/v1/customercoupons/apply", data);
    return res?.data;
  } catch (error) {
    console.error("this is the error", error);
    throw error;
  }
};

export const removeCouponApi = async (data: { orderId: string }) => {
  try {
    const res = await oldApiClient.post("/v1/customercoupons/remove", data);
    return res?.data;
  } catch (error) {
    console.log("error", error);
    throw error;
  }
};

export const confirmCouponApi = async (data: { orderId: string }) => {
  try {
    const res = await oldApiClient.post("/v1/customercoupons/confirm", data);
    return res?.data;
  } catch (error) {
    console.error("this is the error==>>", error);
    throw error;
  }
};