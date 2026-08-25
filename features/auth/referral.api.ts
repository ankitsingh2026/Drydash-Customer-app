import { oldApiClient } from "@/lib/api/client";

export const referralApi = {
  /**
   * Initialize wallet and referral code for new customer
   * POST /api/v1/referral/init
   */
  initializeCustomer: async (params: {
    appCustomerId: string;
    referralCode?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      walletCreated: boolean;
      referralCode: string;
      referralApplied: boolean;
    };
  }> => {
    const { data } = await oldApiClient.post("v1/referral/init", params);
    return data;
  },

  /**
   * Get my referral code and stats
   * GET /api/v1/referral/my-code?appCustomerId=<id>
   */
  getMyReferralCode: async (appCustomerId?: string): Promise<{
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
  }> => {
    const { data } = await oldApiClient.get("/v1/referral/my-code", { params: { appCustomerId } });
    return data.data;
  },

  /**
   * Validate a referral code
   * POST /api/v1/referral/validate
   */
  validateReferralCode: async (referralCode: string, appCustomerId?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      referrerBonusAmount: number;
      refereeBonusAmount: number;
    } | null;
  }> => {
    const { data } = await oldApiClient.post("/v1/referral/validate", { referralCode, appCustomerId });
    return data;
  },

  /**
   * Generate referral link for sharing
   * GET /api/v1/referral/generate-link
   */
  generateReferralLink: async (appCustomerId: string): Promise<{
    success: boolean;
    data: {
      referralCode: string;
      referralLink: string;
      shareMessage: string;
    };
  }> => {
    const { data } = await oldApiClient.get("/v1/referral/generate-link", { params: { appCustomerId } });
    return data;
  },

  /**
   * Apply a referral code
   * POST /api/v1/referral/apply
   */
  applyReferralCode: async (params: {
    appCustomerId: string;
    referralCode: string;
    source?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      referralCode: string;
      referrerId: string;
      refereeId: string;
      referrerBonusAmount: number;
      refereeBonusAmount: number;
      status: string;
      expiresAt: string | null;
    };
  }> => {
    const { data } = await oldApiClient.post("v1/referral/apply", params);
    return data;
  },

  /**
   * Get referral statistics
   * GET /api/v1/referral/stats?appCustomerId=<id>
   */
  getReferralStats: async (appCustomerId?: string): Promise<{
    referralCode: string;
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    expiredReferrals: number;
    totalEarnings: number;
  }> => {
    const { data } = await oldApiClient.get("/v1/referral/stats", { params: { appCustomerId } });
    return data.data;
  },

  /**
   * Get referral history
   * GET /api/v1/referral/history?appCustomerId=<id>
   */
  getReferralHistory: async (params?: {
    appCustomerId?: string;
    limit?: number;
    page?: number;
    status?: string;
  }): Promise<{
    referrals: Array<{
      referralCode: string;
      referrerId: string;
      refereeId: string;
      referrerBonusAmount: number;
      refereeBonusAmount: number;
      status: string;
      qualifiedAt: string | null;
      rewardedAt: string | null;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const { data } = await oldApiClient.get("/v1/referral/history", { params });
    return data.data || data;
  },
};

export default referralApi;