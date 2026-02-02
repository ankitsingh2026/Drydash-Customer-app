export type RegisterPayload = {
  name: string;
  phone: string;
  password: string;
};

// export type AuthUser = {
//   id: string;
//   phone: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   role: string;
// };

export type AuthUser = {
  // existing fields (keep them as-is)
  id: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;

  // 🔹 ADD this (non-breaking)
  user?: {
    id: string;
    phone: string;
    role: string;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
  };

  // 🔹 ADD optional fields that backend already sends
  walletBalance?: number;
  isActive?: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type TokenInfo = {
  token: string;
  expires: string;
};

export type Tokens = {
  access: TokenInfo;
  refresh: TokenInfo;
};
