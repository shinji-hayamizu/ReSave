import dynamic from 'next/dynamic';

export const metadata = {
  title: 'パスワード更新',
};

const UpdatePasswordForm = dynamic(
  () => import('@/components/auth/update-password-form').then(m => m.UpdatePasswordForm),
  { ssr: false }
);

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}
