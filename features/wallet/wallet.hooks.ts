import { useState } from "react";
import RazorpayCheckout from "react-native-razorpay";
import { useTheme } from "../../context/ThemeContext";
import { createRazorpayOrder, verifyRazorpayPayment } from "./wallet.api";
import type {
  RazorpayPaymentError,
  RazorpayPaymentSuccess,
} from "./wallet.types";

export function useRazorpayTopUp(onSuccess: (amount: number) => void) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  async function topUp(amount: number) {
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    setLoading(true);
    try {
      // 1. Create order
      const { orderId, keyId } = await createRazorpayOrder(amount);

      // 2. Open Razorpay sheet
      const paymentData: RazorpayPaymentSuccess =
        await RazorpayCheckout.open({
          description: "Wallet Top-up",
          image: "https://your-logo-url.png",   // ← your logo
          currency: "INR",
          key: keyId,
          amount: String(amount * 100),          // paise
          order_id: orderId,
          name: "StudyE Wallet",
          prefill: {
            // email: user.email,
            // contact: user.phone,
          },
          theme: { color: theme.primary },
        });

      // 3. Verify
      const result = await verifyRazorpayPayment(paymentData);
      if (!result.success) throw new Error(result.error || "Verification failed");

      onSuccess(amount);
    } catch (err: unknown) {
      const rzpErr = err as RazorpayPaymentError;
      if (rzpErr?.code === 0) return; // user cancelled
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { topUp, loading };
}