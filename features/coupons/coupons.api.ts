import { oldApiClient } from "@/lib/api/client";

export const fetchAllValidCoupons = async (
  cartAmount: number,
  id?: string,
  serviceTypes?: string[]
) => {
  try {
    let res = null

    if(id){
     res = await oldApiClient.post(`/v1/customercoupons?cartAmount=${cartAmount}&id=${id}`, {
      serviceTypes: serviceTypes,
      userId: id
    });
    }else{
    res = await oldApiClient.post(`/v1/customercoupons?cartAmount=${cartAmount}`, {
      serviceTypes: serviceTypes
    });
    }

    return res.data;
  } catch (error: any) {
    console.log("Coupon API Error:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });

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