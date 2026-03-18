// const BASE = process.env.EXPO_PUBLIC_API_URL;

import { oldApiClient } from "@/lib/api/client";

// export async function createRazorpayOrderApi(amount: number, orderId: string) {
//   const res = await fetch(`${BASE}/api/payment/razorpay/create-order`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ amount, orderId }),
//   });
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }

// export async function verifyRazorpayOrderApi(payload: {
//   razorpay_order_id: string;
//   razorpay_payment_id: string;
//   razorpay_signature: string;
//   appOrderId: string;
// }) {
//   const res = await fetch(`${BASE}/api/payment/razorpay/verify`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// }

export const razorpayPaymentInitiate = async (orderid: string) => {
  try {
    console.log("this is the orderid inside", orderid);
    const res = await oldApiClient.post(`/v1/payments/initiate`, {
      orderId: orderid,
    });
    console.log("this is the res==>>", res);
    return res;
  } catch (error) {
    console.log("this is the error", error);
    return;
  }
};

export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  try {
    console.log("this is payload-->>", payload);
    const res = await oldApiClient.post("/v1/payments/verify", payload);

    console.log("verify payment response:", res.data);

    return res.data;
  } catch (error) {
    console.log("verify payment error:", error);
    return null;
  }
};
