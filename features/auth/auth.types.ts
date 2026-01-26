export type RegisterPayload = {
  name: string;
  phone: string;
  password: string;
};

export type AuthUser = {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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
