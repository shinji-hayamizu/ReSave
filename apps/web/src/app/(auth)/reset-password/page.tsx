import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'パスワードリセット',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
