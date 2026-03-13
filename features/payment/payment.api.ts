const BASE = process.env.EXPO_PUBLIC_API_URL;

export async function createRazorpayOrderApi(amount: number, orderId: string) {
  const res = await fetch(`${BASE}/api/payment/razorpay/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, orderId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function verifyRazorpayOrderApi(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  appOrderId: string;
}) {
  const res = await fetch(`${BASE}/api/payment/razorpay/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
