import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('有効なメールアドレスを入力してください'),
  createdAt: z.string().datetime(),
});

export const loginSchema = z.object({
  email: z.string().min(1, '必須項目です').email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, '必須項目です'),
});

export const signupSchema = z
  .object({
    email: z.string().min(1, '必須項目です').email('有効なメールアドレスを入力してください'),
    password: z.string().min(8, '8文字以上で入力してください'),
    confirmPassword: z.string().min(1, '必須項目です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: z.string().min(1, '必須項目です').email('有効なメールアドレスを入力してください'),
});

export type User = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
