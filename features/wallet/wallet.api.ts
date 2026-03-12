import type {
  RazorpayCreateOrderRequest,
  RazorpayCreateOrderResponse,
  RazorpayVerifyRequest,
  RazorpayVerifyResponse,
} from "./wallet.types";

// ── Create Razorpay order ──────────────────────────
export async function createRazorpayOrder(
  amount: number
): Promise<RazorpayCreateOrderResponse> {
  const resp = await fetch("/api/wallet/topup/razorpay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount } as RazorpayCreateOrderRequest),
  });

  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

// ── Verify payment signature ───────────────────────
export async function verifyRazorpayPayment(
  payload: RazorpayVerifyRequest
): Promise<RazorpayVerifyResponse> {
  const resp = await fetch("/api/wallet/topup/razorpay-verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}