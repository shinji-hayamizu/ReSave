/**
 * Base user entity representing authenticated user data
 */
export type User = {
  id: string;
  email: string;
  createdAt: string;
};

/**
 * Extended auth user from Supabase Auth
 * Includes additional metadata from Supabase session
 */
export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

/**
 * Input for user login
 */
export type LoginInput = {
  email: string;
  password: string;
};

/**
 * Input for user signup/registration
 */
export type SignupInput = {
  email: string;
  password: string;
};

/**
 * Input for password reset request
 */
export type ResetPasswordInput = {
  email: string;
};
