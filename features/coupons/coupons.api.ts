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
  }
};

export const applyCouponApi = (data: {
  orderId: string;
  code: string;
  userId: string;
}) => {
  try {
    console.log("this is the data==>", data);
    oldApiClient.post("/v1/customercoupons/apply", data);
  } catch (error) {
    console.error("this is the error", error);
  }
};

export const removeCouponApi = (data: { orderId: string }) => {
  try {
    oldApiClient.post("/v1/customercoupons/remove", data);
  } catch (error) {
    console.log("error", error);
  }
};

export const confirmCouponApi = (data: { orderId: string }) => {
  try {
    oldApiClient.post("/v1/customercoupons/confirm", data);
  } catch (error) {
    console.error("this is the error==>>", error);
  }
};
