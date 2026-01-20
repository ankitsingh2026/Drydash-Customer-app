export type RegisterPayload = {
  name: string;
  phone: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
