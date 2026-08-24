import { oldApiClient } from "@/lib/api/client";

// The oldApiClient automatically adds Bearer token from AsyncStorage
// appCustomerId is passed as parameter to each API call

export const walletApi = {
  /**
   * Get wallet balance
   * GET /api/v1/wallet/balance
   */
  getBalance: async (): Promise<{ balance: number; currency: string }> => {
    const { data } = await oldApiClient.get("v1/wallet/balance");
    return data.data || data;
  },

  /**
   * Get wallet details with transactions summary
   * GET /api/v1/wallet?appCustomerId=<id>
   */
  getWalletDetails: async (appCustomerId?: string): Promise<{
    balance: number;
    currency: string;
    status: string;
    totalCredits: number;
    totalDebits: number;
    creditCount: number;
    debitCount: number;
    lastTransactionAt: string | null;
  }> => {
    const { data } = await oldApiClient.get("v1/wallet", { params: { appCustomerId } });
    return data.data || data;
  },

  /**
   * Get transaction history
   * GET /api/v1/wallet/transactions?appCustomerId=<id>
   */
  getTransactionHistory: async (params?: {
    appCustomerId?: string;
    limit?: number;
    page?: number;
    category?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    transactions: Array<{
      id: string;
      type: "credit" | "debit";
      amount: number;
      category: string;
      description: string;
      referenceId: string | null;
      referenceType: string | null;
      balanceAfter: number;
      status: string;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const { data } = await oldApiClient.get("v1/wallet/transactions", { params });
    return data.data || data;
  },

  /**
   * Check if wallet can be used for payment
   * POST /api/v1/wallet/check
   */
  checkWalletUsage: async (amount: number, appCustomerId?: string): Promise<{
    canUse: boolean;
    walletBalance: number;
    usableAmount: number;
    remainingAmount: number;
    isPartial: boolean;
    isFull: boolean;
  }> => {
    const { data } = await oldApiClient.post("v1/wallet/check", { amount, appCustomerId });
    return data.data || data;
  },

  /**
   * Use wallet for order payment
   * POST /api/v1/wallet/use
   */
  useWalletForPayment: async (params: {
    appCustomerId?: string;
    orderId: string;
    amount: number;
    useFullBalance?: boolean;
  }): Promise<{
    paymentType: "full" | "partial";
    walletAmount: number;
    gatewayAmount: number;
    transaction: {
      id: string;
      type: "credit" | "debit";
      amount: number;
      category: string;
      description: string;
      referenceId: string;
      referenceType: string;
      balanceAfter: number;
      status: string;
      createdAt: string;
    };
  }> => {
    const { data } = await oldApiClient.post("v1/wallet/use", params);
    return data.data || data;
  },

  /**
   * Create Razorpay order for wallet topup
   * POST /api/v1/wallet/topup
   */
  createTopupOrder: async (amount: number, appCustomerId?: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    key: string;
  }> => {
    const { data } = await oldApiClient.post("v1/wallet/topup", { amount, appCustomerId });
    return data.data || data;
  },

  /**
   * Verify and process wallet topup
   * POST /api/v1/wallet/topup/verify
   */
  verifyTopup: async (params: {
    appCustomerId?: string;
    amount: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{
    success: boolean;
    message: string;
    transaction: any;
    balanceAfter: number;
  }> => {
    const { data } = await oldApiClient.post("v1/wallet/topup/verify", params);
    return data.data || data;
  },
};

export default walletApi;