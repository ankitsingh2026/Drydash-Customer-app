export interface RazorpayCreateOrderRequest {
  amount: number;
}

export interface RazorpayCreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

export interface RazorpayVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayVerifyResponse {
  success: boolean;
  message?: string;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: any;
}
