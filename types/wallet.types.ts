// ─────────────────────────────────────────────────────────────
// wallet.types.ts  –  Wallet + Razorpay integration types
// ─────────────────────────────────────────────────────────────

// ── Wallet balance ────────────────────────────────────────────
export interface WalletBalance {
  balance: number;
  currency: string; // "INR"
  lastUpdated: string; // ISO date string
}

// ── Saved card (from your /api/wallet/cards endpoint) ─────────
export interface SavedCard {
  id: string;
  brand: string; // "visa" | "mastercard" | "rupay" etc.
  last4: string;
  expiry: string; // "MM/YY"
  tokenId?: string; // Razorpay token id for recurring
}

// ── Transaction ───────────────────────────────────────────────
export type TransactionType = "credit" | "debit";
export type TransactionStatus = "success" | "failed" | "pending" | "refunded";

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number; // in ₹
  description: string;
  createdAt: string; // ISO date string
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
}

// ── Razorpay — Create Order ───────────────────────────────────

/** POST /api/wallet/topup/razorpay  →  request body */
export interface RazorpayCreateOrderRequest {
  amount: number; // in ₹  (backend converts to paise)
}

/** POST /api/wallet/topup/razorpay  →  response */
export interface RazorpayCreateOrderResponse {
  orderId: string; // rzp order id  e.g. "order_xxxxxxxxxx"
  amount: number; // in paise
  currency: string; // "INR"
  keyId: string; // rzp_live_xxxxxxxxxx  (safe to send to client)
}

// ── Razorpay — Checkout options (passed to RazorpayCheckout.open) ──
export interface RazorpayCheckoutOptions {
  description: string;
  image?: string;
  currency: string;
  key: string;
  amount: string; // paise as string
  order_id: string;
  name: string;
  prefill?: RazorpayPrefill;
  theme?: RazorpayTheme;
  notes?: Record<string, string>;
  retry?: { enabled: boolean; max_count: number };
}

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string; // phone with country code e.g. "+919876543210"
}

export interface RazorpayTheme {
  color: string; // hex e.g. "#6C63FF"
  backdrop_color?: string;
  hide_topbar?: boolean;
}

// ── Razorpay — Payment success payload ───────────────────────
/** Returned by RazorpayCheckout.open() on success */
export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string; // pay_xxxxxxxxxx
  razorpay_order_id: string; // order_xxxxxxxxxx
  razorpay_signature: string; // HMAC-SHA256 signature
}

// ── Razorpay — Payment error payload ─────────────────────────
/** Thrown by RazorpayCheckout.open() on failure / cancel */
export interface RazorpayPaymentError {
  code: number; // 0 = user cancelled, 2 = network error
  description: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

// ── Razorpay — Verify ─────────────────────────────────────────

/** POST /api/wallet/topup/razorpay-verify  →  request body */
export type RazorpayVerifyRequest = RazorpayPaymentSuccess;

/** POST /api/wallet/topup/razorpay-verify  →  response */
export interface RazorpayVerifyResponse {
  success: boolean;
  newBalance?: number; // updated wallet balance after credit
  transactionId?: string;
  error?: string;
}

// ── UPI Intent ────────────────────────────────────────────────
export interface UpiIntentParams {
  pa: string; // payee VPA  e.g. "merchant@upi"
  pn: string; // payee name
  am: string; // amount as string
  cu: string; // currency "INR"
  tn: string; // transaction note
}

// ── Top-up state (used in WalletPage component) ───────────────
export type TopUpMethod = "razorpay" | "upi_intent";

export interface TopUpState {
  amount: string;
  method: TopUpMethod;
  upiId: string;
  loading: boolean;
}
