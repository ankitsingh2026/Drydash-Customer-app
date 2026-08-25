import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { walletApi } from "@/features/auth/wallet.api";
import { referralApi } from "@/features/auth/referral.api";
import { useAuth } from "./AuthContext";

/* ---------------- TYPES ---------------- */

export interface WalletBalance {
  balance: number;
  currency: string;
  status: string;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  lastTransactionAt: string | null;
}

export interface WalletTransaction {
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
}

export interface ReferralData {
  referralCode: string;
  referrerBonusAmount: number;
  refereeBonusAmount: number;
  qualificationType: string;
  qualificationOrderValue: number;
  qualificationOrderCount: number;
  isActive: boolean;
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  shareMessage?: string;
  referralLink?: string;
}

export interface ReferralHistoryItem {
  referralCode: string;
  referrerId: string;
  refereeId: string;
  referrerBonusAmount: number;
  refereeBonusAmount: number;
  status: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
}

type WalletContextType = {
  // Wallet state
  wallet: WalletBalance | null;
  transactions: WalletTransaction[];
  transactionsPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;

  // Referral state
  referralData: ReferralData | null;
  referralHistory: ReferralHistoryItem[];
  referralHistoryPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;

  // Loading states
  loading: boolean;
  loadingWallet: boolean;
  loadingTransactions: boolean;
  loadingReferral: boolean;
  loadingReferralHistory: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchWallet: () => Promise<void>;
  fetchTransactions: (params?: { page?: number; limit?: number }) => Promise<void>;
  fetchReferralData: () => Promise<void>;
  fetchReferralHistory: (params?: { page?: number; limit?: number }) => Promise<void>;
  checkWalletUsage: (amount: number) => Promise<any>;
  useWalletForPayment: (params: { orderId: string; amount: number; useFullBalance?: boolean }) => Promise<any>;
  createTopupOrder: (amount: number) => Promise<any>;
  verifyTopup: (params: { amount: number; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => Promise<any>;
  applyReferralCode: (referralCode: string) => Promise<any>;
  initializeCustomer: (appCustomerId: string, referralCode?: string) => Promise<any>;
  clearError: () => void;
};

/* ---------------- CONTEXT ---------------- */

export const WalletContext = createContext<WalletContextType | null>(null);

/* ---------------- PROVIDER ---------------- */

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsPagination, setTransactionsPagination] = useState<WalletContextType["transactionsPagination"]>(null);

  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralHistoryItem[]>([]);
  const [referralHistoryPagination, setReferralHistoryPagination] = useState<WalletContextType["referralHistoryPagination"]>(null);

  const [loading, setLoading] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const [loadingReferralHistory, setLoadingReferralHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Access auth user to auto-initialize wallet
  const { user } = useAuth();

  // Get appCustomerId from user
  const appCustomerId = user?.user?.id || user?.id;

  // Auto-fetch wallet data when user logs in
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      await fetchWallet();
      await fetchTransactions({ limit: 20 });
      await fetchReferralData();
    } catch (err) {
      console.error("Failed to load initial wallet data:", err);
    }
  };

  const clearError = () => setError(null);

  const fetchWallet = async () => {
    if (!appCustomerId) return;
    setLoadingWallet(true);
    setError(null);
    try {
      const data = await walletApi.getWalletDetails(appCustomerId);
      setWallet(data);
    } catch (err: any) {
      console.error("Failed to fetch wallet:", err);
      setError(err.response?.data?.message || "Failed to fetch wallet");
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchTransactions = async (params?: { page?: number; limit?: number }) => {
    if (!appCustomerId) return;
    setLoadingTransactions(true);
    setError(null);
    try {
      const data = await walletApi.getTransactionHistory({ ...params, appCustomerId });
      const txns = Array.isArray(data?.transactions) ? data.transactions : [];
      if (params?.page && params.page > 1) {
        setTransactions(prev => [...(prev || []), ...txns]);
      } else {
        setTransactions(txns);
      }
      setTransactionsPagination(data?.pagination || null);
    } catch (err: any) {
      console.error("Failed to fetch transactions:", err);
      setError(err.response?.data?.message || "Failed to fetch transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchReferralData = async () => {
    if (!appCustomerId) return;
    setLoadingReferral(true);
    setError(null);
    try {
      const [data, linkData] = await Promise.all([
        referralApi.getMyReferralCode(appCustomerId),
        referralApi.generateReferralLink(appCustomerId).catch(() => ({ success: false, data: null }))
      ]);
      const combinedData = {
        ...data,
        referralLink: linkData.data?.referralLink || "",
        shareMessage: linkData.data?.shareMessage || "",
      };
      setReferralData(combinedData);
    } catch (err: any) {
      console.error("Failed to fetch referral data:", err);
      // Don't set error - might not have referral code yet
    } finally {
      setLoadingReferral(false);
    }
  };

  const fetchReferralHistory = async (params?: { page?: number; limit?: number }) => {
    if (!appCustomerId) return;
    setLoadingReferralHistory(true);
    setError(null);
    try {
      const data = await referralApi.getReferralHistory({ ...params, appCustomerId });
      const refs = Array.isArray(data?.referrals) ? data.referrals : [];
      if (params?.page && params.page > 1) {
        setReferralHistory(prev => [...(prev || []), ...refs]);
      } else {
        setReferralHistory(refs);
      }
      setReferralHistoryPagination(data?.pagination || null);
    } catch (err: any) {
      console.error("Failed to fetch referral history:", err);
      setError(err.response?.data?.message || "Failed to fetch referral history");
    } finally {
      setLoadingReferralHistory(false);
    }
  };

  const checkWalletUsage = async (amount: number) => {
    if (!appCustomerId) throw new Error("User not logged in");
    try {
      return await walletApi.checkWalletUsage(amount, appCustomerId);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to check wallet usage");
    }
  };

  const useWalletForPayment = async (params: { orderId: string; amount: number; useFullBalance?: boolean }) => {
    if (!appCustomerId) throw new Error("User not logged in");
    try {
      console.log("Using wallet for payment with params:", { ...params, appCustomerId });
      return await walletApi.useWalletForPayment({ ...params, appCustomerId });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to process wallet payment");
    }
  };

  const createTopupOrder = async (amount: number) => {
    if (!appCustomerId) throw new Error("User not logged in");
    try {
      console.log('this is the amount', amount)
      return await walletApi.createTopupOrder(amount, appCustomerId);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to create topup order");
    }
  };

  const verifyTopup = async (params: { amount: number; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    if (!appCustomerId) throw new Error("User not logged in");
    try {
      return await walletApi.verifyTopup({ ...params, appCustomerId });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to verify topup");
    }
  };

  const applyReferralCode = async (referralCode: string) => {
    if (!appCustomerId) throw new Error("User not logged in");
    try {
      const res = await referralApi.applyReferralCode({
        appCustomerId,
        referralCode,
      });
      await fetchReferralData();
      await fetchReferralHistory();
      await fetchWallet();
      return res;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "Failed to apply referral code");
    }
  };

  const initializeCustomer = async (appCustomerId: string, referralCode?: string) => {
    try {
      const data = await referralApi.initializeCustomer({ appCustomerId, referralCode });
      if (data.data?.referralCode) {
        // Refresh referral data after init
        await fetchReferralData();
      }
      // Also fetch wallet
      await fetchWallet();
      return data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to initialize customer");
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        transactionsPagination,
        referralData,
        referralHistory,
        referralHistoryPagination,
        loading: loadingWallet || loadingTransactions || loadingReferral || loadingReferralHistory,
        loadingWallet,
        loadingTransactions,
        loadingReferral,
        loadingReferralHistory,
        error,
        fetchWallet,
        fetchTransactions,
        fetchReferralData,
        fetchReferralHistory,
        checkWalletUsage,
        useWalletForPayment,
        createTopupOrder,
        verifyTopup,
        applyReferralCode,
        initializeCustomer,
        clearError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export default WalletProvider;