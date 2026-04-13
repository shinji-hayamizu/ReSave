export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  email: string;
  password: string;
};

export type ResetPasswordInput = {
  email: string;
};
